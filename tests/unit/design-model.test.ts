import { describe, it, expect } from "vitest"
import {
  createDoc,
  createPage,
  createText,
  createShape,
  createChart,
  findElement,
  mapElements,
  uid,
  SCHEMA_VERSION,
} from "@/lib/design/types"

describe("design document model", () => {
  it("creates a valid blank doc", () => {
    const doc = createDoc("canvas", 1080, 1080, "Test")
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION)
    expect(doc.type).toBe("canvas")
    expect(doc.width).toBe(1080)
    expect(doc.pages).toHaveLength(1)
    expect(doc.pages[0].elements).toEqual([])
  })

  it("serializes to JSON and back losslessly", () => {
    const doc = createDoc("presentation", 1920, 1080)
    doc.pages[0].elements.push(createText({ x: 10, y: 10, text: "Hello" }))
    doc.pages[0].elements.push(createShape({ x: 0, y: 0, variant: "rect" }))
    const json = JSON.stringify(doc)
    const restored = JSON.parse(json)
    expect(restored).toEqual(doc)
  })

  it("unique ids never collide across many calls", () => {
    const ids = new Set(Array.from({ length: 500 }, () => uid("x")))
    expect(ids.size).toBe(500)
  })

  it("findElement locates elements across pages", () => {
    const doc = createDoc("canvas", 800, 600)
    const el = createText({ x: 0, y: 0, text: "findme" })
    doc.pages.push(createPage({ name: "Page 2" }))
    doc.pages[1].elements.push(el)
    expect(findElement(doc, el.id)?.type).toBe("text")
    expect(findElement(doc, "missing")).toBeUndefined()
  })

  it("mapElements transforms without mutating the original", () => {
    const doc = createDoc("canvas", 800, 600)
    doc.pages[0].elements.push(createText({ x: 0, y: 0, text: "a" }))
    const frozen = JSON.parse(JSON.stringify(doc))
    const next = mapElements(doc, (e) => ({ ...e, x: e.x + 5 }))
    expect(next.pages[0].elements[0].x).toBe(5)
    expect(doc).toEqual(frozen)
  })

  it("chart element keeps data linked", () => {
    const el = createChart({ x: 0, y: 0 })
    el.data.series[0].values[0] = 99
    expect(el.data.series[0].values[0]).toBe(99)
  })
})
