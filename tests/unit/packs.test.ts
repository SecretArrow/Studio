import { describe, it, expect } from "vitest"
import { TPLS } from "@/lib/design/templates"
import { TEMPLATE_PACKS, SEASONAL_PACK_IDS, packById, packTemplateMatcher } from "@/lib/design/template-packs"

const HEX = /^#[0-9a-f]{6}$/i

describe("template packs", () => {
  it("defines ~11 packs with unique ids", () => {
    expect(TEMPLATE_PACKS.length).toBe(11)
    const ids = TEMPLATE_PACKS.map((p) => p.id)
    expect(new Set(ids).size).toBe(TEMPLATE_PACKS.length)
  })

  it("uses a consistent metadata shape (names, emoji, gradient, accent, lowercase tags)", () => {
    for (const pack of TEMPLATE_PACKS) {
      expect(pack.id.length).toBeGreaterThan(2)
      expect(pack.nameId.length).toBeGreaterThan(2)
      expect(pack.nameEn.length).toBeGreaterThan(2)
      expect(pack.descId.length).toBeGreaterThan(10)
      expect(pack.descEn.length).toBeGreaterThan(10)
      expect(pack.emoji.length).toBeGreaterThan(0)
      expect(pack.accent).toMatch(HEX)
      expect(pack.gradient.length).toBe(2)
      for (const c of pack.gradient) expect(c).toMatch(HEX)
      expect(pack.tags.length).toBeGreaterThan(0)
      for (const tag of pack.tags) expect(tag).toBe(tag.toLowerCase())
    }
  })

  it("orders packs seasonal-first and marks the 6 seasonal packs featured", () => {
    const seasonalIds = [...SEASONAL_PACK_IDS]
    expect(TEMPLATE_PACKS.slice(0, seasonalIds.length).map((p) => p.id)).toEqual(seasonalIds)
    for (const id of seasonalIds) {
      const pack = packById(id)
      expect(pack).toBeTruthy()
      expect(pack?.featured).toBe(true)
    }
    for (const pack of TEMPLATE_PACKS.filter((p) => !seasonalIds.includes(p.id as (typeof seasonalIds)[number]))) {
      expect(pack.featured ?? false).toBe(false)
    }
  })

  it("every pack matches at least 8 and at most 120 library templates", () => {
    for (const pack of TEMPLATE_PACKS) {
      const matcher = packTemplateMatcher(pack)
      const count = TPLS.filter((t) => matcher(t.tags)).length
      expect(count).toBeGreaterThanOrEqual(8)
      expect(count).toBeLessThanOrEqual(120)
    }
  })

  it("packById resolves known ids and returns undefined for unknown ones", () => {
    expect(packById(TEMPLATE_PACKS[0].id)).toBe(TEMPLATE_PACKS[0])
    expect(packById("definitely-not-a-pack")).toBeUndefined()
    expect(packById("")).toBeUndefined()
  })

  it("matcher accepts both string[] and JSON-string tags, case-insensitively", () => {
    const pack = packById("lebaran")
    expect(pack).toBeTruthy()
    const matcher = packTemplateMatcher(pack!)
    expect(matcher(["lebaran", "family"])).toBe(true)
    expect(matcher(JSON.stringify(["lebaran", "family"]))).toBe(true)
    expect(matcher(["RAMADAN"])).toBe(true)
    expect(matcher(JSON.stringify(["Ramadan Kareem"]))).toBe(true)
    expect(matcher(["kitchen", "office"])).toBe(false)
    expect(matcher(JSON.stringify(["kitchen", "office"]))).toBe(false)
    expect(matcher([])).toBe(false)
    expect(matcher(JSON.stringify([]))).toBe(false)
    // malformed JSON and nullish input never throw
    expect(matcher("not-json")).toBe(false)
    expect(matcher(null)).toBe(false)
    expect(matcher(undefined)).toBe(false)
  })

  it("matcher uses any-of semantics (a single needle hit is enough)", () => {
    const sale = packById("sale")!
    const matcher = packTemplateMatcher(sale)
    expect(matcher(["instagram", "promo"])).toBe(true)
    expect(matcher(["instagram"])).toBe(false)
  })
})
