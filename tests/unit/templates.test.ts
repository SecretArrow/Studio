import { describe, it, expect } from "vitest"
import { TPLS, TPL_CATEGORY_IDS, tplCountByCategory } from "@/lib/design/templates"
import { TEMPLATE_CATEGORIES } from "@/lib/design/presets"
import { SCHEMA_VERSION, type DesignElement } from "@/lib/design/types"

const VALID_TYPES = new Set(["text", "shape", "image", "table", "chart", "qr", "sticky", "line", "frame", "video", "audio"])

describe("template library", () => {
  it("offers hundreds of templates", () => {
    expect(TPLS.length).toBeGreaterThanOrEqual(200)
  })

  it("slugs are unique and kebab-case", () => {
    const slugs = new Set<string>()
    for (const t of TPLS) {
      expect(slugs.has(t.slug), `duplicate slug: ${t.slug}`).toBe(false)
      slugs.add(t.slug)
      expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it("every template carries required metadata", () => {
    for (const t of TPLS) {
      expect(t.name.length).toBeGreaterThan(3, t.slug)
      expect(t.category.length).toBeGreaterThan(2, t.slug)
      expect(t.width).toBeGreaterThan(0, t.slug)
      expect(t.height).toBeGreaterThan(0, t.slug)
      expect(Array.isArray(t.tags), t.slug).toBe(true)
      expect(t.tags.length).toBeGreaterThan(0, t.slug)
    }
  })

  it("template categories map to the official category list", () => {
    const official = new Set(TEMPLATE_CATEGORIES.map((c) => c.id))
    for (const id of TPL_CATEGORY_IDS) {
      expect(official.has(id), `unknown category ${id}`).toBe(true)
    }
  })

  it("every template builds a valid DesignDoc with real editable elements", () => {
    for (const t of TPLS) {
      const doc = t.build()
      expect(doc.schemaVersion).toBe(SCHEMA_VERSION, t.slug)
      expect(doc.type).toBe(t.type, t.slug)
      expect(doc.width).toBe(t.width, t.slug)
      expect(doc.height).toBe(t.height, t.slug)
      expect(doc.pages.length).toBeGreaterThan(0, t.slug)
      expect(doc.background, `${t.slug} doc background`).toBeTruthy()
      const total = doc.pages.reduce((n, p) => n + p.elements.length, 0)
      expect(total, `${t.slug} has no elements`).toBeGreaterThan(2)
      for (const page of doc.pages) {
        expect(page.background, `${t.slug}/${page.name} page background`).toBeTruthy()
        for (const el of page.elements as DesignElement[]) {
          expect(VALID_TYPES.has(el.type), `${t.slug} unknown element type ${el.type}`).toBe(true)
          expect(Number.isFinite(el.x), `${t.slug} el.x`).toBe(true)
          expect(Number.isFinite(el.y), `${t.slug} el.y`).toBe(true)
          expect(el.width).toBeGreaterThan(0, `${t.slug} el.width`)
          expect(el.height).toBeGreaterThan(0, `${t.slug} el.height`)
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
      expect(json.length, `${t.slug} unexpectedly huge`).toBeLessThan(2_000_000)
      expect(() => JSON.parse(json)).not.toThrow()
    }
  })

  it("covers all major categories with a meaningful number of templates", () => {
    const counts = tplCountByCategory()
    for (const cat of ["social", "story", "youtube", "marketing", "print", "business", "presentation", "resume", "event", "education", "infographic", "photo", "whiteboard"]) {
      expect(counts[cat] ?? 0, `category ${cat} too thin`).toBeGreaterThanOrEqual(8)
    }
  })
})
