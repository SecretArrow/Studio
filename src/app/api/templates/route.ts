import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, route } from "@/lib/api-utils"

/** Parse a row's tags JSON column defensively into a string[]. */
function parseTagsJson(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

/** GET /api/templates — public template library (q, category, type, featured, tag) */
export const GET = route(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams
  const q = sp.get("q")?.trim().toLowerCase() || ""
  const category = sp.get("category") || undefined
  const type = sp.get("type") || undefined
  const featured = sp.get("featured") === "1"
  const limit = Math.min(parseInt(sp.get("limit") || "60", 10) || 60, 500)

  // `tag`: comma-separated needles — ANY-of, case-insensitive substring match
  // against each row's parsed tags JSON (e.g. ?tag=lebaran,ramadan).
  const tagParam = sp.get("tag")?.trim() || ""
  const tagNeedles = tagParam
    ? tagParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : []
  const hasTagFilter = tagNeedles.length > 0

  const templates = await db.template.findMany({
    where: {
      ...(category && category !== "all" ? { category } : {}),
      ...(type ? { type } : {}),
      ...(featured ? { featured: true } : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    // with a tag filter, scan a wide window first and filter in-memory
    take: hasTagFilter ? 500 : limit,
    select: {
      id: true, slug: true, name: true, category: true, type: true, tags: true,
      width: true, height: true, thumbnail: true, featured: true, license: true,
    },
  })

  const matchesQ = (t: (typeof templates)[number]) => {
    if (!q) return true
    const tags = parseTagsJson(t.tags)
    return t.name.toLowerCase().includes(q) || tags.some((tag) => tag.toLowerCase().includes(q))
  }

  if (hasTagFilter) {
    // tag filter applies first, then q narrows within the pack; limit applies
    // to the RESULT while total reports the full filtered count.
    const combined = templates
      .filter((t) => {
        const tags = parseTagsJson(t.tags)
        return tags.some((tag) => {
          const hay = tag.toLowerCase()
          return tagNeedles.some((needle) => hay.includes(needle))
        })
      })
      .filter(matchesQ)
    return ok({ templates: combined.slice(0, limit), total: combined.length, license: "All templates are original CC0 content created for Studio." })
  }

  const filtered = templates.filter(matchesQ)

  return ok({ templates: filtered, total: filtered.length, license: "All templates are original CC0 content created for Studio." })
})
