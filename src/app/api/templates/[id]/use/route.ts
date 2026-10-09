import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ApiError, ok, route, assertSameOrigin } from "@/lib/api-utils"
import { getSessionUser, ensurePersonalWorkspace } from "@/lib/auth"
import type { DesignDoc } from "@/lib/design/types"

type Ctx = { params: Promise<{ id: string }> }

/** POST /api/templates/[id]/use — create a personal editable project from a template */
export const POST = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) throw new ApiError(401, "Sign in to use templates", "unauthorized")
  const template = await db.template.findUnique({ where: { id } })
  if (!template) throw new ApiError(404, "Template not found")
  const workspaceId = await ensurePersonalWorkspace(user.id)

  const project = await db.project.create({
    data: {
      name: `${template.name}`,
      type: template.type,
      width: template.width,
      height: template.height,
      contentJson: template.contentJson,
      thumbnail: template.thumbnail,
      ownerId: user.id,
      workspaceId,
      templateId: template.id,
    },
    select: { id: true, name: true, type: true, updatedAt: true },
  })
  const doc = JSON.parse(template.contentJson) as DesignDoc
  return ok({ project, doc }, { status: 201 })
})
