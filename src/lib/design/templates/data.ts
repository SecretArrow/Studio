/**
 * Data & visual templates — presentation decks, infographics, whiteboards,
 * photo collages, wallpapers.
 */
import {
  asset,
  chart,
  doc,
  ellipse,
  F,
  gradient,
  img,
  note,
  page,
  pill,
  rect,
  rule,
  shp,
  solid,
  txt,
  vstack,
  type DesignElement,
  type TemplateSpec,
} from "../template-builder"

const INK = "#111827"
const V = "#7c3aed"

/* ------------------------------ presentation decks (family) ------------------------------ */

interface DeckSpec {
  slug: string
  name: string
  bg: string
  accent: string
  soft: string
  inkSoft: string
  featured?: boolean
  pages: [string, () => DesignElement[]][]
}

function deckHeader(title: string, kicker: string, accent: string, inkSoft: string): DesignElement[] {
  return [
    txt(kicker, { x: 120, y: 100, w: 900, h: 44, size: 26, font: F.mono, weight: 700, color: accent, ls: 6, upper: true }),
    txt(title, { x: 116, y: 160, w: 1400, h: 120, size: 76, font: F.cond, weight: 600, color: inkSoft, upper: true, ls: 2 }),
    rule(122, 300, 130, accent, 8),
  ]
}

function bullets(items: string[], x: number, y: number, accent: string, ink: string): DesignElement[] {
  return vstack(
    x,
    y,
    46,
    items.map((s, i) =>
      txt(`→  ${s}`, { x, y: 0, w: 900, h: 60, size: 32, weight: 500, color: i === 0 ? accent : ink, vAlign: "middle" }),
    ),
  )
}

