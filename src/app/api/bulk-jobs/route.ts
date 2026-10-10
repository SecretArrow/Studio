import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { assertSameOrigin, ok, parseBody, rateLimit, requireUser, route } from "@/lib/api-utils"

/** GET /api/bulk-jobs — own bulk generation jobs, newest first */
export const GET = route(async () => {
  const user = await requireUser()
  const jobs = await db.bulkJob.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return ok({ jobs })
})

const createSchema = z.object({
  projectId: z.string().optional(),
  total: z.number().int().min(0).max(100_000).default(0),
})

/** POST /api/bulk-jobs — open a job whose progress is reported via PATCH */
export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await requireUser()
  rateLimit(req, "bulkjob", 60, 60_000)
  const body = await parseBody(req, createSchema)
  const job = await db.bulkJob.create({
    data: { ownerId: user.id, projectId: body.projectId, total: body.total },
  })
  return ok({ job }, { status: 201 })
})
