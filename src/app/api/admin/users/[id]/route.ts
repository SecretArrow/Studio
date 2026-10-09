import { NextRequest } from "next/server"
import path from "node:path"
import { promises as fs } from "node:fs"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, assertSameOrigin, ok, parseBody, requireUser, route } from "@/lib/api-utils"
import { audit } from "@/lib/auth"

export const runtime = "nodejs"

const UPLOAD_ROOT = "/home/z/my-project/upload"

type Ctx = { params: Promise<{ id: string }> }

function uploadFilePath(url: string): string | null {
  const m = url.match(/^\/api\/files\/(\d{4}-\d{2})\/([A-Za-z0-9._-]+)$/)
  if (!m) return null
  return path.join(UPLOAD_ROOT, m[1], path.basename(m[2]))
}

const patchSchema = z.object({ role: z.enum(["user", "admin"]) })

/** PATCH /api/admin/users/[id] — change a user's role (audited) */
export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const admin = await requireUser(["admin"])
  const { id } = await ctx.params
  const body = await parseBody(req, patchSchema)

  const target = await db.user.findUnique({ where: { id }, select: { id: true, email: true } })
  if (!target) throw new ApiError(404, "User not found")

  const updated = await db.user.update({
    where: { id },
    data: { role: body.role },
    select: { id: true, email: true, name: true, role: true },
  })
  await audit("admin.user.role", admin.id, id, { email: target.email, role: body.role })
  return ok({ user: updated })
})

/** DELETE /api/admin/users/[id] — permanently remove a user (audited; cannot delete self) */
export const DELETE = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const admin = await requireUser(["admin"])
  const { id } = await ctx.params
  if (id === admin.id) throw new ApiError(400, "You cannot delete your own account from the admin panel")

  const target = await db.user.findUnique({ where: { id }, select: { id: true, email: true } })
  if (!target) throw new ApiError(404, "User not found")

  const uploads = await db.asset.findMany({ where: { ownerId: id }, select: { url: true } })

  await db.user.delete({ where: { id } })
  await db.workspace
    .deleteMany({ where: { ownerId: id, members: { none: {} } } })
    .catch(() => {})

  for (const a of uploads) {
    const p = uploadFilePath(a.url)
    if (p) await fs.unlink(p).catch(() => {})
  }

  await audit("admin.user.delete", admin.id, id, { email: target.email, assetsRemoved: uploads.length })
  return ok({ deleted: true })
})
