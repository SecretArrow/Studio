import { db } from "@/lib/db"
import { ApiError, ok, requireUser, route } from "@/lib/api-utils"

/**
 * GET /api/account/export — full data export for the signed-in user as a JSON
 * download: profile, projects (incl. contentJson), comments, asset metadata, brand kits.
 */
export const GET = route(async () => {
  const user = await requireUser()

  const [profile, projects, comments, assets, brandKits] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, name: true, role: true, locale: true, theme: true,
        avatarUrl: true, emailVerifiedAt: true, createdAt: true, updatedAt: true,
      },
    }),
    db.project.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" } }),
    db.comment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, projectId: true, pageId: true, elementId: true, body: true,
        parentId: true, resolved: true, createdAt: true,
      },
    }),
    db.asset.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, kind: true, url: true, filename: true, mime: true, size: true,
        license: true, tags: true, createdAt: true,
      },
    }),
    db.brandKit.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" } }),
  ])

  if (!profile) throw new ApiError(404, "Account not found")

  return ok(
    { exportedAt: new Date().toISOString(), profile, projects, comments, assets, brandKits },
    { headers: { "Content-Disposition": 'attachment; filename="studio-export.json"' } },
  )
})
