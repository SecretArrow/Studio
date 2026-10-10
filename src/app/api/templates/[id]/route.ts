import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, route } from "@/lib/api-utils"

type Ctx = { params: Promise<{ id: string }> }

export const GET = route(async (_req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params
  const template = await db.template.findUnique({
    where: { id },
    select: {
      id: true, slug: true, name: true, category: true, type: true, tags: true,
      width: true, height: true, contentJson: true, thumbnail: true, license: true,
    },
  })
  if (!template) return ok({ error: "Template not found" }, { status: 404 })
  return ok({ template })
})
