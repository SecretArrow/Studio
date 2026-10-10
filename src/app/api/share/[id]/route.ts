import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, route, assertSameOrigin } from "@/lib/api-utils"
import { audit } from "@/lib/auth"
import { requireUser } from "@/lib/api-utils"

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({ revoked: z.boolean().optional(), role: z.enum(["viewer", "commenter", "editor"]).optional() })

export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await requireUser()
  const link = await db.shareLink.findUnique({ where: { id }, include: { project: true } })
  if (!link) throw new ApiError(404, "Link not found")
  if (link.project.ownerId !== user.id) throw new ApiError(403, "Only the owner can manage links")
  const body = await parseBody(req, patchSchema)
  const updated = await db.shareLink.update({ where: { id }, data: body, select: { id: true, revoked: true, role: true } })
  if (body.revoked) await audit("share.revoke", user.id, link.projectId)
  return ok({ link: updated })
})

export const DELETE = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await requireUser()
  const link = await db.shareLink.findUnique({ where: { id }, include: { project: true } })
  if (!link) throw new ApiError(404, "Link not found")
  if (link.project.ownerId !== user.id) throw new ApiError(403, "Only the owner can manage links")
  await db.shareLink.delete({ where: { id } })
  return ok({ ok: true })
})