const DECKS: DeckSpec[] = [
  {
    slug: "deck-marketing-plan",
    name: "Q3 Marketing Plan — Deck (5 slides)",
    bg: "#0f172a",
    accent: "#38bdf8",
    soft: "#1e293b",
    inkSoft: "#f8fafc",
    featured: true,
    pages: [
      ["Cover", () => [
        rect({ x: 120, y: 120, w: 1680, h: 840, fill: "#1e293b", r: 32 }),
        txt("Q3 2026\nMARKETING PLAN", { x: 220, y: 330, w: 1200, h: 340, size: 110, font: F.display, weight: 400, color: "#f8fafc", lh: 1.05, ls: 3 }),
        txt("grow free usage · keep it free", { x: 226, y: 700, w: 900, h: 60, size: 40, font: F.script, weight: 400, color: "#38bdf8" }),
        ellipse({ x: 1350, y: 320, w: 330, h: 330, fill: "#38bdf8" }),
        img(asset("rocket"), { x: 1400, y: 380, w: 230, h: 230 }),
      ]],
      ["Goals", () => [
        ...deckHeader("Goals for the quarter", "01 · north star", "#38bdf8", "#f8fafc"),
        ...bullets(["WAU 45k → 60k", "Template → project conversion ≥ 60%", "Zero paid acquisition — community only"], 140, 400, "#38bdf8", "#cbd5e1"),
        chart("column", ["May", "Jun", "Jul*", "Aug*", "Sep*"], [{ name: "WAU (k)", color: "#38bdf8", values: [38, 45, 50, 55, 60] }], { x: 120, y: 640, w: 1000, h: 340, legend: false, grid: true }),
        txt("*forecast", { x: 122, y: 1000, w: 400, h: 36, size: 22, font: F.mono, weight: 400, color: "#64748b" }),
      ]],
      ["Channels", () => [
        ...deckHeader("Where we show up", "02 · channels", "#38bdf8", "#f8fafc"),
        ...["Template galleries & SEO — 40% of new users", "Creator community — weekly template drops", "Schools & nonprofits — free program", "Product-led loops — share links with watermarks off"].map((s, i) => {
          const y = 400 + i * 130
          return [
            rect({ x: 140, y, w: 1200, h: 100, fill: "#1e293b", r: 16 }),
            txt(s, { x: 180, y: y + 24, w: 1100, h: 52, size: 30, weight: 500, color: "#e2e8f0", vAlign: "middle" }),
          ] as DesignElement[]
        }).flat(),
      ]],
      ["Content calendar", () => [
        ...deckHeader("Content rhythm", "03 · calendar", "#38bdf8", "#f8fafc"),
        txt("MON", { x: 140, y: 400, w: 380, h: 50, size: 30, font: F.mono, weight: 700, color: "#38bdf8" }),
        txt("tutorial post + story", { x: 142, y: 460, w: 380, h: 50, size: 28, weight: 400, color: "#cbd5e1" }),
        txt("WED", { x: 560, y: 400, w: 380, h: 50, size: 30, font: F.mono, weight: 700, color: "#38bdf8" }),
        txt("template drop (6 new)", { x: 562, y: 460, w: 380, h: 50, size: 28, weight: 400, color: "#cbd5e1" }),
        txt("FRI", { x: 980, y: 400, w: 380, h: 50, size: 30, font: F.mono, weight: 700, color: "#38bdf8" }),
        txt("community spotlight", { x: 982, y: 460, w: 380, h: 50, size: 28, weight: 400, color: "#cbd5e1" }),
        chart("line", ["W1", "W2", "W3", "W4"], [{ name: "posts", color: "#38bdf8", values: [3, 3, 3, 3] }, { name: "engagement idx", color: "#fde047", values: [42, 51, 57, 63] }], { x: 140, y: 570, w: 1220, h: 380, legend: true, grid: true }),
      ]],
      ["Budget", () => [
        ...deckHeader("Budget — still $0 on tools", "04 · money", "#38bdf8", "#f8fafc"),
        chart("doughnut", ["Design time", "Creator fund", "Events", "Buffer"], [{ name: "Budget", color: "#38bdf8", values: [40, 30, 20, 10] }], { x: 140, y: 380, w: 700, h: 520, legend: true }),
        ...[["$4,800", "internal design time"], ["$3,600", "community creator fund"], ["$2,400", "meetups & schools"], ["$1,200", "experiment buffer"]].flatMap(([n, l], i) => {
          const y = 420 + i * 120
          return [
            txt(n, { x: 950, y, w: 300, h: 60, size: 40, font: F.display, weight: 400, color: "#fde047" }),
            txt(l, { x: 1260, y: y + 12, w: 500, h: 40, size: 26, weight: 400, color: "#cbd5e1" }),
          ] as DesignElement[]
        }),
      ]],
    ],
  },
  {
    slug: "deck-quarterly-review",
    name: "Quarterly Business Review — Deck (5 slides)",
    bg: "#fafaf9",
    accent: "#e11d48",
    soft: "#ffffff",
    inkSoft: "#1c1917",
    pages: [
      ["Cover", () => [
        rect({ x: 0, y: 0, w: 1920, h: 1080, fill: "#fafaf9", r: 0 }),
        rect({ x: 120, y: 760, w: 1680, h: 200, fill: "#e11d48", r: 24 }),
        txt("Q2 2026 — BUSINESS REVIEW", { x: 160, y: 180, w: 1400, h: 120, size: 96, font: F.display, weight: 400, color: "#1c1917", ls: 3 }),
        txt("honest numbers, real lessons", { x: 164, y: 320, w: 900, h: 60, size: 40, font: F.serif, weight: 400, italic: true, color: "#78716c" }),
        txt("presented to the whole team · july 7", { x: 170, y: 810, w: 900, h: 60, size: 40, font: F.pop, weight: 700, color: "#ffffff" }),
        img(asset("trophy"), { x: 1500, y: 150, w: 220, h: 220 }),
      ]],
      ["Metrics", () => [
        ...deckHeader("The scorecard", "01 · metrics", "#e11d48", "#1c1917"),
        ...[["18,400", "new users (+31%)"], ["61,200", "projects created"], ["$0", "spent on ads"], ["99.97%", "export success"]].flatMap(([n, l], i) => {
          const x = 140 + i * 420
          return [
            rect({ x, y: 420, w: 380, h: 300, fill: "#ffffff", stroke: "#e7e5e4", sw: 3, r: 20 }),
            txt(n, { x, y: 470, w: 380, h: 110, size: 66, font: F.display, weight: 400, color: i === 2 ? "#e11d48" : "#1c1917", align: "center" }),
            txt(l, { x: x + 20, y: 600, w: 340, h: 60, size: 26, weight: 500, color: "#78716c", align: "center" }),
          ] as DesignElement[]
        }),
        txt("source: product analytics, may–july · definitions in appendix", { x: 142, y: 800, w: 900, h: 40, size: 22, font: F.mono, weight: 400, color: "#a8a29e" }),
      ]],
      ["Wins", () => [
        ...deckHeader("What worked", "02 · wins", "#e11d48", "#1c1917"),
        ...bullets(["New editor shipped on time — crash-free 99.9%", "Template program: 40 creators, 260 new templates", "School pilot: 12 schools, 3,100 students, $0"], 140, 400, "#e11d48", "#44403c"),
        ellipse({ x: 1420, y: 420, w: 360, h: 360, fill: "#ffe4e6" }),
        img(asset("trophy"), { x: 1500, y: 500, w: 200, h: 200 }),
      ]],
      ["Misses", () => [
        ...deckHeader("What didn't", "03 · misses", "#e11d48", "#1c1917"),
        ...bullets(["Mobile editor still slow on low-end Android", "Support first-reply slipped to 9h in June", "Video editor activation below target (18% vs 30%)"], 140, 400, "#e11d48", "#44403c"),
        rect({ x: 1300, y: 420, w: 480, h: 380, fill: "#fef2f2", stroke: "#fecaca", sw: 3, r: 20 }),
        txt("own it,\nfix it,\nmove on.", { x: 1300, y: 490, w: 480, h: 240, size: 54, font: F.serif, weight: 700, italic: true, color: "#9f1239", align: "center", lh: 1.3 }),
      ]],
      ["Next quarter", () => [
        ...deckHeader("Q3 focus", "04 · next", "#e11d48", "#1c1917"),
        ...["One metric: weekly active creators", "Mobile perf sprint — p95 under 2.5s", "Support: hire +2, keep first-reply under 4h"].map((s, i) => {
          const y = 400 + i * 150
          return [
            rect({ x: 140, y, w: 1300, h: 110, fill: i === 0 ? "#e11d48" : "#ffffff", stroke: "#fecaca", sw: 3, r: 16 }),
            txt(s, { x: 190, y: y + 28, w: 1200, h: 56, size: 34, weight: 600, color: i === 0 ? "#ffffff" : "#44403c", vAlign: "middle" }),
          ] as DesignElement[]
        }).flat(),
      ]],
    ],
  },
  {
    slug: "deck-workshop-training",
    name: "Team Workshop — Deck (4 slides)",
    bg: "#134e4a",
    accent: "#5eead4",
    soft: "#115e59",
    inkSoft: "#f0fdfa",
    pages: [
      ["Cover", () => [
        rect({ x: 140, y: 140, w: 1640, h: 800, fill: "#115e59", r: 32 }),
        txt("DESIGN HANDOFF\nWORKSHOP", { x: 240, y: 320, w: 1300, h: 340, size: 110, font: F.display, weight: 400, color: "#f0fdfa", lh: 1.05, ls: 3 }),
        txt("45 minutes · bring your worst handoff story", { x: 246, y: 690, w: 1000, h: 60, size: 38, font: F.hand, weight: 400, color: "#5eead4" }),
        img(asset("pencil"), { x: 1430, y: 330, w: 240, h: 240 }),
      ]],
      ["Agenda", () => [
        ...deckHeader("Agenda — 45 minutes", "today", "#5eead4", "#f0fdfa"),
        ...[["0–10", "war stories: your worst handoff"], ["10–25", "the 5-layer handoff checklist"], ["25–40", "practice: fix a real spec together"], ["40–45", "commit to one change"]].flatMap(([t, d], i) => {
          const y = 400 + i * 130
          return [
            rect({ x: 140, y, w: 260, h: 100, fill: "#5eead4", r: 14 }),
            txt(t, { x: 140, y: y + 26, w: 260, h: 50, size: 32, font: F.mono, weight: 700, color: "#134e4a", align: "center" }),
            txt(d, { x: 440, y: y + 24, w: 1200, h: 56, size: 32, weight: 500, color: "#ccfbf1", vAlign: "middle" }),
          ] as DesignElement[]
        }).flat(),
      ]],
      ["Checklist", () => [
        ...deckHeader("The handoff checklist", "the core", "#5eead4", "#f0fdfa"),
        ...["① States — hover, focus, error, empty, loading", "② Sizes — min/max content, not just the happy path", "③ Motion — what animates, what never does", "④ Data — real examples, not lorem ipsum", "⑤ Ownership — who answers questions, for how long"].map((s, i) => {
          const y = 400 + i * 115
          return [txt(s, { x: 160, y, w: 1500, h: 70, size: 34, weight: 500, color: i % 2 ? "#ccfbf1" : "#5eead4", vAlign: "middle" })] as DesignElement[]
        }).flat(),
      ]],
      ["Commitments", () => [
        ...deckHeader("Leave with one commitment", "close", "#5eead4", "#f0fdfa"),
        note("my one change:\n________________\n________________", { x: 700, y: 360, w: 500, h: 500, color: "#5eead4", size: 40, rotation: -2 }),
        note("checked by:\n____________", { x: 1280, y: 420, w: 380, h: 380, color: "#fde68a", size: 36, rotation: 3 }),
        txt("pin them where the standup happens", { x: 0, y: 950, w: 1920, h: 50, size: 30, font: F.hand, weight: 400, color: "#99f6e4", align: "center" }),
      ]],
    ],
  },
  {
    slug: "deck-lecture-slides",
    name: "Intro to Color — Lecture Deck (4 slides)",
    bg: "#1e1b4b",
    accent: "#fbbf24",
    soft: "#312e81",
    inkSoft: "#eef2ff",
    pages: [
      ["Title", () => [
        img(asset("planet"), { x: 1210, y: 200, w: 560, h: 392 }),
        ellipse({ x: 200, y: 600, w: 300, h: 300, fill: "#312e81" }),
        txt("INTRO TO COLOR", { x: 160, y: 260, w: 1000, h: 120, size: 90, font: F.display, weight: 400, color: "#eef2ff", ls: 4 }),
        txt("design fundamentals · lecture 04", { x: 164, y: 400, w: 800, h: 60, size: 36, font: F.mono, weight: 400, color: "#fbbf24" }),
        txt("why screens lie about color — and how to design anyway", { x: 164, y: 700, w: 800, h: 100, size: 32, font: F.serif, weight: 400, italic: true, color: "#c7d2fe", lh: 1.5 }),
      ]],
      ["RGB vs print", () => [
        ...deckHeader("RGB vs CMYK", "01 · two color worlds", "#fbbf24", "#eef2ff"),
        rect({ x: 140, y: 400, w: 760, h: 480, fill: "#312e81", r: 24 }),
        rect({ x: 1020, y: 400, w: 760, h: 480, fill: "#eef2ff", r: 24 }),
        txt("SCREENS — RGB", { x: 180, y: 440, w: 600, h: 50, size: 32, font: F.mono, weight: 700, color: "#fbbf24" }),
        txt("additive light · 16.7M colors · bright is easy\ndesign in sRGB for web & video", { x: 182, y: 510, w: 680, h: 200, size: 28, weight: 400, color: "#c7d2fe", lh: 1.7 }),
        txt("PRINT — CMYK", { x: 1060, y: 440, w: 600, h: 50, size: 32, font: F.mono, weight: 700, color: "#4c1d95" }),
        txt("subtractive ink · narrower gamut · bright is hard\nalways proof before a big print run", { x: 1062, y: 510, w: 680, h: 200, size: 28, weight: 400, color: "#4c1d95", lh: 1.7 }),
      ]],
      ["Contrast", () => [
        ...deckHeader("Contrast is kindness", "02 · accessibility", "#fbbf24", "#eef2ff"),
        rect({ x: 140, y: 400, w: 600, h: 300, fill: "#a5b4fc", r: 16 }),
        txt("2.1:1 — fails", { x: 140, y: 510, w: 600, h: 70, size: 44, font: F.display, weight: 400, color: "#eef2ff", align: "center" }),
        rect({ x: 780, y: 400, w: 600, h: 300, fill: "#312e81", r: 16 }),
        txt("8.6:1 — passes", { x: 780, y: 510, w: 600, h: 70, size: 44, font: F.display, weight: 400, color: "#fbbf24", align: "center" }),
        ...bullets(["Body text needs 4.5:1 minimum", "Large text needs 3:1", "Test early — retrofitting hurts"], 140, 780, "#fbbf24", "#c7d2fe"),
      ]],
      ["Homework", () => [
        ...deckHeader("Homework — due friday", "03 · practice", "#fbbf24", "#eef2ff"),
        note("recolor your\nfavorite poster\nin 2 palettes:\none calm,\none loud", { x: 200, y: 380, w: 520, h: 520, color: "#fbbf24", size: 40, rotation: -2 }),
        ...bullets(["Photograph both under warm & cool light", "Note which text survives both", "Bring prints — we vote next class"], 860, 420, "#fbbf24", "#c7d2fe"),
      ]],
    ],
  },
  {
    slug: "deck-project-proposal",
    name: "Project Proposal — Deck (4 slides)",
    bg: "#fdf8f1",
    accent: "#7c3aed",
    soft: "#ffffff",
    inkSoft: "#1c1917",
    pages: [
      ["Cover", () => [
        rect({ x: 0, y: 0, w: 1920, h: 1080, fill: "#fdf8f1", r: 0 }),
        rect({ x: 120, y: 120, w: 1680, h: 840, fill: "#ffffff", stroke: "#e9d5ff", sw: 4, r: 28 }),
        txt("PROJECT PROPOSAL", { x: 220, y: 300, w: 1200, h: 100, size: 56, font: F.mono, weight: 700, color: "#7c3aed", ls: 8 }),
        txt("Community Garden\nMapping Tool", { x: 220, y: 420, w: 1300, h: 300, size: 100, font: F.serif, weight: 700, color: "#1c1917", lh: 1.2 }),
        img(asset("leaf"), { x: 1450, y: 300, w: 260, h: 260 }),
        txt("prepared for the city council · june 2026", { x: 222, y: 800, w: 800, h: 50, size: 30, font: F.mono, weight: 400, color: "#78716c" }),
      ]],
      ["Problem", () => [
        ...deckHeader("The problem", "01 · why now", "#7c3aed", "#1c1917"),
        ...bullets(["34 community gardens, zero shared records", "Waitlists tracked on paper — 3-week delays", "Volunteers duplicate work every season"], 140, 420, "#7c3aed", "#44403c"),
        rect({ x: 1300, y: 400, w: 480, h: 420, fill: "#f5f3ff", r: 24 }),
        txt("3 wks", { x: 1300, y: 480, w: 480, h: 120, size: 90, font: F.display, weight: 400, color: "#7c3aed", align: "center" }),
        txt("average waitlist response today", { x: 1340, y: 620, w: 400, h: 100, size: 26, weight: 500, color: "#6b21a8", align: "center", lh: 1.5 }),
      ]],
      ["Solution", () => [
        ...deckHeader("A simple shared map", "02 · what", "#7c3aed", "#1c1917"),
        ...["One map, one list — always current", "Plot requests in 3 taps, auto-confirmed", "Works on any phone browser, free forever"].map((s, i) => {
          const y = 420 + i * 160
          return [
            rect({ x: 140, y, w: 1300, h: 120, fill: "#ffffff", stroke: "#e9d5ff", sw: 3, r: 18 }),
            txt(s, { x: 190, y: y + 34, w: 1200, h: 56, size: 34, weight: 600, color: "#1c1917", vAlign: "middle" }),
          ] as DesignElement[]
        }).flat(),
        img(asset("leaf"), { x: 1520, y: 500, w: 220, h: 220, rotation: 12 }),
      ]],
      ["Budget & timeline", () => [
        ...deckHeader("Budget & timeline", "03 · plan", "#7c3aed", "#1c1917"),
        chart("column", ["Design", "Build", "Launch", "Year 1 ops"], [{ name: "USD", color: "#7c3aed", values: [6, 18, 4, 12] }], { x: 140, y: 400, w: 900, h: 440, legend: false, grid: true, fmt: "$#k" }),
        ...[["September", "design & user testing"], ["Oct–Nov", "build with 2 volunteers"], ["December", "pilot in 5 gardens"], ["2027", "city-wide rollout"]].flatMap(([t, d], i) => {
          const y = 420 + i * 120
          return [
            txt(t, { x: 1140, y, w: 320, h: 50, size: 30, font: F.mono, weight: 700, color: "#7c3aed" }),
            txt(d, { x: 1470, y: y + 4, w: 360, h: 44, size: 26, weight: 400, color: "#57534e" }),
          ] as DesignElement[]
        }),
      ]],
    ],
  },
  {
    slug: "deck-product-launch",
    name: "Product Launch — Deck (5 slides)",
    bg: "#0b1220",
    accent: "#a3e635",
    soft: "#1e293b",
    inkSoft: "#f8fafc",
    pages: [
      ["Cover", () => [
        ellipse({ x: 1280, y: 140, w: 520, h: 520, fill: "#a3e635", opacity: 0.15 }),
        txt("LAUNCH DAY", { x: 140, y: 240, w: 900, h: 80, size: 40, font: F.mono, weight: 700, color: "#a3e635", ls: 10 }),
        txt("NOVA X2", { x: 136, y: 340, w: 1100, h: 240, size: 200, font: F.display, weight: 400, color: "#f8fafc", ls: 6 }),
        txt("hear every detail — $49, no subscription", { x: 142, y: 620, w: 900, h: 60, size: 38, font: F.hand, weight: 400, color: "#bef264" }),
        img(asset("music-note"), { x: 1380, y: 260, w: 320, h: 320 }),
      ]],
      ["Story", () => [
        ...deckHeader("Why we built it", "01 · story", "#a3e635", "#f8fafc"),
        txt("“Great sound shouldn't cost a month\nof rent or a subscription.”", { x: 140, y: 420, w: 1300, h: 240, size: 56, font: F.serif, weight: 700, italic: true, color: "#e2e8f0", lh: 1.4 }),
        txt("— the founding note, 2024", { x: 144, y: 690, w: 600, h: 50, size: 28, font: F.mono, weight: 400, color: "#64748b" }),
      ]],
      ["Features", () => [
        ...deckHeader("What it does", "02 · features", "#a3e635", "#f8fafc"),
        ...[["48h", "battery life"], ["-38dB", "active noise cancel"], ["IPX5", "sweat & rain ready"], ["USB-C", "10 min = 5 hours"]].flatMap(([n, l], i) => {
          const x = 140 + i * 420
          return [
            rect({ x, y: 420, w: 380, h: 340, fill: "#1e293b", r: 24 }),
            txt(n, { x, y: 480, w: 380, h: 120, size: 72, font: F.display, weight: 400, color: "#a3e635", align: "center" }),
            txt(l, { x: x + 20, y: 620, w: 340, h: 90, size: 26, weight: 500, color: "#cbd5e1", align: "center", lh: 1.4 }),
          ] as DesignElement[]
        }),
      ]],
      ["Launch plan", () => [
        ...deckHeader("Launch week", "03 · plan", "#a3e635", "#f8fafc"),
        chart("line", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], [{ name: "units (hundreds)", color: "#a3e635", values: [4, 6, 9, 14, 18, 22, 20] }], { x: 140, y: 400, w: 1100, h: 440, legend: false, grid: true }),
        ...["Tue: reviews embargo lifts", "Wed: creator unboxings (12 partners)", "Fri: live launch stream", "Sun: first restock decision"].map((s, i) => {
          const y = 420 + i * 110
          return [txt(s, { x: 1320, y, w: 480, h: 60, size: 28, weight: 500, color: "#e2e8f0", vAlign: "middle" })] as DesignElement[]
        }).flat(),
      ]],
      ["Pricing", () => [
        ...deckHeader("One price. No games.", "04 · pricing", "#a3e635", "#f8fafc"),
        rect({ x: 560, y: 380, w: 800, h: 520, fill: "#1e293b", stroke: "#a3e635", sw: 4, r: 28 }),
        txt("$49", { x: 560, y: 450, w: 800, h: 180, size: 150, font: F.display, weight: 400, color: "#f8fafc", align: "center" }),
        txt("free shipping · 30-day returns · 2-year warranty", { x: 560, y: 660, w: 800, h: 50, size: 28, weight: 500, color: "#bef264", align: "center" }),
        txt("no subscription — the X2 is yours, full stop", { x: 560, y: 740, w: 800, h: 50, size: 26, font: F.hand, weight: 400, color: "#94a3b8", align: "center" }),
      ]],
    ],
  },
  {
    slug: "deck-team-intro",
    name: "About Our Team — Deck (4 slides)",
    bg: "#fff1f2",
    accent: "#e11d48",
    soft: "#ffffff",
    inkSoft: "#881337",
    pages: [
      ["Cover", () => [
        rect({ x: 140, y: 140, w: 1640, h: 800, fill: "#ffffff", stroke: "#fecdd3", sw: 4, r: 28 }),
        txt("WE ARE THE\nSTUDIO CREW", { x: 240, y: 280, w: 1200, h: 380, size: 110, font: F.display, weight: 400, color: "#881337", lh: 1.08, ls: 2 }),
        img(asset("heart-big"), { x: 1380, y: 300, w: 280, h: 252 }),
        txt("9 people · 4 time zones · 1 shared goal", { x: 246, y: 700, w: 900, h: 60, size: 38, font: F.script, weight: 400, color: "#e11d48" }),
      ]],
      ["People", () => [
        ...deckHeader("Who we are", "01 · people", "#e11d48", "#881337"),
        ...[["Alex", "director · dog person"], ["Maya", "illustration · 3 cats"], ["Sam", "product · runner"], ["Rina", "ops · excel wizard"], ["Junia", "stickers · tea addict"], ["Bimo", "brand · drummer"], ["Dewi", "design · climber"], ["Tono", "support · gardener"], ["Nia", "research · knitter"]].flatMap(([n, r], i) => {
          const x = 140 + (i % 3) * 560
          const y = 400 + Math.floor(i / 3) * 210
          return [
            rect({ x, y, w: 500, h: 170, fill: "#ffffff", stroke: "#fecdd3", sw: 3, r: 18 }),
            ellipse({ x: x + 24, y: y + 35, w: 100, h: 100, fill: i % 2 ? "#fda4af" : "#fb7185" }),
            txt(n.slice(0, 2).toUpperCase(), { x: x + 24, y: y + 55, w: 100, h: 60, size: 34, font: F.pop, weight: 800, color: "#ffffff", align: "center" }),
            txt(n, { x: x + 150, y: y + 40, w: 330, h: 54, size: 34, font: F.pop, weight: 700, color: "#881337" }),
            txt(r, { x: x + 150, y: y + 95, w: 340, h: 44, size: 22, weight: 400, color: "#9f1239" }),
          ] as DesignElement[]
        }),
      ]],
      ["Values", () => [
        ...deckHeader("How we work", "02 · values", "#e11d48", "#881337"),
        ...[["Ship small, ship weekly", "big reveals hide problems"], ["Write it down", "if it matters twice, document it"], ["Free is the product", "no paywalls, ever"]].map((s, i) => {
          const y = 420 + i * 170
          return [
            txt(s[0], { x: 160, y, w: 900, h: 60, size: 40, font: F.serif, weight: 700, color: "#881337" }),
            txt(s[1], { x: 162, y: y + 66, w: 1200, h: 50, size: 28, weight: 400, color: "#9f1239" }),
          ] as DesignElement[]
        }).flat(),
      ]],
      ["Join us", () => [
        rect({ x: 0, y: 0, w: 1920, h: 1080, fill: "#e11d48", r: 0 }),
        txt("want in?", { x: 0, y: 330, w: 1920, h: 160, size: 130, font: F.script, weight: 700, color: "#fff1f2", align: "center" }),
        txt("we hire for kindness first, craft always", { x: 0, y: 520, w: 1920, h: 70, size: 44, font: F.serif, weight: 400, italic: true, color: "#ffe4e6", align: "center" }),
        txt("careers page · roles updated monthly", { x: 0, y: 640, w: 1920, h: 50, size: 30, font: F.mono, weight: 400, color: "#fecdd3", align: "center" }),
      ]],
    ],
  },
  {
    slug: "deck-strategy-okr",
    name: "Strategy on a Page — Deck (4 slides)",
    bg: "#0f172a",
    accent: "#fbbf24",
    soft: "#1e293b",
    inkSoft: "#f8fafc",
    pages: [
      ["Cover", () => [
        rect({ x: 120, y: 120, w: 1680, h: 840, fill: "#1e293b", r: 32 }),
        txt("STRATEGY\nON A PAGE", { x: 220, y: 300, w: 1200, h: 380, size: 120, font: F.display, weight: 400, color: "#f8fafc", lh: 1.05, ls: 4 }),
        txt("2026 · company · read in 4 minutes", { x: 226, y: 720, w: 800, h: 50, size: 30, font: F.mono, weight: 400, color: "#fbbf24" }),
        img(asset("rocket"), { x: 1380, y: 300, w: 300, h: 300 }),
      ]],
      ["Where we play", () => [
        ...deckHeader("Where we play", "01 · market", "#fbbf24", "#f8fafc"),
        ...bullets(["Everyone is a creator now — 200M+ people design monthly", "Paid tools lock the best features behind subscriptions", "Our wedge: free forever, honest tooling, local-first speed"], 140, 420, "#fbbf24", "#cbd5e1"),
      ]],
      ["How we win", () => [
        ...deckHeader("How we win", "02 · strategy", "#fbbf24", "#f8fafc"),
        ...[["SPEED", "fastest editor on low-end devices"], ["TRUST", "no paywalls, no dark patterns"], ["COMMUNITY", "creators make the template library"]].map((s, i) => {
          const x = 140 + i * 560
          return [
            rect({ x, y: 420, w: 500, h: 360, fill: "#1e293b", r: 24 }),
            txt(s[0], { x, y: 470, w: 500, h: 70, size: 44, font: F.display, weight: 400, color: "#fbbf24", align: "center", ls: 4 }),
            txt(s[1], { x: x + 40, y: 570, w: 420, h: 160, size: 28, weight: 400, color: "#cbd5e1", align: "center", lh: 1.6 }),
          ] as DesignElement[]
        }).flat(),
      ]],
      ["Scoreboard", () => [
        ...deckHeader("The scoreboard", "03 · okrs", "#fbbf24", "#f8fafc"),
        chart("progress", ["WAU 60k", "Conversion 60%", "Crash-free 99.9%", "Cost/user −20%"], [{ name: "progress", color: "#fbbf24", values: [75, 60, 90, 45] }], { x: 140, y: 400, w: 1300, h: 420, legend: false, fmt: "0%" }),
        txt("owner per metric listed in the quarterly OKR sheet", { x: 142, y: 880, w: 900, h: 40, size: 24, font: F.mono, weight: 400, color: "#64748b" }),
      ]],
    ],
  },
]

