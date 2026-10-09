import { db } from "@/lib/db"
import { ok, requireUser, route } from "@/lib/api-utils"

/** GET /api/admin/users — admin only: user list with related-row counts */
export const GET = route(async () => {
  await requireUser(["admin"])
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      locale: true,
      emailVerifiedAt: true,
      createdAt: true,
      _count: { select: { projects: true, assets: true, comments: true, bulkJobs: true } },
    },
  })
  return ok({ users })
})
