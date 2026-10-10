import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, route, assertSameOrigin } from "@/lib/api-utils"
import { getSessionUser, ensurePersonalWorkspace } from "@/lib/auth"

type Ctx = { params: Promise<{ id: string }> }

export const POST = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) return ok({ error: "Sign in required" }, { status: 401 })
  const source = await db.project.findUnique({ where: { id } })
  if (!source || source.deletedAt) return ok({ error: "Project not found" }, { status: 404 })
  if (source.ownerId !== user.id) return ok({ error: "Not allowed" }, { status: 403 })
  const workspaceId = await ensurePersonalWorkspace(user.id)
  const copy = await db.project.create({
    data: {
      name: `${source.name} copy`,
      type: source.type,
      width: source.width,
      height: source.height,
      contentJson: source.contentJson,
      thumbnail: source.thumbnail,
      ownerId: user.id,
      workspaceId,
      templateId: source.templateId,
    },
    select: { id: true, name: true, updatedAt: true },
  })
  return ok({ project: copy }, { status: 201 })
})
