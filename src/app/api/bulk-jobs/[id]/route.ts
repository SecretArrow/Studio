import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, assertSameOrigin, ok, parseBody, requireUser, route } from "@/lib/api-utils"

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  done: z.number().int().min(0).max(1_000_000).optional(),
  status: z.enum(["pending", "running", "done", "failed", "cancelled"]).optional(),
  error: z.string().max(2000).nullable().optional(),
})

/** PATCH /api/bulk-jobs/[id] — progress reporting (owner only) */
export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const { id } = await ctx.params

  const job = await db.bulkJob.findUnique({ where: { id } })
  if (!job) throw new ApiError(404, "Job not found")
  if (job.ownerId !== user.id) throw new ApiError(403, "Not your job")

  const body = await parseBody(req, patchSchema)
  const data: { done?: number; status?: string; error?: string | null } = {}
  if (body.done !== undefined) data.done = body.done
  if (body.status !== undefined) data.status = body.status
  if (body.error !== undefined) data.error = body.error

  const updated = await db.bulkJob.update({
    where: { id },
    data,
    select: { id: true, status: true, total: true, done: true, error: true, updatedAt: true },
  })
  return ok({ job: updated })
})
