import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { TEMPLATE_LOCALES, TEMPLATE_LOCALE_CODES } from "@/lib/design/i18n/locales"

/**
 * Static guarantees for the template-text localization assets:
 *  - manifest integrity (25 locales, unique codes, valid dirs)
 *  - every dictionary file is valid JSON: Record<string, string>, non-empty values
 *  - KEY PARITY: the key set is identical across all 25 locale files
 * (Translation-vs-identity coverage is intentionally NOT asserted — a
 * background job fills dictionaries progressively.)
 */

const DICT_DIR = path.resolve(process.cwd(), "public", "i18n", "templates")
const EXPECTED_CODES = ["en", "zh", "hi", "es", "fr", "ar", "bn", "pt", "ru", "ur", "id", "de", "ja", "mr", "te", "tr", "ta", "vi", "tl", "ko", "it", "fa", "th", "sw", "pl"]
function dictFiles(): string[] {
  return readdirSync(DICT_DIR).filter((f) => f.endsWith(".json") && f !== "index.json").sort()
}

function readDict(file: string): Record<string, string> {
  return JSON.parse(readFileSync(path.join(DICT_DIR, file), "utf8")) as Record<string, string>
}

describe("template localization manifest", () => {
  it("has exactly 25 locales with unique codes and valid dirs", () => {
    expect(TEMPLATE_LOCALES).toHaveLength(25)
    expect(TEMPLATE_LOCALE_CODES).toHaveLength(25)
    expect(new Set(TEMPLATE_LOCALE_CODES).size).toBe(25)
    expect([...TEMPLATE_LOCALE_CODES].sort()).toEqual([...EXPECTED_CODES].sort())
    for (const l of TEMPLATE_LOCALES) {
      expect(l.dir === "ltr" || l.dir === "rtl").toBe(true)
      expect(l.en.length).toBeGreaterThan(0)
      expect(l.native.length).toBeGreaterThan(0)
    }
    // exactly the RTL trio ar/ur/fa
    expect(TEMPLATE_LOCALES.filter((l) => l.dir === "rtl").map((l) => l.code).sort()).toEqual(["ar", "fa", "ur"])
  })
})

describe("template dictionary files", () => {
  it("one dictionary file exists per manifest locale (and no extras)", () => {
    const codes = dictFiles().map((f) => f.replace(/\.json$/, ""))
    expect(codes).toEqual([...TEMPLATE_LOCALE_CODES].sort())
  })

  it("every dictionary is a valid Record<string,string> with non-empty values", () => {
    for (const file of dictFiles()) {
      const dict = readDict(file)
      expect(typeof dict).toBe("object")
      expect(Array.isArray(dict)).toBe(false)
      const entries = Object.entries(dict)
      expect(entries.length).toBeGreaterThan(1000)
      for (const [k, v] of entries) {
        if (typeof v !== "string" || v.length === 0) {
          throw new Error(`${file}: invalid value for key ${JSON.stringify(k.slice(0, 60))}`)
        }
      }
    }
  })

  it("key sets are IDENTICAL across all 25 locale files (parity)", () => {
    const files = dictFiles()
    expect(files).toHaveLength(25)
    const reference = Object.keys(readDict(files[0]!)).sort()
    expect(reference.length).toBeGreaterThan(1000)
    for (const file of files.slice(1)) {
      expect(Object.keys(readDict(file)).sort()).toEqual(reference)
    }
  })

  it("index.json manifest on disk matches the static TEMPLATE_LOCALES", () => {
    const manifest = JSON.parse(readFileSync(path.join(DICT_DIR, "index.json"), "utf8")) as {
      version: number
      locales: { code: string; en: string; native: string; dir: string }[]
    }
    expect(manifest.version).toBe(1)
    expect(manifest.locales.map((l) => l.code)).toEqual(TEMPLATE_LOCALES.map((l) => l.code))
    expect(manifest.locales.map((l) => l.dir)).toEqual(TEMPLATE_LOCALES.map((l) => l.dir))
    expect(manifest.locales.map((l) => l.native)).toEqual(TEMPLATE_LOCALES.map((l) => l.native))
  })
})
