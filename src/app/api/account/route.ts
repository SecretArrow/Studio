import { NextRequest } from "next/server"
import path from "node:path"
import { promises as fs } from "node:fs"
import { db } from "@/lib/db"
import { assertSameOrigin, ok, requireUser, route } from "@/lib/api-utils"
import { audit, clearSessionCookie } from "@/lib/auth"

export const runtime = "nodejs"

const UPLOAD_ROOT = "/home/z/my-project/upload"

function uploadFilePath(url: string): string | null {
  const m = url.match(/^\/api\/files\/(\d{4}-\d{2})\/([A-Za-z0-9._-]+)$/)
  if (!m) return null
  return path.join(UPLOAD_ROOT, m[1], path.basename(m[2]))
}

/** DELETE /api/account — permanently delete the signed-in account and all related data */
export const DELETE = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await requireUser()

  const uploads = await db.asset.findMany({ where: { ownerId: user.id }, select: { url: true } })

  // Cascades: projects (+versions, project comments, share links), own comments,
  // assets, brand kits, notifications, bulk jobs, auth tokens, workspace memberships.
  await db.user.delete({ where: { id: user.id } })

  // Workspaces have no FK to User — remove owned workspaces that no longer have members.
  await db.workspace
    .deleteMany({ where: { ownerId: user.id, members: { none: {} } } })
    .catch(() => {})

  // Best-effort removal of uploaded files from disk.
  for (const a of uploads) {
    const p = uploadFilePath(a.url)
    if (p) await fs.unlink(p).catch(() => {})
  }

  await audit("account.delete", user.id, user.email, { assetsRemoved: uploads.length })
  return clearSessionCookie(ok({ deleted: true }))
})
