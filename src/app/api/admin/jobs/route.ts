import { db } from "@/lib/db"
import { ok, requireUser, route } from "@/lib/api-utils"

/** GET /api/admin/jobs — admin only: recent bulk jobs + failed count */
export const GET = route(async () => {
  await requireUser(["admin"])
  const [jobs, failed] = await Promise.all([
    db.bulkJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { owner: { select: { email: true, name: true } } },
    }),
    db.bulkJob.count({ where: { status: "failed" } }),
  ])
  return ok({ jobs, failed })
})
