import { NextRequest } from "next/server"
import path from "node:path"
import { promises as fs } from "node:fs"
import { db } from "@/lib/db"
import { ApiError, assertSameOrigin, ok, requireUser, route } from "@/lib/api-utils"

export const runtime = "nodejs"

const UPLOAD_ROOT = "/home/z/my-project/upload"

type Ctx = { params: Promise<{ id: string }> }

/** DELETE /api/assets/[id] — owner only; removes the file from disk best-effort + the row */
export const DELETE = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const { id } = await ctx.params

  const asset = await db.asset.findUnique({ where: { id } })
  if (!asset) throw new ApiError(404, "Asset not found")
  if (asset.ownerId !== user.id) throw new ApiError(403, "You can only delete your own uploads")

  const m = asset.url.match(/^\/api\/files\/(\d{4}-\d{2})\/([A-Za-z0-9._-]+)$/)
  if (m) {
    const safe = path.basename(m[2])
    await fs.unlink(path.join(UPLOAD_ROOT, m[1], safe)).catch(() => {})
  }
  await db.asset.delete({ where: { id } })
  return ok({ deleted: true })
})
