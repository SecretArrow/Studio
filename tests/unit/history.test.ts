import { describe, it, expect } from "vitest"
import { HistoryStore } from "@/lib/editor/history"
import { createDoc, createText } from "@/lib/design/types"

function docWithText(text: string) {
  const doc = createDoc("canvas", 800, 600)
  doc.pages[0].elements.push(createText({ x: 0, y: 0, text }))
  return doc
}

describe("editor history (undo/redo)", () => {
  it("starts with one entry and cannot undo", () => {
    const h = new HistoryStore(docWithText("v0"), 50)
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })

  it("undo returns the previous document", () => {
    const h = new HistoryStore(docWithText("v0"), 50)
    h.push(docWithText("v1"))
    const restored = h.undo()
    expect(JSON.parse(JSON.stringify(restored)).pages[0].elements[0].text).toBe("v0")
    expect(h.canRedo).toBe(true)
  })

  it("redo re-applies", () => {
    const h = new HistoryStore(docWithText("v0"), 50)
    h.push(docWithText("v1"))
    h.undo()
    const redone = h.redo()
    expect(JSON.parse(JSON.stringify(redone)).pages[0].elements[0].text).toBe("v1")
  })

  it("pushing after undo truncates the redo branch", () => {
    const h = new HistoryStore(docWithText("v0"), 50)
    h.push(docWithText("v1"))
    h.undo()
    h.push(docWithText("v2"))
    expect(h.canRedo).toBe(false)
    expect(JSON.parse(JSON.stringify(h.undo())).pages[0].elements[0].text).toBe("v0")
  })

  it("coalesces entries sharing a coalesce key within the window", () => {
    const h = new HistoryStore(docWithText("v0"), 50)
    h.push(docWithText("v1"), "slider:1")
    h.push(docWithText("v2"), "slider:1")
    h.push(docWithText("v3"), "slider:1")
    // one coalesced step back returns to v0
    expect(JSON.parse(JSON.stringify(h.undo())).pages[0].elements[0].text).toBe("v0")
  })

  it("respects the max depth", () => {
    const h = new HistoryStore(docWithText("v0"), 5)
    for (let i = 1; i <= 20; i += 1) h.push(docWithText(`v${i}`))
    let steps = 0
    while (h.canUndo) {
      h.undo()
      steps += 1
    }
    expect(steps).toBeLessThanOrEqual(5)
  })
})
