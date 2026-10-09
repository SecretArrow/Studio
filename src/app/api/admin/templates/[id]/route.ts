import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, assertSameOrigin, ok, parseBody, requireUser, route } from "@/lib/api-utils"
import { audit } from "@/lib/auth"

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  featured: z.boolean().optional(),
  name: z.string().min(1).max(120).optional(),
})

/** PATCH /api/admin/templates/[id] — feature/rename a template (audited) */
export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const admin = await requireUser(["admin"])
  const { id } = await ctx.params
  const body = await parseBody(req, patchSchema)

  const existing = await db.template.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!existing) throw new ApiError(404, "Template not found")

  const template = await db.template.update({
    where: { id },
    data: body,
    select: { id: true, name: true, featured: true, category: true },
  })
  await audit("admin.template.update", admin.id, id, { name: existing.name, ...body })
  return ok({ template })
})

/** DELETE /api/admin/templates/[id] — remove a template (audited; projects keep their copies) */
export const DELETE = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const admin = await requireUser(["admin"])
  const { id } = await ctx.params

  const existing = await db.template.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!existing) throw new ApiError(404, "Template not found")

  await db.template.delete({ where: { id } })
  await audit("admin.template.delete", admin.id, id, { name: existing.name })
  return ok({ deleted: true })
})
