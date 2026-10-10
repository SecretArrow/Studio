import { db } from "@/lib/db"
import { ok, requireUser, route } from "@/lib/api-utils"

/** GET /api/admin/projects — admin only: 100 most recent projects with owner email */
export const GET = route(async () => {
  await requireUser(["admin"])
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      type: true,
      width: true,
      height: true,
      favorite: true,
      shareMode: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
      ownerId: true,
      owner: { select: { email: true, name: true } },
    },
  })
  return ok({ projects })
})
