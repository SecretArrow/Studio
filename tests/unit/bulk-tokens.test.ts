import { describe, it, expect } from "vitest"
import { scanFields, applyRow, findDuplicates, findMissing, rowKey, sanitizeFileBase, TOKEN_RE } from "@/components/studio/dashboard/views/bulk/tokens"
import { createDoc, createText } from "@/lib/design/types"

function certDoc() {
  const doc = createDoc("canvas", 1000, 700)
  doc.pages[0].elements.push(createText({ x: 0, y: 0, text: "Certificate for {{name}}" }))
  doc.pages[0].elements.push(createText({ x: 0, y: 100, text: "Course: {{course}}" }))
  doc.pages[0].elements.push(createText({ x: 0, y: 200, text: "No tokens here" }))
  return doc
}

describe("bulk generator tokens", () => {
  it("scans {{token}} fields from all text elements", () => {
    const fields = scanFields(certDoc())
    const names = fields.map((f) => f.token).sort()
    expect(names).toEqual(["course", "name"])
  })

  it("replaces tokens per row without mutating source", () => {
    const doc = certDoc()
    const frozen = JSON.stringify(doc)
    const fields = scanFields(doc).map((f) => ({ ...f, column: f.token }))
    const out = applyRow(doc, fields, { name: "Ayu", course: "Design 101" })
    const texts = out.pages[0].elements.map((e) => (e.type === "text" ? e.text : ""))
    expect(texts).toContain("Certificate for Ayu")
    expect(texts).toContain("Course: Design 101")
    expect(JSON.stringify(doc)).toBe(frozen)
  })

  it("empty mapped values clear the token (validation happens before generation)", () => {
    const doc = certDoc()
    const fields = scanFields(doc).map((f) => ({ ...f, column: f.token }))
    const out = applyRow(doc, fields, { name: "Ayu", course: "" })
    const texts = out.pages[0].elements.map((e) => (e.type === "text" ? e.text : ""))
    expect(texts.some((t) => t.includes("{{course}}"))).toBe(false)
    expect(texts.some((t) => t.includes("{{name}}"))).toBe(false)
  })

  it("unmapped fields keep their tokens", () => {
    const doc = certDoc()
    const fields = scanFields(doc).map((f) => ({ ...f, column: f.token === "course" ? null : f.token }))
    const out = applyRow(doc, fields, { name: "Ayu", course: "IGNORED" })
    const texts = out.pages[0].elements.map((e) => (e.type === "text" ? e.text : ""))
    expect(texts.some((t) => t.includes("{{course}}"))).toBe(true)
  })

  it("detects duplicate rows", () => {
    const rows = [{ a: "1", b: "x" }, { a: "1", b: "x" }, { a: "2", b: "x" }]
    const dup = findDuplicates(rows)
    expect(dup.has(0)).toBe(false) // first occurrence is not a duplicate
    expect(dup.has(1)).toBe(true)
    expect(dup.has(2)).toBe(false)
  })

  it("finds missing values per row", () => {
    const doc = certDoc()
    const fields = scanFields(doc).map((f) => ({ ...f, column: f.token }))
    const rows = [{ name: "Ayu", course: "" }, { name: "Budi", course: "X" }]
    const missing = findMissing(rows, fields)
    expect(missing.get(0)).toContain("course")
    expect(missing.has(1)).toBe(false)
  })

  it("rowKey is stable and order-independent", () => {
    expect(rowKey({ a: "1", b: "2" })).toBe(rowKey({ b: "2", a: "1" }))
  })

  it("sanitizes file bases", () => {
    expect(sanitizeFileBase("My File: v2?")).toBe("my-file-v2")
    expect(sanitizeFileBase("")).toBe("design")
  })

  it("token regex handles whitespace", () => {
    expect("{{ name }}".match(TOKEN_RE)?.[0]).toBe("{{ name }}")
    expect("{{n@me}}".match(TOKEN_RE)).toBeNull()
  })
})
