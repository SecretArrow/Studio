import { describe, it, expect } from "vitest"
import { alignPatches, distributePatches, selectionBounds, type AlignMode } from "@/lib/editor/alignment"
import { createShape } from "@/lib/design/types"

function els() {
  return [
    createShape({ x: 100, y: 100, variant: "rect", width: 100, height: 50 }),
    createShape({ x: 300, y: 200, variant: "rect", width: 100, height: 50 }),
  ]
}

describe("alignment math", () => {
  it("aligns left edges to the selection left (multi-select)", () => {
    const patches = alignPatches(els(), "left", 1000, 800)
    // element already at selection-left gets an empty patch
    const xs = patches.map((p) => (p.patch.x as number | undefined) ?? 100)
    expect(xs).toEqual([100, 100])
  })

  it("aligns right edges to the selection right", () => {
    const patches = alignPatches(els(), "right", 1000, 800)
    expect(patches[0].patch.x).toBe(300)
    expect((patches[1].patch.x as number | undefined) ?? 300).toBe(300)
  })

  it("centers horizontally inside the selection bounds", () => {
    const patches = alignPatches(els(), "center-h", 1000, 800)
    expect(patches[0].patch.x).toBe(200)
    expect(patches[1].patch.x).toBe(200)
  })

  it("aligns a single element relative to the page", () => {
    const patches = alignPatches([els()[0]], "right", 1000, 800)
    expect(patches[0].patch.x).toBe(1000 - 100)
  })

  it("distribution needs at least 3 elements", () => {
    expect(distributePatches(els(), "h")).toEqual([])
  })

  it("distributes the middle element evenly (outer fixed)", () => {
    const three = [
      createShape({ x: 0, y: 0, variant: "rect", width: 100, height: 50 }),
      createShape({ x: 200, y: 0, variant: "rect", width: 100, height: 50 }),
      createShape({ x: 600, y: 0, variant: "rect", width: 100, height: 50 }),
    ]
    const patches = distributePatches(three, "h")
    expect(patches).toHaveLength(1)
    // gap = (600-100-100)/2? totalGap=600-100=500, sizes=100, gap=(500-100)/2... count=2? sorted 3 → count=2
    expect(patches[0].patch.x).toBe(300)
  })

  it("selection bounds covers both elements", () => {
    const b = selectionBounds(els())
    expect(b.x).toBe(100)
    expect(b.y).toBe(100)
    expect(b.width).toBe(300) // 300..400 span
  })

  it("single-element align to page is stable", () => {
    const single = [createShape({ x: 500, y: 500, variant: "rect", width: 100, height: 100 })]
    const modes: AlignMode[] = ["left", "right", "top", "bottom", "center-h", "middle"]
    for (const m of modes) {
      const patches = alignPatches(single, m, 1000, 1000)
      expect(patches).toHaveLength(1)
    }
  })
})
