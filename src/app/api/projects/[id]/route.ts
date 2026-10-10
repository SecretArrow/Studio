import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, route, assertSameOrigin, safeJson } from "@/lib/api-utils"
import { audit, getSessionUser } from "@/lib/auth"
import { getProjectAccess } from "@/lib/projects"
import { SCHEMA_VERSION, type DesignDoc } from "@/lib/design/types"

type Ctx = { params: Promise<{ id: string }> }

export const GET = route(async (req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params
  const user = await getSessionUser()
  const shareToken = req.nextUrl.searchParams.get("share")
  const { project, role } = await getProjectAccess(id, user, "read", shareToken)
  return ok({
    project: {
      id: project.id, name: project.name, type: project.type, width: project.width, height: project.height,
      contentJson: project.contentJson, thumbnail: project.thumbnail, favorite: project.favorite,
      shareMode: project.shareMode, folderId: project.folderId, updatedAt: project.updatedAt, createdAt: project.createdAt,
    },
    role,
  })
})

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  contentJson: z.string().max(30 * 1024 * 1024).optional(),
  thumbnail: z.string().max(1_500_000).optional(),
  favorite: z.boolean().optional(),
  folderId: z.string().nullable().optional(),
  shareMode: z.enum(["private", "link-view", "link-comment", "link-edit"]).optional(),
  /** optimistic concurrency: ISO timestamp the client last saw */
  baseUpdatedAt: z.string().optional(),
  force: z.boolean().optional(),
})

export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await getSessionUser()
  const shareToken = req.nextUrl.searchParams.get("share")
  const { project, role } = await getProjectAccess(id, user, "edit", shareToken)
  const body = await parseBody(req, patchSchema)

  if (body.contentJson !== undefined && role !== "owner" && role !== "editor") {
    throw new ApiError(403, "This link only allows viewing/commenting")
  }

  // Conflict detection: if the client is based on an older version and another
  // actor saved meanwhile, refuse with 409 unless force=true.
  if (body.contentJson !== undefined && body.baseUpdatedAt && !body.force) {
    const base = new Date(body.baseUpdatedAt).getTime()
    if (project.updatedAt.getTime() - base > 1500) {
      return ok({ conflict: true, serverUpdatedAt: project.updatedAt, serverName: project.name }, { status: 409 })
    }
  }

  // validate doc JSON before storing
  if (body.contentJson !== undefined) {
    const doc = safeJson<DesignDoc | null>(body.contentJson, null)
    if (!doc || !Array.isArray(doc.pages) || typeof doc.width !== "number") {
      throw new ApiError(400, "Invalid design document")
    }
    doc.schemaVersion = SCHEMA_VERSION
  }

  const data: Record<string, unknown> = {}
  for (const k of ["name", "contentJson", "thumbnail", "favorite", "shareMode"] as const) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.folderId !== undefined) data.folderId = body.folderId

  const updated = await db.project.update({ where: { id: project.id }, data, select: { id: true, name: true, updatedAt: true } })
  return ok({ project: updated, conflict: false })
})

export const DELETE = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) throw new ApiError(401, "Sign in required")
  const { project, role } = await getProjectAccess(id, user, "edit")
  if (role !== "owner") throw new ApiError(403, "Only the owner can delete a project")
  const hard = req.nextUrl.searchParams.get("hard") === "1"
  if (hard) {
    await db.project.delete({ where: { id: project.id } })
    await audit("project.hard_delete", user.id, project.id)
  } else if (!project.deletedAt) {
    await db.project.update({ where: { id: project.id }, data: { deletedAt: new Date() } })
    await audit("project.trash", user.id, project.id)
  }
  return ok({ ok: true })
})
