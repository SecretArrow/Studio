import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ApiError, ok, route, assertSameOrigin } from "@/lib/api-utils"
import { audit, getSessionUser } from "@/lib/auth"
import { getProjectAccess } from "@/lib/projects"

type Ctx = { params: Promise<{ id: string; versionId: string }> }

/** Restore a project version snapshot (the current state is snapshotted first). */
export const POST = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id, versionId } = await ctx.params
  const user = await getSessionUser()
  const { project } = await getProjectAccess(id, user, "edit")
  const version = await db.projectVersion.findUnique({ where: { id: versionId } })
  if (!version || version.projectId !== id) throw new ApiError(404, "Version not found")

  await db.projectVersion.create({
    data: {
      projectId: id,
      label: "Before restore",
      contentJson: project.contentJson,
      thumbnail: project.thumbnail,
      createdById: user!.id,
    },
  })
  const updated = await db.project.update({
    where: { id },
    data: { contentJson: version.contentJson },
    select: { id: true, updatedAt: true },
  })
  await audit("project.restore_version", user?.id, id, { versionId })
  return ok({ project: updated })
})
