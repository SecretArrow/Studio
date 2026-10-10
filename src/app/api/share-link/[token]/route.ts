import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ApiError, ok, route } from "@/lib/api-utils"

type Ctx = { params: Promise<{ token: string }> }

/** Resolve a share link token → project payload (no auth needed; token is the secret). */
export const GET = route(async (_req: NextRequest, ctx: Ctx) => {
  const { token } = await ctx.params
  const link = await db.shareLink.findUnique({ where: { token } })
  if (!link || link.revoked || (link.expiresAt && link.expiresAt < new Date())) {
    throw new ApiError(404, "This share link is invalid or has been revoked")
  }
  const project = await db.project.findUnique({ where: { id: link.projectId } })
  if (!project || project.deletedAt) throw new ApiError(404, "Project not found")
  return ok({
    project: {
      id: project.id, name: project.name, type: project.type, width: project.width, height: project.height,
      contentJson: project.contentJson, thumbnail: project.thumbnail,
    },
    role: link.role,
  })
})
