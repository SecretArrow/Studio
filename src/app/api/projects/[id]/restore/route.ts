import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, route, assertSameOrigin } from "@/lib/api-utils"
import { getSessionUser } from "@/lib/auth"

type Ctx = { params: Promise<{ id: string }> }

export const POST = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) return ok({ error: "Sign in required" }, { status: 401 })
  const project = await db.project.findUnique({ where: { id } })
  if (!project || project.ownerId !== user.id) return ok({ error: "Not allowed" }, { status: 403 })
  const updated = await db.project.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, deletedAt: true },
  })
  return ok({ project: updated })
})
