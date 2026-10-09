import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, route } from "@/lib/api-utils"

/** GET /api/templates — public template library (q, category, type, featured) */
export const GET = route(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams
  const q = sp.get("q")?.trim().toLowerCase() || ""
  const category = sp.get("category") || undefined
  const type = sp.get("type") || undefined
  const featured = sp.get("featured") === "1"
  const limit = Math.min(parseInt(sp.get("limit") || "60", 10) || 60, 200)

  const templates = await db.template.findMany({
    where: {
      ...(category && category !== "all" ? { category } : {}),
      ...(type ? { type } : {}),
      ...(featured ? { featured: true } : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true, slug: true, name: true, category: true, type: true, tags: true,
      width: true, height: true, thumbnail: true, featured: true, license: true,
    },
  })

  const filtered = q
    ? templates.filter((t) => {
        const tags = (() => { try { return JSON.parse(t.tags) as string[] } catch { return [] } })()
        return t.name.toLowerCase().includes(q) || tags.some((tag) => tag.toLowerCase().includes(q))
      })
    : templates

  return ok({ templates: filtered, total: filtered.length, license: "All templates are original CC0 content created for Studio." })
})
