import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, route, assertSameOrigin } from "@/lib/api-utils"
import { requireUser } from "@/lib/api-utils"

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({ name: z.string().min(1).max(80).optional() })

export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await requireUser()
  const folder = await db.folder.findUnique({ where: { id } })
  if (!folder) throw new ApiError(404, "Folder not found")
  const member = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: folder.workspaceId, userId: user.id } } })
  if (!member || member.role === "member") throw new ApiError(403, "Not allowed")
  const body = await parseBody(req, patchSchema)
  const updated = await db.folder.update({ where: { id }, data: body, select: { id: true, name: true } })
  return ok({ folder: updated })
})

export const DELETE = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await requireUser()
  const folder = await db.folder.findUnique({ where: { id } })
  if (!folder) throw new ApiError(404, "Folder not found")
  const member = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: folder.workspaceId, userId: user.id } } })
  if (!member || member.role === "member") throw new ApiError(403, "Not allowed")
  await db.folder.delete({ where: { id } })
  return ok({ ok: true })
})
