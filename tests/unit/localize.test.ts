import { describe, it, expect } from "vitest"
import { localizeDesignDoc, collectDocStrings, dictionaryCoverage } from "@/lib/design/i18n/localize"
import type { DesignDoc, DesignElement, TableElement } from "@/lib/design/types"

function el(partial: Record<string, unknown>): DesignElement {
  return {
    id: "el",
    type: "text",
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    rotation: 0,
    opacity: 1,
    ...partial,
  } as unknown as DesignElement
}

const DOC: DesignDoc = {
  schemaVersion: 1,
  type: "canvas",
  width: 800,
  height: 600,
  background: { type: "solid", color: "#ffffff" },
  pages: [
    {
      id: "p1",
      name: "Page 1",
      background: { type: "solid", color: "#ffffff" },
      elements: [
        el({ id: "t1", type: "text", text: "EXPERIENCE", fontFamily: "Inter" }),
        el({ id: "sh1", type: "shape", variant: "rect", fill: "#8b5cf6", stroke: "transparent", strokeWidth: 0, cornerRadius: 8 }),
        el({ id: "st1", type: "sticky", text: "Brainstorm ideas", color: "#fde68a", fontFamily: "Caveat", fontSize: 28 }),
        el({
          id: "tb1",
          type: "table",
          rows: [
            ["Feature", "Free"],
            ["Projects", "Unlimited"],
          ],
          headerRow: true,
        } as unknown as Record<string, unknown>),
      ],
    },
    {
      id: "p2",
      name: "Page 2",
      background: { type: "solid", color: "#ffffff" },
      elements: [
        el({ id: "t2", type: "text", text: "  padded string  ", fontFamily: "Inter" }),
        el({ id: "t3", type: "text", text: "unknown string", fontFamily: "Inter" }),
        el({ id: "t4", type: "text", text: "  MULTI \n LINE  ", fontFamily: "Inter" }),
      ],
    },
    {
      id: "p3",
      name: "Page 3",
      background: { type: "solid", color: "#ffffff" },
      elements: [el({ id: "sh2", type: "shape", variant: "ellipse", fill: "#f59e0b", stroke: "transparent", strokeWidth: 0, cornerRadius: 0 })],
    },
  ],
}

const DICT: Record<string, string> = {
  EXPERIENCE: "EXPERIENCIA",
  "Brainstorm ideas": "Ideas de lluvia de mente",
  Feature: "Característica",
  Free: "Gratis",
  Projects: "Proyectos",
  Unlimited: "Ilimitado",
  "padded string": "cadena con espacios",
  "MULTI \n LINE": "MULTI \n LÍNEA",
}

describe("localizeDesignDoc", () => {
  it("applies text, sticky and table replacements", () => {
    const out = localizeDesignDoc(DOC, DICT)
    const p1 = out.pages[0]!.elements
    expect((p1[0] as { text: string }).text).toBe("EXPERIENCIA")
    expect((p1[2] as { text: string }).text).toBe("Ideas de lluvia de mente")
    const table = p1[3] as TableElement
    expect(table.rows).toEqual([
      ["Característica", "Gratis"],
      ["Proyectos", "Ilimitado"],
    ])
    // second page (trimmed lookups + multi-line keys preserved verbatim)
    const p2 = out.pages[1]!.elements
    expect((p2[0] as { text: string }).text).toBe("cadena con espacios")
    expect((p2[2] as { text: string }).text).toBe("MULTI \n LÍNEA")
  })

  it("does NOT mutate the input doc, pages or shared elements", () => {
    const snapshot = JSON.parse(JSON.stringify(DOC)) as DesignDoc
    const out = localizeDesignDoc(DOC, DICT)
    // input deep-equals its pre-call snapshot
    expect(JSON.parse(JSON.stringify(DOC))).toEqual(snapshot)
    // replaced elements are fresh objects; the output doc/pages are new too
    expect(out).not.toBe(DOC)
    expect(out.pages[0]).not.toBe(DOC.pages[0])
    const outT1 = out.pages[0]!.elements[0]
    expect(outT1).not.toBe(DOC.pages[0]!.elements[0])
    expect((outT1 as { text: string }).text).toBe("EXPERIENCIA")
    // untouched elements/pages are passed through by reference (never written to)
    expect(out.pages[0]!.elements[1]).toBe(DOC.pages[0]!.elements[1])
    expect(out.pages[1]!.elements[1]).toBe(DOC.pages[1]!.elements[1])
    expect(out.pages[2]).toBe(DOC.pages[2])
  })

  it("leaves unknown strings untouched", () => {
    const out = localizeDesignDoc(DOC, DICT)
    const t3 = out.pages[1]!.elements[1] as { text: string }
    expect(t3.text).toBe("unknown string")
  })

  it("ignores identity dictionary values (value === key)", () => {
    const out = localizeDesignDoc(DOC, { EXPERIENCE: "EXPERIENCE" })
    expect((out.pages[0]!.elements[0] as { text: string }).text).toBe("EXPERIENCE")
    // element not replaced when nothing translated
    expect(out.pages[0]!.elements[0]).toBe(DOC.pages[0]!.elements[0])
  })

  it("empty dictionary yields a deep-equal clone", () => {
    const out = localizeDesignDoc(DOC, {})
    expect(out).toEqual(DOC)
    expect(out).not.toBe(DOC)
  })
})

describe("collectDocStrings", () => {
  it("collects trimmed, unique strings in first-occurrence order", () => {
    const docWithDupes: DesignDoc = {
      ...DOC,
      pages: [
        ...DOC.pages,
        {
          id: "p3",
          name: "Page 3",
          background: { type: "solid", color: "#ffffff" },
          elements: [el({ id: "t5", type: "text", text: "  EXPERIENCE  ", fontFamily: "Inter" })],
        },
      ],
    }
    expect(collectDocStrings(docWithDupes)).toEqual([
      "EXPERIENCE",
      "Brainstorm ideas",
      "Feature",
      "Free",
      "Projects",
      "Unlimited",
      "padded string",
      "unknown string",
      "MULTI \n LINE",
    ])
  })
})

describe("dictionaryCoverage", () => {
  it("counts only strings with a DIFFERENT translation", () => {
    expect(dictionaryCoverage(DOC, DICT)).toEqual({ covered: 8, total: 9 })
    expect(dictionaryCoverage(DOC, {})).toEqual({ covered: 0, total: 9 })
    // identity values never count as covered
    const identityDict = Object.fromEntries(collectDocStrings(DOC).map((s) => [s, s]))
    expect(dictionaryCoverage(DOC, identityDict)).toEqual({ covered: 0, total: 9 })
  })
})
