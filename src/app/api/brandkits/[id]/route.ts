import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, assertSameOrigin, ok, parseBody, requireUser, route } from "@/lib/api-utils"
import { audit } from "@/lib/auth"

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  colorsJson: z.string().max(8000).optional(),
  fontsJson: z.string().max(4000).optional(),
  logosJson: z.string().max(100_000).optional(),
  guidelines: z.string().max(10_000).optional(),
})

/** PATCH /api/brandkits/[id] — update kit fields (owner only) */
export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const { id } = await ctx.params

  const kit = await db.brandKit.findUnique({ where: { id } })
  if (!kit) throw new ApiError(404, "Brand kit not found")
  if (kit.ownerId !== user.id) throw new ApiError(403, "Not your brand kit")

  const body = await parseBody(req, patchSchema)
  const data: Record<string, string> = {}
  for (const k of ["name", "colorsJson", "fontsJson", "logosJson"] as const) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.guidelines !== undefined) data.guidelines = body.guidelines

  const updated = await db.brandKit.update({
    where: { id },
    data,
  })
  return ok({ kit: updated })
})

/** DELETE /api/brandkits/[id] — remove kit (owner only) */
export const DELETE = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const { id } = await ctx.params

  const kit = await db.brandKit.findUnique({ where: { id } })
  if (!kit) throw new ApiError(404, "Brand kit not found")
  if (kit.ownerId !== user.id) throw new ApiError(403, "Not your brand kit")

  await db.brandKit.delete({ where: { id } })
  await audit("brandkit.delete", user.id, kit.id, { name: kit.name })
  return ok({ deleted: true })
})
