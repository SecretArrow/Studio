import { NextRequest } from "next/server"
import { ok, route, assertSameOrigin, parseBody } from "@/lib/api-utils"
import { z } from "zod"
import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export const GET = route(async () => {
  const user = await getSessionUser()
  if (!user) return ok({ user: null })
  const workspace = await db.workspace.findFirst({
    where: { members: { some: { userId: user.id, role: "owner" } } },
    select: { id: true, name: true },
  }).catch(() => null)
  return ok({ user, workspace })
})

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  locale: z.enum(["en", "id"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  avatarUrl: z.string().max(500_000).optional(),
})

export const PATCH = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await getSessionUser()
  if (!user) return ok({ user: null })
  const body = await parseBody(req, patchSchema)
  const updated = await db.user.update({ where: { id: user.id }, data: body })
  return ok({
    user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, locale: updated.locale, avatarUrl: updated.avatarUrl },
  })
})
