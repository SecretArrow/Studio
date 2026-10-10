/**
 * Template library index — aggregates all template modules into TPLS.
 * Consumed by prisma/seed.ts and the templates API tests.
 */
import type { TemplateSpec } from "../template-builder"
import { CORE_TPLS } from "./core"
import { SOCIAL_TPLS } from "./social"
import { STORIES_TPLS } from "./stories"
import { MARKETING_TPLS } from "./marketing"
import { PRINT_TPLS } from "./print"
import { BUSINESS_TPLS } from "./business"
import { EVENT_EDU_TPLS } from "./event-edu"
import { DATA_TPLS } from "./data"

export const TPLS: TemplateSpec[] = [
  ...CORE_TPLS,
  ...SOCIAL_TPLS,
  ...STORIES_TPLS,
  ...MARKETING_TPLS,
  ...PRINT_TPLS,
  ...BUSINESS_TPLS,
  ...EVENT_EDU_TPLS,
  ...DATA_TPLS,
]

/** Category ids used by TPLS (subset of TEMPLATE_CATEGORIES, plus aliases). */
export const TPL_CATEGORY_IDS = Array.from(new Set(TPLS.map((t) => t.category)))

/** Deterministic template count by category (for docs/logs). */
export function tplCountByCategory(): Record<string, number> {
  return TPLS.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1
    return acc
  }, {})
}
