import { describe, it, expect } from "vitest"
import { applyKitToDoc, DEFAULT_TEXT_COLORS } from "@/components/studio/dashboard/views/brand/apply-kit"
import { createDoc, createText, createShape } from "@/lib/design/types"

function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const m = hex.replace("#", "")
    const rgb = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255)
    const [r, g, bl] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const l1 = lum(a)
  const l2 = lum(b)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

describe("brand kit application", () => {
  it("recolors only default-colored text and swaps fonts", () => {
    const doc = createDoc("canvas", 800, 600)
    doc.pages[0].elements.push(createText({ x: 0, y: 0, text: "default", color: "#111827", fontFamily: "Inter" }))
    doc.pages[0].elements.push(createText({ x: 0, y: 100, text: "custom", color: "#00ff00", fontFamily: "Oswald" }))
    const result = applyKitToDoc(doc, ["Poppins"], [
      { name: "Primary", hex: "#7c3aed" },
      { name: "Accent", hex: "#f59e0b" },
    ])
    const texts = result.doc.pages[0].elements.map((e) => e as { text: string; color: string; fontFamily: string })
    expect(texts[0].color).toBe("#7c3aed")
    expect(texts[0].fontFamily).toBe("Poppins")
    expect(texts[1].color).toBe("#00ff00") // untouched
    expect(result.fontChanges).toBe(1)
    expect(result.colorChanges).toBe(1)
  })

  it("returns zero changes for empty kit", () => {
    const doc = createDoc("canvas", 800, 600)
    doc.pages[0].elements.push(createShape({ x: 0, y: 0, variant: "rect" }))
    const result = applyKitToDoc(doc, [], [])
    expect(result.fontChanges).toBe(0)
    expect(result.colorChanges).toBe(0)
  })

  it("default colors are the documented palette", () => {
    expect(DEFAULT_TEXT_COLORS).toContain("#111827")
  })
})

describe("WCAG contrast math", () => {
  it("black on white is 21:1", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0)
  })

  it("identical colors are 1:1", () => {
    expect(contrast("#888888", "#888888")).toBeCloseTo(1, 0)
  })

  it("violet on white passes AA for normal text", () => {
    const ratio = contrast("#7c3aed", "#ffffff")
    expect(ratio).toBeGreaterThan(4.5)
  })

  it("amber on white fails AA for normal text", () => {
    expect(contrast("#f59e0b", "#ffffff")).toBeLessThan(4.5)
  })
})
