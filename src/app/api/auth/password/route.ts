import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, rateLimit, route, assertSameOrigin } from "@/lib/api-utils"
import { audit, hashPassword, verifyPassword } from "@/lib/auth"
import { requireUser } from "@/lib/api-utils"

const schema = z.object({
  current: z.string().min(1).max(200),
  next: z.string().min(8).max(200),
})

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  rateLimit(req, "chpass", 5, 60_000)
  const session = await requireUser()
  const { current, next } = await parseBody(req, schema)
  const user = await db.user.findUnique({ where: { id: session.id } })
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    throw new ApiError(400, "Current password is incorrect")
  }
  const passwordHash = await hashPassword(next)
  await db.user.update({ where: { id: user.id }, data: { passwordHash } })
  await audit("auth.password_change", user.id, user.id)
  return ok({ ok: true })
})