const deckTpls: TemplateSpec[] = DECKS.map((d) => ({
  slug: d.slug,
  name: d.name,
  category: "presentation",
  type: "presentation" as const,
  tags: ["presentation", "deck", "slides", "business"],
  width: 1920,
  height: 1080,
  featured: d.featured,
  build: () =>
    doc("presentation", 1920, 1080, solid(d.bg), d.pages.map(([name, els]) => page(name, solid(d.bg), els()))),
}))

/* ------------------------------ infographics ------------------------------ */

const infographics: TemplateSpec[] = [
  {
    slug: "infographic-comparison",
    name: "Plan A vs Plan B — Comparison",
    category: "infographic",
    type: "canvas",
    tags: ["comparison", "versus", "pricing", "infographic"],
    width: 1080,
    height: 1350,
    build: () =>
      doc("canvas", 1080, 1350, solid("#f8fafc"), [
        page("Comparison", solid("#f8fafc"), [
          rect({ x: 90, y: 260, w: 420, h: 820, fill: "#ffffff", stroke: "#e5e7eb", sw: 3, r: 24 }),
          rect({ x: 570, y: 220, w: 420, h: 900, fill: "#0f172a", r: 24 }),
          txt("PLAN A", { x: 90, y: 320, w: 420, h: 60, size: 36, font: F.mono, weight: 700, color: "#64748b", align: "center", ls: 6 }),
          txt("$0", { x: 90, y: 400, w: 420, h: 130, size: 100, font: F.display, weight: 400, color: INK, align: "center" }),
          ...["all templates", "full editor", "PNG & PDF export", "3 projects", "community support"].map((f, i) => {
            const y = 570 + i * 80
            return [
              txt("+", { x: 130, y, w: 50, h: 60, size: 30, weight: 700, color: "#22c55e", vAlign: "middle" }),
              txt(f, { x: 190, y, w: 300, h: 60, size: 26, weight: 500, color: "#374151", vAlign: "middle" }),
            ] as DesignElement[]
          }).flat(),
          txt("PLAN B", { x: 570, y: 280, w: 420, h: 60, size: 36, font: F.mono, weight: 700, color: "#a3e635", align: "center", ls: 6 }),
          txt("$0", { x: 570, y: 360, w: 420, h: 130, size: 100, font: F.display, weight: 400, color: "#ffffff", align: "center" }),
          ...["everything in A", "unlimited projects", "SVG, video & ZIP export", "brand kits", "priority support", "early features"].map((f, i) => {
            const y = 530 + i * 80
            return [
              txt("+", { x: 610, y, w: 50, h: 60, size: 30, weight: 700, color: "#a3e635", vAlign: "middle" }),
              txt(f, { x: 670, y, w: 320, h: 60, size: 26, weight: 500, color: "#e2e8f0", vAlign: "middle" }),
            ] as DesignElement[]
          }).flat(),
          ...pill("B IS ALSO $0 — LOL, RIGHT?", { x: 230, y: 1180, w: 620, h: 92, fill: "#a3e635", size: 28, color: "#0f172a" }),
          txt("both plans are free forever — B just unlocks with a free account", { x: 0, y: 1000, w: 1080, h: 44, size: 24, font: F.mono, weight: 400, color: "#94a3b8", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "infographic-timeline",
    name: "How It Happened — Timeline",
    category: "infographic",
    type: "canvas",
    tags: ["timeline", "history", "milestones"],
    width: 1080,
    height: 1920,
    featured: true,
    build: () => {
      const events: [string, string][] = [
        ["2023", "two friends, one buggy prototype"],
        ["2024", "first 1,000 users — all word of mouth"],
        ["2025", "mobile editor + 9 languages"],
        ["2026", "260 templates, 60k weekly creators"],
      ]
      const els: DesignElement[] = [
        txt("HOW IT\nHAPPENED", { x: 90, y: 160, w: 900, h: 320, size: 110, font: F.display, weight: 400, color: "#134e4a", lh: 1.05 }),
        rect({ x: 150, y: 560, w: 10, h: 1150, fill: "#99f6e4", r: 5 }),
      ]
      events.forEach(([year, what], i) => {
        const y = 600 + i * 290
        els.push(ellipse({ x: 100, y, w: 110, h: 110, fill: i % 2 ? "#14b8a6" : "#fbbf24" }))
        els.push(txt(year, { x: 100, y: y + 26, w: 110, h: 60, size: 34, font: F.mono, weight: 700, color: i % 2 ? "#f0fdfa" : INK, align: "center" }))
        els.push(txt(what, { x: 250, y: y + 16, w: 740, h: 80, size: 36, font: F.body, weight: 500, color: "#134e4a", lh: 1.4 }))
      })
      els.push(txt("and we're just getting started", { x: 100, y: 1800, w: 880, h: 50, size: 30, font: F.hand, weight: 400, color: "#0f766e" }))
      return doc("canvas", 1080, 1920, solid("#f0fdfa"), [page("Timeline", solid("#f0fdfa"), els)])
    },
  },
  {
    slug: "infographic-budget-donut",
    name: "Where the Money Goes — Donut",
    category: "infographic",
    type: "canvas",
    tags: ["budget", "donut", "chart", "finance"],
    width: 1080,
    height: 1350,
    build: () =>
      doc("canvas", 1080, 1350, solid("#ffffff"), [
        page("Infographic", solid("#ffffff"), [
          txt("WHERE THE MONEY GOES", { x: 0, y: 100, w: 1080, h: 70, size: 52, font: F.cond, weight: 600, color: INK, align: "center", ls: 3 }),
          txt("a typical indie studio month, in percentages", { x: 0, y: 190, w: 1080, h: 44, size: 28, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
          chart("doughnut", ["Servers", "People", "Software", "Savings", "Snacks"], [{ name: "Share", color: "#7c3aed", values: [18, 52, 12, 13, 5] }], { x: 140, y: 290, w: 800, h: 700, legend: true }),
          txt("people first, snacks a close second", { x: 0, y: 1050, w: 1080, h: 50, size: 30, font: F.hand, weight: 400, color: "#7c3aed", align: "center" }),
          txt("illustrative numbers — swap in your own data", { x: 0, y: 1250, w: 1080, h: 40, size: 22, font: F.mono, weight: 400, color: "#d1d5db", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "infographic-checklist",
    name: "Launch Day — Checklist Infographic",
    category: "infographic",
    type: "canvas",
    tags: ["checklist", "launch", "process"],
    width: 1080,
    height: 1350,
    build: () =>
      doc("canvas", 1080, 1350, solid("#fff7ed"), [
        page("Checklist", solid("#fff7ed"), [
          txt("LAUNCH DAY CHECKLIST", { x: 90, y: 110, w: 900, h: 90, size: 64, font: F.display, weight: 400, color: "#9a3412", ls: 2 }),
          txt("print it, tape it above the desk", { x: 92, y: 220, w: 800, h: 46, size: 28, font: F.hand, weight: 400, color: "#ea580c" }),
          ...["Website loads under 2s", "Payment tested — twice", "Emails render on mobile", "Status page green", "Support on-call named", "Rollback plan written"].map((s, i) => {
            const y = 320 + i * 130
            return [
              rect({ x: 100, y, w: 880, h: 100, fill: "#ffffff", stroke: "#fdba74", sw: 3, r: 16 }),
              rect({ x: 130, y: y + 25, w: 50, h: 50, fill: "#f97316", r: 10 }),
              txt("✓", { x: 130, y: y + 22, w: 50, h: 56, size: 30, weight: 800, color: "#fff7ed", align: "center", vAlign: "middle" }),
              txt(s, { x: 210, y: y + 24, w: 740, h: 56, size: 30, weight: 600, color: "#7c2d12", vAlign: "middle" }),
            ] as DesignElement[]
          }).flat(),
          txt("when everything is checked: take a walk. really.", { x: 100, y: 1130, w: 880, h: 50, size: 28, font: F.hand, weight: 400, color: "#9a3412" }),
        ]),
      ]),
  },
  {
    slug: "infographic-pyramid",
    name: "Support Pyramid — Priorities",
    category: "infographic",
    type: "canvas",
    tags: ["pyramid", "priorities", "framework"],
    width: 1080,
    height: 1350,
    build: () => {
      const tiers: [string, string, string][] = [
        ["DELIGHT", "surprise & delight features", "#fbbf24"],
        ["RELIABLE", "fast, stable, honest", "#fb923c"],
        ["USEFUL", "core jobs done well", "#ea580c"],
      ]
      const widths = [340, 560, 800]
      const els: DesignElement[] = [
        txt("THE SUPPORT PYRAMID", { x: 0, y: 110, w: 1080, h: 80, size: 58, font: F.display, weight: 400, color: "#7c2d12", align: "center", ls: 3 }),
        txt("build bottom-up — never skip a level", { x: 0, y: 210, w: 1080, h: 44, size: 28, font: F.mono, weight: 400, color: "#c2410c", align: "center" }),
      ]
      tiers.forEach(([t, d, c], i) => {
        const w = widths[i]
        const y = 320 + i * 280
        els.push(shp("triangle", { x: 540 - w / 2, y, w, h: 250, fill: c }))
        els.push(txt(t, { x: 540 - w / 2, y: y + 90, w, h: 70, size: 44, font: F.display, weight: 400, color: i === 0 ? "#78350f" : "#fff7ed", align: "center" }))
        els.push(txt(d, { x: 0, y: y + 165, w: 1080, h: 44, size: 26, font: F.body, weight: 400, color: i === 0 ? "#78350f" : "#ffedd5", align: "center" }))
      })
      els.push(txt("most teams try to start at the top — that's the mistake", { x: 0, y: 1220, w: 1080, h: 50, size: 28, font: F.hand, weight: 400, color: "#9a3412", align: "center" }))
      return doc("canvas", 1080, 1350, solid("#fff7ed"), [page("Pyramid", solid("#fff7ed"), els)])
    },
  },
  {
    slug: "infographic-dos-donts",
    name: "Do & Don't — Slide-ready Comparison",
    category: "infographic",
    type: "canvas",
    tags: ["dos donts", "tips", "comparison"],
    width: 1920,
    height: 1080,
    build: () => {
      return doc("canvas", 1920, 1080, solid("#f8fafc"), [
        page("Dos & Don'ts", solid("#f8fafc"), [
          txt("DESIGN — DO & DON'T", { x: 0, y: 90, w: 1920, h: 90, size: 70, font: F.display, weight: 400, color: INK, align: "center", ls: 4 }),
          rect({ x: 160, y: 240, w: 760, h: 640, fill: "#ecfdf5", stroke: "#6ee7b7", sw: 4, r: 28 }),
          rect({ x: 1000, y: 240, w: 760, h: 640, fill: "#fef2f2", stroke: "#fca5a5", sw: 4, r: 28 }),
          txt("DO", { x: 160, y: 280, w: 760, h: 70, size: 52, font: F.display, weight: 400, color: "#047857", align: "center", ls: 8 }),
          txt("DON'T", { x: 1000, y: 280, w: 760, h: 70, size: 52, font: F.display, weight: 400, color: "#b91c1c", align: "center", ls: 8 }),
          ...["Use one accent color", "Contrast before style", "Test on a real phone"].map((s, i) => [txt(`+  ${s}`, { x: 220, y: 400 + i * 140, w: 660, h: 60, size: 32, weight: 500, color: "#065f46", vAlign: "middle" })] as DesignElement[]).flat(),
          ...["Six fonts in one page", "Text over busy photos", "Center everything blindly"].map((s, i) => [txt(`×  ${s}`, { x: 1060, y: 400 + i * 140, w: 660, h: 60, size: 32, weight: 500, color: "#7f1d1d", vAlign: "middle" })] as DesignElement[]).flat(),
        ]),
      ])
    },
  },
  {
    slug: "infographic-bar-chart",
    name: "Reading Habits — Bar Chart",
    category: "infographic",
    type: "canvas",
    tags: ["bar chart", "survey", "data", "stats"],
    width: 1080,
    height: 1350,
    build: () =>
      doc("canvas", 1080, 1350, solid("#fafaf9"), [
        page("Chart", solid("#fafaf9"), [
          txt("HOW OUR COMMUNITY READS", { x: 0, y: 100, w: 1080, h: 80, size: 56, font: F.display, weight: 400, color: INK, align: "center", ls: 3 }),
          txt("survey of 1,204 creators · may 2026", { x: 0, y: 195, w: 1080, h: 44, size: 26, font: F.mono, weight: 400, color: "#78716c", align: "center" }),
          chart("bar", ["Paper books", "E-reader", "Phone", "Audiobooks"], [{ name: "% of readers", color: "#e11d48", values: [41, 24, 22, 13] }], { x: 100, y: 300, w: 880, h: 620, legend: false, grid: true, fmt: "0%" }),
          txt("paper wins — the e-reader was a plot twist", { x: 0, y: 980, w: 1080, h: 50, size: 30, font: F.hand, weight: 400, color: "#e11d48", align: "center" }),
          ...pill("steal this chart — it's editable", { x: 290, y: 1120, w: 500, h: 88, fill: INK, size: 26, color: "#fafaf9" }),
        ]),
      ]),
  },
  {
    slug: "infographic-myths-facts",
    name: "Myth vs Fact — Design Edition",
    category: "infographic",
    type: "canvas",
    tags: ["myths", "facts", "education", "listicle"],
    width: 1080,
    height: 1350,
    build: () =>
      doc("canvas", 1080, 1350, solid("#eef2ff"), [
        page("Myths", solid("#eef2ff"), [
          txt("MYTH vs FACT", { x: 0, y: 100, w: 1080, h: 90, size: 70, font: F.display, weight: 400, color: "#312e81", align: "center", ls: 4 }),
          txt("design edition · save for your next debate", { x: 0, y: 205, w: 1080, h: 44, size: 26, font: F.mono, weight: 400, color: "#818cf8", align: "center" }),
          ...[
            ["“Design is just decoration”", "Design is decisions — what to show, what to hide, what to make obvious."],
            ["“More options = better UX”", "Every extra option taxes attention. Fewer, better choices win."],
            ["“You need art school”", "You need taste, reps and feedback. School can help; it isn't the gate."],
          ].flatMap(([myth, fact], i) => {
            const y = 300 + i * 320
            return [
              rect({ x: 90, y, w: 900, h: 270, fill: "#ffffff", stroke: "#c7d2fe", sw: 3, r: 22 }),
              rect({ x: 90, y, w: 16, h: 270, fill: "#6366f1", r: 8 }),
              txt(`MYTH ${i + 1}`, { x: 140, y: y + 26, w: 300, h: 40, size: 24, font: F.mono, weight: 700, color: "#6366f1", ls: 4 }),
              txt(myth, { x: 140, y: y + 70, w: 800, h: 60, size: 34, font: F.serif, weight: 700, italic: true, color: "#312e81" }),
              txt(`FACT: ${fact}`, { x: 140, y: y + 150, w: 800, h: 100, size: 26, weight: 400, color: "#4338ca", lh: 1.55 }),
            ] as DesignElement[]
          }),
        ]),
      ]),
  },
  {
    slug: "infographic-big-numbers",
    name: "Water Week — Big Numbers",
    category: "infographic",
    type: "canvas",
    tags: ["stats", "big numbers", "campaign"],
    width: 1080,
    height: 1350,
    build: () =>
      doc("canvas", 1080, 1350, gradient("#0284c7", "#38bdf8", 160), [
        page("Numbers", gradient("#0284c7", "#38bdf8", 160), [
          img(asset("waves-pattern"), { x: 0, y: 1000, w: 1080, h: 350, opacity: 0.8 }),
          txt("WATER WEEK\nIN NUMBERS", { x: 0, y: 110, w: 1080, h: 300, size: 90, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1.1, ls: 3 }),
          ...[["412", "bottles refilled at our stations"], ["68", "schools visited by the filter van"], ["1,204", "pledges to skip single-use"]].flatMap(([n, l], i) => {
            const y = 440 + i * 230
            return [
              txt(n, { x: 90, y, w: 380, h: 130, size: 110, font: F.display, weight: 400, color: "#fde047" }),
              txt(l, { x: 500, y: y + 34, w: 500, h: 90, size: 28, weight: 500, color: "#f0f9ff", lh: 1.4 }),
            ] as DesignElement[]
          }),
          txt("one week, one city, one less excuse", { x: 0, y: 1160, w: 1080, h: 60, size: 34, font: F.script, weight: 400, color: "#ffffff", align: "center" }),
        ]),
      ]),
  },
]

/* ------------------------------ whiteboards ------------------------------ */

const whiteboards: TemplateSpec[] = [
  {
    slug: "whiteboard-flowchart",
    name: "Approval Flow — Flowchart",
    category: "whiteboard",
    type: "whiteboard",
    tags: ["flowchart", "process", "approval"],
    width: 2400,
    height: 1400,
    build: () => {
      const node = (x: number, y: number, label: string, fill: string, ink: string): DesignElement[] => [
        rect({ x, y, w: 340, h: 140, fill, r: 20 }),
        txt(label, { x, y: y + 40, w: 340, h: 60, size: 30, weight: 700, color: ink, align: "center" }),
      ]
      const els: DesignElement[] = [
        txt("Content approval flow — v2", { x: 100, y: 80, w: 1000, h: 70, size: 48, font: F.cond, weight: 600, color: "#1f2937" }),
        ...node(140, 420, "1 · Draft", "#ffffff", INK),
        ...node(640, 420, "2 · Self-review", "#dbeafe", "#1e3a8a"),
        ...node(1140, 420, "3 · Peer review", "#dbeafe", "#1e3a8a"),
        ...node(1640, 420, "4 · Legal (if claims)", "#fef3c7", "#92400e"),
        ...node(1140, 780, "5 · Schedule", "#dcfce7", "#14532d"),
        ...node(1640, 780, "6 · Measure after 72h", "#dcfce7", "#14532d"),
        rect({ x: 480, y: 488, w: 160, h: 6, fill: "#94a3b8", r: 3 }),
        rect({ x: 980, y: 488, w: 160, h: 6, fill: "#94a3b8", r: 3 }),
        rect({ x: 1480, y: 488, w: 160, h: 6, fill: "#94a3b8", r: 3 }),
        rect({ x: 1308, y: 560, w: 6, h: 220, fill: "#94a3b8", r: 3 }),
        rect({ x: 1480, y: 848, w: 160, h: 6, fill: "#94a3b8", r: 3 }),
        txt("rejected? back to step 1 with notes — no silent edits", { x: 140, y: 640, w: 800, h: 50, size: 28, font: F.hand, weight: 400, color: "#dc2626" }),
        txt("SLA: each step max 1 business day", { x: 140, y: 1100, w: 900, h: 50, size: 30, font: F.mono, weight: 400, color: "#6b7280" }),
      ]
      return doc("whiteboard", 2400, 1400, solid("#f8fafc"), [page("Flow", solid("#f8fafc"), els)])
    },
  },
  {
    slug: "whiteboard-mindmap",
    name: "Launch Ideas — Mind Map",
    category: "whiteboard",
    type: "whiteboard",
    tags: ["mind map", "brainstorm", "ideas"],
    width: 2400,
    height: 1500,
    build: () => {
      const branch = (x: number, y: number, label: string, fill: string, leaves: string[]): DesignElement[] => [
        rect({ x, y, w: 300, h: 110, fill, r: 55 }),
        txt(label, { x, y: y + 30, w: 300, h: 50, size: 30, weight: 700, color: INK, align: "center" }),
        ...leaves.map((l, i) => [
          txt(`• ${l}`, { x: x - 90 + (i % 2) * 240, y: y + 150 + Math.floor(i / 2) * 64, w: 260, h: 54, size: 24, weight: 500, color: "#374151", vAlign: "middle" }),
        ] as DesignElement[]).flat(),
      ]
      return doc("whiteboard", 2400, 1500, solid("#fefce8"), [
        page("Mind map", solid("#fefce8"), [
          ellipse({ x: 1020, y: 620, w: 360, h: 220, fill: "#a3e635" }),
          txt("LAUNCH\nIDEAS", { x: 1020, y: 660, w: 360, h: 140, size: 44, font: F.display, weight: 400, color: "#1a2e05", align: "center", lh: 1.15 }),
          ...branch(300, 240, "SOCIAL", "#fde047", ["teaser loop video", "founder thread", "countdown story"]),
          ...branch(1750, 240, "PARTNERS", "#bbf7d0", ["creator kits", "bundle swap", "podcast swap"]),
          ...branch(260, 1000, "IN-APP", "#bfdbfe", ["announcement modal", "changelog post", "new template badge"]),
          ...branch(1760, 1000, "COMMUNITY", "#fbcfe8", ["launch party live", "show & tell week", "sticker drop"]),
          txt("pick one per branch — ship the rest later", { x: 100, y: 1380, w: 1000, h: 50, size: 30, font: F.hand, weight: 400, color: "#a16207" }),
        ]),
      ])
    },
  },
  {
    slug: "whiteboard-retro",
    name: "Sprint Retro — Board",
    category: "whiteboard",
    type: "whiteboard",
    tags: ["retrospective", "sprint", "team", "agile"],
    width: 2400,
    height: 1400,
    featured: true,
    build: () => {
      const cols: [string, string, string[]][] = [
        ["WENT WELL", "#bbf7d0", ["shipped dark mode", "no p1 incidents", "demo had laughs"]],
        ["TO IMPROVE", "#fde68a", ["standup ran 25 min", "3 ambiguous tickets"]],
        ["IDEAS", "#bfdbfe", ["timer for standup", "ticket template v2"]],
        ["ACTIONS", "#fbcfe8", ["Sam: draft template", "all: read the doc first"]],
      ]
      const els: DesignElement[] = [
        txt("Sprint 13 — Retro · 30 min · everyone talks", { x: 100, y: 80, w: 1400, h: 70, size: 50, font: F.cond, weight: 600, color: "#1f2937" }),
        txt("keep it kind, keep it specific", { x: 104, y: 160, w: 800, h: 44, size: 30, font: F.hand, weight: 400, color: "#6b7280" }),
      ]
      cols.forEach(([title, color, notes], ci) => {
        const x = 100 + ci * 560
        els.push(txt(title, { x, y: 260, w: 480, h: 60, size: 40, font: F.cond, weight: 600, color: "#374151", ls: 2 }))
        els.push(rect({ x, y: 340, w: 480, h: 860, fill: "#ffffff", stroke: "#e5e7eb", sw: 3, r: 16, opacity: 0.85 }))
        notes.forEach((n, ni) => {
          els.push(note(n, { x: x + 30, y: 380 + ni * 280, w: 420, h: 240, color, size: 32, rotation: ni % 2 ? -2 : 2 }))
        })
      })
      return doc("whiteboard", 2400, 1400, solid("#f8f7f4"), [page("Retro", solid("#f8f7f4"), els)])
    },
  },
  {
    slug: "whiteboard-user-journey",
    name: "First Visit — User Journey Map",
    category: "whiteboard",
    type: "whiteboard",
    tags: ["user journey", "ux", "mapping"],
    width: 2400,
    height: 1200,
    build: () => {
      const stages: [string, string, string][] = [
        ["DISCOVER", "lands from template gallery", "curious"],
        ["EXPLORE", "opens 3 templates", "excited"],
        ["EDIT", "changes text & colors", "confident"],
        ["EXPORT", "downloads PNG", "proud"],
        ["RETURN", "saves & re-opens", "attached"],
      ]
      const els: DesignElement[] = [
        txt("First visit journey — where do they feel what?", { x: 100, y: 80, w: 1600, h: 70, size: 48, font: F.cond, weight: 600, color: "#1f2937" }),
      ]
      stages.forEach(([stage, doing, feel], i) => {
        const x = 120 + i * 440
        els.push(rect({ x, y: 260, w: 380, h: 130, fill: "#0f172a", r: 20 }))
        els.push(txt(stage, { x, y: 300, w: 380, h: 60, size: 30, font: F.mono, weight: 700, color: "#ffffff", align: "center" }))
        els.push(rect({ x, y: 430, w: 380, h: 150, fill: "#ffffff", stroke: "#e5e7eb", sw: 3, r: 20 }))
        els.push(txt(doing, { x: x + 24, y: 460, w: 330, h: 90, size: 26, weight: 500, color: "#374151", lh: 1.5 }))
        els.push(ellipse({ x: x + 110, y: 630, w: 160, h: 100, fill: i % 2 ? "#fde68a" : "#bbf7d0" }))
        els.push(txt(feel, { x: x + 110, y: 656, w: 160, h: 50, size: 24, font: F.hand, weight: 700, color: INK, align: "center" }))
        if (i < 4) els.push(shp("arrow", { x: x + 390, y: 305, w: 40, h: 40, fill: "#94a3b8", rotation: 90 }))
      })
      els.push(txt("emoji row = feeling temperature — mark dips and fix those steps first", { x: 120, y: 820, w: 1800, h: 50, size: 30, font: F.hand, weight: 400, color: "#6b7280" }))
      els.push(note("biggest dip: edit step on mobile", { x: 980, y: 920, w: 420, h: 220, color: "#fecaca", size: 30, rotation: -2 }))
      return doc("whiteboard", 2400, 1200, solid("#f8fafc"), [page("Journey", solid("#f8fafc"), els)])
    },
  },
  {
    slug: "whiteboard-roadmap",
    name: "Now / Next / Later — Roadmap",
    category: "whiteboard",
    type: "whiteboard",
    tags: ["roadmap", "planning", "now next later"],
    width: 2400,
    height: 1200,
    build: () => {
      const cols: [string, string, string[]][] = [
        ["NOW", "#a3e635", ["editor perf sprint", "mobile bug bash"]],
        ["NEXT", "#fde047", ["AI layout suggestions", "team spaces"]],
        ["LATER", "#bfdbfe", ["plugin API", "self-host collab"]],
      ]
      const els: DesignElement[] = [
        txt("Roadmap — Now / Next / Later · updated monthly", { x: 100, y: 80, w: 1600, h: 70, size: 48, font: F.cond, weight: 600, color: "#0f172a" }),
      ]
      cols.forEach(([t, c, items], i) => {
        const x = 120 + i * 740
        els.push(rect({ x, y: 220, w: 660, h: 60, fill: c, r: 30 }))
        els.push(txt(t, { x, y: 222, w: 660, h: 56, size: 32, font: F.display, weight: 400, color: INK, align: "center", ls: 6 }))
        els.push(rect({ x, y: 320, w: 660, h: 640, fill: "#ffffff", stroke: "#e5e7eb", sw: 3, r: 20, opacity: 0.9 }))
        items.forEach((it, ii) => {
          els.push(rect({ x: x + 40, y: 380 + ii * 240, w: 580, h: 180, fill: c, opacity: 0.35, r: 16 }))
          els.push(txt(it, { x: x + 70, y: 430 + ii * 240, w: 520, h: 80, size: 30, weight: 600, color: INK, vAlign: "middle" }))
        })
      })
      els.push(txt("later ≠ promised — it's a parking lot with better manners", { x: 120, y: 1040, w: 1600, h: 50, size: 30, font: F.hand, weight: 400, color: "#64748b" }))
      return doc("whiteboard", 2400, 1200, solid("#f8fafc"), [page("Roadmap", solid("#f8fafc"), els)])
    },
  },
  {
    slug: "whiteboard-brainstorm",
    name: "Quiet Brainstorm — Sticky Board",
    category: "whiteboard",
    type: "whiteboard",
    tags: ["brainstorm", "ideas", "workshop", "sticky notes"],
    width: 2400,
    height: 1200,
    build: () => {
      const colors = ["#fde68a", "#bbf7d0", "#fbcfe8", "#bfdbfe", "#ddd6fe", "#fecaca"]
      const ideas = ["free sticker pack", "school program", "creator fund", "localization", "offline mode", "template contests", "print partners", "pixel editor"]
      const els: DesignElement[] = [
        txt("Brainstorm: 8 minutes, silent, one idea per note", { x: 100, y: 80, w: 1800, h: 70, size: 48, font: F.cond, weight: 600, color: "#1f2937" }),
        txt("then we dot-vote: 3 dots each, no voting for your own", { x: 104, y: 165, w: 1400, h: 50, size: 32, font: F.hand, weight: 400, color: "#7c3aed" }),
      ]
      ideas.forEach((idea, i) => {
        const x = 160 + (i % 4) * 540
        const y = 320 + Math.floor(i / 4) * 380
        els.push(note(idea, { x, y, w: 420, h: 300, color: colors[i % 6], size: 40, rotation: i % 2 ? -2 : 2 }))
        els.push(txt("• • •", { x: x + 140, y: y + 220, w: 140, h: 50, size: 26, color: "#374151", align: "center" }))
      })
      return doc("whiteboard", 2400, 1200, solid("#fafaf9"), [page("Brainstorm", solid("#fafaf9"), els)])
    },
  },
  {
    slug: "whiteboard-kanban-personal",
    name: "My Week — Personal Kanban",
    category: "whiteboard",
    type: "whiteboard",
    tags: ["kanban", "personal", "todo", "productivity"],
    width: 2200,
    height: 1200,
    build: () => {
      const cols: [string, string[]][] = [
        ["TO DO (max 3!)", ["invoice template pack", "fix export dialog copy", "call the printer"]],
        ["DOING (1 thing)", ["editor perf sprint"]],
        ["DONE", ["weekly newsletter", "librarian outreach", "3 template reviews"]],
      ]
      const els: DesignElement[] = [
        txt("Personal kanban — WIP limits are self-care", { x: 100, y: 80, w: 1400, h: 70, size: 48, font: F.cond, weight: 600, color: "#1f2937" }),
      ]
      cols.forEach(([t, cards], i) => {
        const x = 120 + i * 680
        els.push(txt(t, { x, y: 220, w: 600, h: 56, size: 36, font: F.cond, weight: 600, color: i === 1 ? "#7c3aed" : "#374151", ls: 2 }))
        els.push(rect({ x, y: 300, w: 600, h: 700, fill: "#ffffff", stroke: "#e5e7eb", sw: 3, r: 20, opacity: 0.85 }))
        cards.forEach((c, ci) => {
          els.push(note(c, { x: x + 40, y: 360 + ci * 300, w: 520, h: 240, color: i === 1 ? "#ddd6fe" : "#fde68a", size: 34, rotation: ci % 2 ? -1.5 : 1.5 }))
        })
      })
      return doc("whiteboard", 2200, 1200, solid("#f8f7f4"), [page("Kanban", solid("#f8f7f4"), els)])
    },
  },
]

/* ------------------------------ photo & wallpapers ------------------------------ */

const photoTpls: TemplateSpec[] = [
  {
    slug: "collage-filmstrip",
    name: "Filmstrip — Photo Collage",
    category: "photo",
    type: "canvas",
    tags: ["collage", "filmstrip", "photos"],
    width: 1080,
    height: 1350,
    build: () => {
      const frames: DesignElement[] = [rect({ x: 60, y: 120, w: 960, h: 940, fill: INK, r: 20 })]
      for (let i = 0; i < 4; i++) {
        const y = 160 + i * 230
        frames.push(rect({ x: 90, y, w: 900, h: 190, fill: "#e5e7eb", r: 8 }))
        frames.push(txt(`photo ${i + 1}`, { x: 90, y: y + 70, w: 900, h: 50, size: 28, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }))
        frames.push(rect({ x: 70, y: y + 8, w: 10, h: 60, fill: "#374151", r: 3 }))
        frames.push(rect({ x: 70, y: y + 120, w: 10, h: 60, fill: "#374151", r: 3 }))
        frames.push(rect({ x: 1000, y: y + 8, w: 10, h: 60, fill: "#374151", r: 3 }))
        frames.push(rect({ x: 1000, y: y + 120, w: 10, h: 60, fill: "#374151", r: 3 }))
      }
      frames.push(txt("the summer reel", { x: 0, y: 1120, w: 1080, h: 90, size: 64, font: F.script, weight: 400, color: INK, align: "center" }))
      frames.push(txt("swap each band with your own photos — 4:3 crop works best", { x: 0, y: 1230, w: 1080, h: 40, size: 24, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }))
      return doc("canvas", 1080, 1350, solid("#f5f5f4"), [page("Collage", solid("#f5f5f4"), frames)])
    },
  },
  {
    slug: "collage-grid-six",
    name: "Six Up — Photo Grid Collage",
    category: "photo",
    type: "canvas",
    tags: ["collage", "grid", "photos", "gallery"],
    width: 1080,
    height: 1080,
    build: () => {
      const cells: DesignElement[] = []
      for (let i = 0; i < 6; i++) {
        const x = 80 + (i % 2) * 470
        const y = 80 + Math.floor(i / 2) * 310
        cells.push(rect({ x, y, w: 450, h: 290, fill: "#e5e7eb", r: 12 }))
        cells.push(txt(`${i + 1}`, { x, y: y + 110, w: 450, h: 70, size: 48, font: F.display, weight: 400, color: "#9ca3af", align: "center" }))
      }
      cells.push(txt("six up · even margins · easy drag", { x: 0, y: 1000, w: 1080, h: 50, size: 26, font: F.mono, weight: 400, color: "#6b7280", align: "center" }))
      return doc("canvas", 1080, 1080, solid("#ffffff"), [page("Grid", solid("#ffffff"), cells)])
    },
  },
  {
    slug: "magazine-cover",
    name: "The Issue — Magazine Cover",
    category: "photo",
    type: "canvas",
    tags: ["magazine", "cover", "editorial", "portrait"],
    width: 1080,
    height: 1500,
    featured: true,
    build: () =>
      doc("canvas", 1080, 1500, solid("#f5f5f4"), [
        page("Cover", solid("#f5f5f4"), [
          rect({ x: 60, y: 60, w: 960, h: 1380, fill: "#111827", r: 8 }),
          rect({ x: 90, y: 90, w: 900, h: 900, fill: "#374151", r: 4 }),
          txt("COVER PHOTO 3:4", { x: 90, y: 500, w: 900, h: 60, size: 36, font: F.mono, weight: 700, color: "#9ca3af", align: "center", ls: 6 }),
          txt("THE ISSUE", { x: 90, y: 120, w: 900, h: 130, size: 110, font: F.display, weight: 400, color: "#ffffff", ls: 10 }),
          txt("the makers issue", { x: 90, y: 1010, w: 900, h: 80, size: 56, font: F.script, weight: 400, color: "#fde047" }),
          txt("inside: 12 maker stories · the slow studio tour ·\nwhy we still print · free poster pull-out", { x: 90, y: 1120, w: 900, h: 140, size: 30, weight: 400, color: "#e5e7eb", lh: 1.6 }),
          txt("no. 07 — free, like everything here", { x: 90, y: 1350, w: 900, h: 40, size: 24, font: F.mono, weight: 400, color: "#6b7280" }),
        ]),
      ]),
  },
  {
    slug: "polaroid-scatter",
    name: "Polaroid Memories — Scatter Collage",
    category: "photo",
    type: "canvas",
    tags: ["polaroid", "collage", "memories", "scatter"],
    width: 1080,
    height: 1350,
    build: () => {
      const spots: [number, number, number, string][] = [
        [120, 140, -6, "lisbon, day 1"],
        [560, 220, 4, "the good coffee"],
        [200, 560, 3, "tram 28 again"],
        [620, 680, -4, "pasteis > everything"],
      ]
      const els: DesignElement[] = spots.flatMap(([x, y, rot, caption]) => [
        img(asset("frame-polaroid"), { x, y, w: 380, h: 430, rotation: rot }),
        txt("PHOTO", { x: x + 30, y: y + 160, w: 320, h: 60, size: 30, font: F.mono, weight: 700, color: "#9ca3af", align: "center" }),
        txt(caption, { x: x + 20, y: y + 350, w: 340, h: 50, size: 28, font: F.hand, weight: 700, color: INK, align: "center" }),
      ])
      els.push(img(asset("frame-tape"), { x: 330, y: 380, w: 420, h: 420, rotation: -2, opacity: 0.95 }))
      els.push(txt("polaroid memories", { x: 0, y: 1130, w: 1080, h: 90, size: 64, font: F.script, weight: 400, color: INK, align: "center" }))
      els.push(txt("drop photos in the gray windows, keep the captions honest", { x: 0, y: 1240, w: 1080, h: 40, size: 24, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }))
      return doc("canvas", 1080, 1350, solid("#e7e5e4"), [page("Collage", solid("#e7e5e4"), els)])
    },
  },
  {
    slug: "wallpaper-focus-dark",
    name: "Focus Mode — Phone Wallpaper",
    category: "photo",
    type: "canvas",
    tags: ["wallpaper", "phone", "dark", "focus"],
    width: 1080,
    height: 1920,
    build: () =>
      doc("canvas", 1080, 1920, solid("#030712"), [
        page("Wallpaper", solid("#030712"), [
          img(asset("moon"), { x: 700, y: 240, w: 200, h: 200, opacity: 0.9 }),
          shp("star", { x: 200, y: 400, w: 40, h: 40, fill: "#e5e7eb", opacity: 0.5 }),
          shp("star", { x: 840, y: 700, w: 30, h: 30, fill: "#e5e7eb", opacity: 0.4, rotation: 20 }),
          shp("star", { x: 160, y: 1240, w: 34, h: 34, fill: "#e5e7eb", opacity: 0.4, rotation: -12 }),
          txt("one thing\nat a time", { x: 0, y: 820, w: 1080, h: 300, size: 110, font: F.serif, weight: 700, color: "#f9fafb", align: "center", lh: 1.25 }),
          txt("· · ·", { x: 0, y: 1140, w: 1080, h: 50, size: 30, color: "#6b7280", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "wallpaper-pastel-checks",
    name: "Soft Checks — Phone Wallpaper",
    category: "photo",
    type: "canvas",
    tags: ["wallpaper", "phone", "pastel", "pattern"],
    width: 1080,
    height: 1920,
    build: () =>
      doc("canvas", 1080, 1920, solid("#fdf2f8"), [
        page("Wallpaper", solid("#fdf2f8"), [
          img(asset("checkers"), { x: 0, y: 0, w: 1080, h: 1920, opacity: 0.6 }),
          rect({ x: 240, y: 700, w: 600, h: 420, fill: "#ffffff", opacity: 0.85, r: 24 }),
          txt("soft days,\nsoft focus", { x: 240, y: 780, w: 600, h: 260, size: 84, font: F.script, weight: 700, color: "#9d174d", align: "center", lh: 1.3 }),
          txt("free wallpapers · studio", { x: 0, y: 1800, w: 1080, h: 40, size: 24, font: F.mono, weight: 400, color: "#db2777", align: "center", opacity: 0.7 }),
        ]),
      ]),
  },
  {
    slug: "wallpaper-mountain-calm",
    name: "Highland Calm — Phone Wallpaper",
    category: "photo",
    type: "canvas",
    tags: ["wallpaper", "phone", "nature", "calm"],
    width: 1080,
    height: 1920,
    build: () =>
      doc("canvas", 1080, 1920, gradient("#bae6fd", "#e0f2fe", 170), [
        page("Wallpaper", gradient("#bae6fd", "#e0f2fe", 170), [
          img(asset("sun"), { x: 680, y: 260, w: 240, h: 240 }),
          img(asset("mountain"), { x: -40, y: 1150, w: 1160, h: 770 }),
          txt("breathe in\nthe view", { x: 0, y: 760, w: 1080, h: 300, size: 100, font: F.serif, weight: 700, color: "#0c4a6e", align: "center", lh: 1.3 }),
        ]),
      ]),
  },
  {
    slug: "profile-frame-circle",
    name: "Say Hi — Profile Picture Frame",
    category: "photo",
    type: "canvas",
    tags: ["profile", "avatar", "frame", "social"],
    width: 1080,
    height: 1080,
    build: () =>
      doc("canvas", 1080, 1080, solid("#fef9c3"), [
        page("Profile", solid("#fef9c3"), [
          ellipse({ x: 190, y: 190, w: 700, h: 700, fill: "#fde047" }),
          ellipse({ x: 240, y: 240, w: 600, h: 600, fill: "#fef9c3", stroke: "#a16207", sw: 6 }),
          txt("YOUR\nFACE\nHERE", { x: 240, y: 420, w: 600, h: 240, size: 56, font: F.mono, weight: 700, color: "#a16207", align: "center", lh: 1.3 }),
          txt("say hi, new friend", { x: 0, y: 930, w: 1080, h: 60, size: 40, font: F.hand, weight: 700, color: "#a16207", align: "center" }),
        ]),
      ]),
  },
]

export const DATA_TPLS: TemplateSpec[] = [...deckTpls, ...infographics, ...whiteboards, ...photoTpls]
