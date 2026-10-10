import { TPLS } from "../src/lib/design/templates/index"
const counts = new Map<string, number>()
for (const t of TPLS) {
  for (const tag of t.tags) {
    const k = tag.toLowerCase()
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
}
const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
console.log("TOTAL TPLS:", TPLS.length)
for (const [tag, n] of sorted) console.log(`${n}\t${tag}`)
