import { describe, it, expect } from "vitest"
import { TPLS, TPL_CATEGORY_IDS, tplCountByCategory } from "@/lib/design/templates"
import { TEMPLATE_CATEGORIES } from "@/lib/design/presets"
import { SCHEMA_VERSION, type DesignElement } from "@/lib/design/types"

const VALID_TYPES = new Set(["text", "shape", "image", "table", "chart", "qr", "sticky", "line", "frame", "video", "audio"])

describe("template library", () => {
  it("offers hundreds of templates", () => {
    expect(TPLS.length).toBeGreaterThanOrEqual(400)
  })

  it("slugs are unique and kebab-case", () => {
    const slugs = new Set<string>()
    for (const t of TPLS) {
      expect(slugs.has(t.slug)).toBe(false)
      slugs.add(t.slug)
      expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it("every template carries required metadata", () => {
    for (const t of TPLS) {
      expect(t.name.length).toBeGreaterThan(3)
      expect(t.category.length).toBeGreaterThan(2)
      expect(t.width).toBeGreaterThan(0)
      expect(t.height).toBeGreaterThan(0)
      expect(Array.isArray(t.tags)).toBe(true)
      expect(t.tags.length).toBeGreaterThan(0)
    }
  })

  it("template categories map to the official category list", () => {
    const official = new Set(TEMPLATE_CATEGORIES.map((c) => c.id))
    for (const id of TPL_CATEGORY_IDS) {
      expect(official.has(id)).toBe(true)
    }
  })

  it("every template builds a valid DesignDoc with real editable elements", () => {
    for (const t of TPLS) {
      const doc = t.build()
      expect(doc.schemaVersion).toBe(SCHEMA_VERSION)
      expect(doc.type).toBe(t.type)
      expect(doc.width).toBe(t.width)
      expect(doc.height).toBe(t.height)
      expect(doc.pages.length).toBeGreaterThan(0)
      expect(doc.background).toBeTruthy()
      const total = doc.pages.reduce((n, p) => n + p.elements.length, 0)
      expect(total).toBeGreaterThan(2)
      for (const page of doc.pages) {
        expect(page.background).toBeTruthy()
        for (const el of page.elements as DesignElement[]) {
          expect(VALID_TYPES.has(el.type)).toBe(true)
          expect(Number.isFinite(el.x)).toBe(true)
          expect(Number.isFinite(el.y)).toBe(true)
          expect(el.width).toBeGreaterThan(0)
          expect(el.height).toBeGreaterThan(0)
        }
      }
    }
  })

  it("build() is repeatable (fresh ids each call)", () => {
    const t = TPLS[0]
    const a = t.build()
    const b = t.build()
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
    expect(a.pages[0].elements[0].id).not.toBe(b.pages[0].elements[0].id)
  })

  it("content is JSON-serializable for the seed", () => {
    for (const t of TPLS) {
      const json = JSON.stringify(t.build())
      expect(json.length).toBeLessThan(2_000_000)
      expect(() => JSON.parse(json)).not.toThrow()
    }
  })

  it("covers all major categories with a meaningful number of templates", () => {
    const counts = tplCountByCategory()
    for (const cat of ["social", "story", "youtube", "marketing", "print", "business", "presentation", "resume", "event", "education", "infographic", "photo", "whiteboard", "seasonal"]) {
      expect(counts[cat] ?? 0).toBeGreaterThanOrEqual(8)
    }
  })

  it("seasonal packs cover the requested holiday families", () => {
    const all = TPLS.filter((t) => t.category === "seasonal")
    expect(all.length).toBeGreaterThanOrEqual(200)
    const tagHit = (needle: string) =>
      all.filter((t) => t.tags.some((tag) => tag.includes(needle))).length
    for (const needle of ["lebaran", "ramadan", "pengajian", "kajian", "imlek", "tahun baru", "17 agustus", "natal", "valentine", "sale"]) {
      expect(tagHit(needle) >= 4, `seasonal pack '${needle}' too thin: ${tagHit(needle)}`).toBe(true)
    }
  })
})
