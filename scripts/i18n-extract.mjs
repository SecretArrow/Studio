/**
 * Extract all unique text strings from the template library (TPLS) with
 * frequency counts, for the template-text localization pipeline.
 *
 * Run: bun scripts/i18n-extract.mjs
 * Output: scripts/i18n-strings.json  [{ s: string, n: number }, ...] sorted by n desc
 */
import { TPLS } from "../src/lib/design/templates/index.ts"

const counts = new Map()

function add(raw) {
  if (typeof raw !== "string") return
  const s = raw.trim()
  if (!s) return
  // Skip pure numbers / symbols / emoji-only — nothing to translate
  if (/^[\d\s.,:%+\-/–—|·#()☐✓✗•·—–]+$/.test(s)) return
  if (!/\p{L}/u.test(s)) return
  counts.set(s, (counts.get(s) ?? 0) + 1)
}

function walk(doc) {
  for (const page of doc.pages ?? []) {
    for (const el of page.elements ?? []) {
      if (el.type === "text") add(el.text)
      else if (el.type === "sticky") add(el.text)
      else if (el.type === "table") for (const row of el.rows ?? []) for (const cell of row) add(cell)
    }
  }
}

let templateCount = 0
for (const spec of TPLS) {
  let doc
  try {
    doc = spec.build()
  } catch (e) {
    console.error(`BUILD FAIL ${spec.slug}: ${e.message}`)
    continue
  }
  templateCount++
  walk(doc)
}

const list = [...counts.entries()].map(([s, n]) => ({ s, n })).sort((a, b) => b.n - a.n)
const fs = await import("node:fs")
fs.writeFileSync(new URL("./i18n-strings.json", import.meta.url), JSON.stringify(list, null, 0))

const totalInstances = list.reduce((acc, x) => acc + x.n, 0)
console.log(`templates: ${templateCount}`)
console.log(`unique strings: ${list.length}`)
console.log(`total text instances: ${totalInstances}`)
console.log(`top10 coverage of instances: ${list.slice(0, 10).reduce((a, x) => a + x.n, 0)} / ${totalInstances}`)
for (const { s, n } of list.slice(0, 25)) console.log(String(n).padStart(4), JSON.stringify(s.slice(0, 70)))
