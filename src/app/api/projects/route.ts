import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, route, assertSameOrigin } from "@/lib/api-utils"
import { getSessionUser, ensurePersonalWorkspace } from "@/lib/auth"
import { SCHEMA_VERSION, createDoc, type DesignDoc } from "@/lib/design/types"
import { getPreset } from "@/lib/design/presets"

/** GET /api/projects — list current user's projects (q, type, folderId, favorite, trash, sort, limit, offset) */
export const GET = route(async (req: NextRequest) => {
  const user = await getSessionUser()
  if (!user) return ok({ projects: [], total: 0, guest: true })
  const sp = req.nextUrl.searchParams
  const q = sp.get("q")?.trim() || ""
  const type = sp.get("type") || undefined
  const folderId = sp.get("folderId") || undefined
  const favorite = sp.get("favorite") === "1"
  const trash = sp.get("trash") === "1"
  const sort = sp.get("sort") || "recent"
  const limit = Math.min(parseInt(sp.get("limit") || "60", 10) || 60, 200)
  const offset = parseInt(sp.get("offset") || "0", 10) || 0

  const workspaceId = await ensurePersonalWorkspace(user.id)
  const where = {
    workspaceId,
    deletedAt: trash ? { not: null } : null,
    ...(type ? { type } : {}),
    ...(favorite ? { favorite: true } : {}),
    ...(folderId ? { folderId } : {}),
    ...(q ? { name: { contains: q } } : {}),
  }
  const orderBy = sort === "name" ? { name: "asc" as const } : sort === "created" ? { createdAt: "desc" as const } : { updatedAt: "desc" as const }

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true, name: true, type: true, width: true, height: true, thumbnail: true,
        favorite: true, folderId: true, updatedAt: true, createdAt: true, deletedAt: true,
      },
    }),
    db.project.count({ where }),
  ])
  return ok({ projects, total })
})

const createSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  presetId: z.string().optional(),
  templateId: z.string().optional(),
  folderId: z.string().optional(),
  doc: z.unknown().optional(),
})

/** POST /api/projects — create blank project from preset/template/raw doc */
export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await getSessionUser()
  if (!user) throw new ApiError(401, "Sign in to save projects to the cloud", "unauthorized")
  const body = await parseBody(req, createSchema)
  const workspaceId = await ensurePersonalWorkspace(user.id)

  let name = body.name || "Untitled design"
  let type: DesignDoc["type"] = "canvas"
  let width = 1080
  let height = 1080
  let doc: DesignDoc

  if (body.templateId) {
    const template = await db.template.findUnique({ where: { id: body.templateId } })
    if (!template) throw new ApiError(404, "Template not found")
    const parsed = JSON.parse(template.contentJson) as DesignDoc
    doc = parsed
    type = template.type as DesignDoc["type"]
    width = template.width
    height = template.height
    name = body.name || `${template.name} copy`
  } else if (body.presetId) {
    const preset = getPreset(body.presetId)
    if (!preset) throw new ApiError(400, "Unknown preset")
    type = preset.type
    width = preset.width
    height = preset.height
    doc = createDoc(type, width, height, name)
    if (type === "website") {
      doc.config = {
        siteName: "My Site",
        theme: { primary: "#8b5cf6", accent: "#f59e0b", background: "#ffffff", text: "#111827", headingFont: "Poppins", bodyFont: "Inter", radius: 12 },
        seo: { title: "My Site", description: "Built with Studio" },
        pages: [{ id: "home", name: "Home", path: "/", sections: [] }],
      }
    }
    if (type === "email") {
      doc.config = { subject: "Subject line", preheader: "", backgroundColor: "#f4f4f5", contentBackground: "#ffffff", fontFamily: "Inter", textColor: "#111827", accentColor: "#8b5cf6", width: 600, blocks: [] }
    }
  } else if (body.doc) {
    const parsed = body.doc as DesignDoc
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.pages)) throw new ApiError(400, "Invalid doc payload")
    doc = { ...parsed, schemaVersion: SCHEMA_VERSION }
    type = doc.type
    width = doc.width
    height = doc.height
  } else {
    doc = createDoc("canvas", width, height, name)
  }

  const project = await db.project.create({
    data: {
      name,
      type,
      width,
      height,
      contentJson: JSON.stringify(doc),
      ownerId: user.id,
      workspaceId,
      folderId: body.folderId,
      templateId: body.templateId,
    },
    select: { id: true, name: true, type: true, width: true, height: true, updatedAt: true },
  })
  return ok({ project }, { status: 201 })
})
