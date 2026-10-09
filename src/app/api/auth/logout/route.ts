import { NextRequest } from "next/server"
import { ok, route, assertSameOrigin } from "@/lib/api-utils"
import { audit, clearSessionCookie, getSessionUser } from "@/lib/auth"

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await getSessionUser()
  if (user) await audit("user.logout", user.id, user.id)
  return clearSessionCookie(ok({ ok: true }))
})
