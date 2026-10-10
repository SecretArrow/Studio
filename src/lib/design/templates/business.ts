/**
 * Business templates — business cards, letterhead, invoices, reports,
 * LinkedIn assets, diagrams, planning sheets, resumes.
 */
import {
  V,
  asset,
  doc,
  ellipse,
  F,
  gradient,
  page,
  pill,
  rect,
  rule,
  shp,
  solid,
  txt,
  type DesignDoc,
  type DesignElement,
  type TemplateSpec,
} from "../template-builder"

const INK = "#111827"
const A4W = 1240
const A4H = 1754
/* ------------------------------ business cards (family) ------------------------------ */

interface CardStyle {
  slug: string
  name: string
  bg: string
  panel?: { fill: string; rotation: number }
  nameColor: string
  roleColor: string
  metaColor: string
  accent: string
  font: string
  deco: (els: DesignElement[]) => void
}

const CARD_STYLES: CardStyle[] = [
  {
    slug: "business-card-creative-split",
    name: "Creative Split — Business Card",
    bg: "#ffffff",
    panel: { fill: "#f97316", rotation: -8 },
    nameColor: INK,
    roleColor: "#ea580c",
    metaColor: "#78716c",
    accent: "#f97316",
    font: F.pop,
    deco: (els) => els.push(shp("star", { x: 830, y: 430, w: 90, h: 90, fill: "#fde047", rotation: 16 })),
  },
  {
    slug: "business-card-color-block",
    name: "Color Block — Business Card",
    bg: "#0ea5e9",
    nameColor: "#ffffff",
    roleColor: "#e0f2fe",
    metaColor: "#bae6fd",
    accent: "#fde047",
    font: F.cond,
    deco: (els) => {
      els.push(rect({ x: 0, y: 470, w: 1050, h: 130, fill: "#0369a1", r: 0 }))
      els.push(ellipse({ x: 860, y: 90, w: 140, h: 140, fill: "#fde047" }))
    },
  },
  {
    slug: "business-card-mono-elegant",
    name: "Mono Elegant — Business Card",
    bg: "#fafaf9",
    nameColor: "#1c1917",
    roleColor: "#78716c",
    metaColor: "#a8a29e",
    accent: "#1c1917",
    font: F.serif,
    deco: (els) => {
      els.push(rule(80, 140, 890, "#1c1917", 4))
      els.push(rule(80, 460, 890, "#1c1917", 4))
      els.push(shp("diamond", { x: 480, y: 100, w: 46, h: 46, fill: "transparent", stroke: "#1c1917", sw: 3, rotation: 45 }))
    },
  },
  {
    slug: "business-card-minimal-line",
    name: "Minimal Line — Business Card",
    bg: "#ffffff",
    nameColor: INK,
    roleColor: V,
    metaColor: "#9ca3af",
    accent: V,
    font: F.sans,
    deco: (els) => {
      els.push(ellipse({ x: 810, y: 360, w: 150, h: 150, fill: "transparent", stroke: V, sw: 3 }))
      els.push(ellipse({ x: 845, y: 395, w: 80, h: 80, fill: "#ede9fe" }))
    },
  },
  {
    slug: "business-card-photo-circle",
    name: "Photo Circle — Business Card",
    bg: "#0f172a",
    nameColor: "#ffffff",
    roleColor: "#38bdf8",
    metaColor: "#94a3b8",
    accent: "#38bdf8",
    font: F.pop,
    deco: (els) => {
      els.push(ellipse({ x: 760, y: 110, w: 240, h: 240, fill: "#1e293b", stroke: "#38bdf8", sw: 5 }))
      els.push(txt("PHOTO", { x: 760, y: 200, w: 240, h: 60, size: 28, font: F.mono, weight: 700, color: "#64748b", align: "center" }))
    },
  },
]

const cardTpls: TemplateSpec[] = CARD_STYLES.map((s) => ({
  slug: s.slug,
  name: s.name,
  category: "business",
  type: "canvas" as const,
  tags: ["business card", "print", "professional"],
  width: 1050,
  height: 600,
  build: () => {
    const els: DesignElement[] = []
    if (s.panel) els.push(rect({ x: -60, y: -40, w: 420, h: 700, fill: s.panel.fill, rotation: s.panel.rotation }))
    els.push(txt("ALEX MORGAN", { x: 90, y: 150, w: 620, h: 80, size: 52, font: s.font, weight: 700, color: s.nameColor, ls: 2 }))
    els.push(txt("Product Designer", { x: 92, y: 240, w: 520, h: 44, size: 28, weight: 400, color: s.roleColor }))
    els.push(rule(92, 310, 110, s.accent, 6))
    els.push(txt("alex@studio.app · +1 555 0100\nstudio.app", { x: 92, y: 350, w: 560, h: 90, size: 22, font: F.mono, weight: 400, color: s.metaColor, lh: 1.7 }))
    s.deco(els)
    return doc("canvas", 1050, 600, solid(s.bg), [page("Front", solid(s.bg), els)])
  },
}))

/* ------------------------------ paperwork ------------------------------ */

const paperwork: TemplateSpec[] = [
  {
    slug: "letterhead-classic",
    name: "Classic — Letterhead",
    category: "business",
    type: "canvas",
    tags: ["letterhead", "print", "stationery"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Letterhead", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: A4W, h: 220, fill: "#ffffff", r: 0 }),
          rect({ x: 0, y: 214, w: A4W, h: 8, fill: V, r: 4 }),
          ellipse({ x: 90, y: 50, w: 120, h: 120, fill: "#ede9fe" }),
          txt("N", { x: 90, y: 72, w: 120, h: 80, size: 56, font: F.serif, weight: 700, color: V, align: "center" }),
          txt("NOVA CREATIVE STUDIO", { x: 250, y: 80, w: 700, h: 50, size: 36, font: F.pop, weight: 700, color: INK }),
          txt("design · brand · web", { x: 252, y: 138, w: 500, h: 36, size: 22, weight: 400, color: "#6b7280" }),
          txt("May 12, 2026", { x: 880, y: 90, w: 280, h: 40, size: 24, font: F.mono, weight: 400, color: "#9ca3af", align: "right" }),
          txt("Dear partner,", { x: 100, y: 330, w: 900, h: 50, size: 30, font: F.body, weight: 700, color: INK }),
          ...[360, 420, 480, 540].map((y) => rule(100, y, 1040, "#e5e7eb", 2)),
          ...[640, 700, 760].map((y) => rule(100, y, 1040, "#f3f4f6", 2)),
          txt("warm regards,", { x: 100, y: 1180, w: 400, h: 44, size: 28, font: F.body, weight: 400, color: "#374151" }),
          txt("Alex Morgan — Studio Director", { x: 100, y: 1300, w: 600, h: 50, size: 28, font: F.serif, weight: 700, italic: true, color: INK }),
          rect({ x: 0, y: 1654, w: A4W, h: 100, fill: "#f5f3ff", r: 0 }),
          txt("Nova Creative Studio · Jl. Melati 12, Bandung · hello@nova.example · +62 22 555 0100", { x: 0, y: 1688, w: A4W, h: 36, size: 20, font: F.mono, weight: 400, color: "#7c3aed", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "invoice-clean",
    name: "Clean — Invoice",
    category: "business",
    type: "canvas",
    tags: ["invoice", "billing", "finance"],
    width: A4W,
    height: A4H,
    featured: true,
    build: () => {
      const rows: [string, string, string][] = [
        ["Brand identity sprint", "1", "$2,400"],
        ["Landing page design", "2", "$1,600"],
        ["Icon set (24 icons)", "1", "$800"],
      ]
      const items: DesignElement[] = rows.flatMap(([desc, qty, amt], i) => {
        const y = 760 + i * 90
        return [
          rect({ x: 90, y, w: 1060, h: 80, fill: i % 2 ? "#f9fafb" : "#ffffff", r: 0 }),
          txt(desc, { x: 120, y: y + 16, w: 560, h: 50, size: 28, weight: 500, color: INK, vAlign: "middle" }),
          txt(qty, { x: 700, y: y + 16, w: 100, h: 50, size: 28, weight: 400, color: "#6b7280", align: "center", vAlign: "middle" }),
          txt(amt, { x: 900, y: y + 16, w: 220, h: 50, size: 28, weight: 600, color: INK, align: "right", vAlign: "middle" }),
        ] as DesignElement[]
      })
      return doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Invoice", solid("#ffffff"), [
          txt("INVOICE", { x: 90, y: 120, w: 500, h: 100, size: 84, font: F.display, weight: 400, color: INK, ls: 4 }),
          txt("#2026-041", { x: 92, y: 230, w: 300, h: 44, size: 28, font: F.mono, weight: 400, color: V }),
          ellipse({ x: 950, y: 100, w: 200, h: 200, fill: "#ede9fe" }),
          txt("N", { x: 950, y: 140, w: 200, h: 120, size: 90, font: F.serif, weight: 700, color: V, align: "center" }),
          txt("BILLED TO", { x: 90, y: 340, w: 400, h: 40, size: 24, font: F.cond, weight: 600, color: "#9ca3af", ls: 3 }),
          txt("Bright Foods Co.\n88 Orchard Road\nSpringfield", { x: 90, y: 390, w: 500, h: 160, size: 28, weight: 500, color: INK, lh: 1.5 }),
          txt("ISSUED", { x: 800, y: 340, w: 350, h: 40, size: 24, font: F.cond, weight: 600, color: "#9ca3af", ls: 3 }),
          txt("May 12, 2026\nDue: June 11, 2026\nTerms: Net 30", { x: 800, y: 390, w: 350, h: 160, size: 28, weight: 500, color: INK, align: "right", lh: 1.5 }),
          rect({ x: 90, y: 700, w: 1060, h: 60, fill: V, r: 8 }),
          txt("DESCRIPTION", { x: 120, y: 712, w: 500, h: 36, size: 24, font: F.cond, weight: 600, color: "#ffffff", ls: 2 }),
          txt("QTY", { x: 690, y: 712, w: 120, h: 36, size: 24, font: F.cond, weight: 600, color: "#ffffff", align: "center" }),
          txt("AMOUNT", { x: 880, y: 712, w: 240, h: 36, size: 24, font: F.cond, weight: 600, color: "#ffffff", align: "right" }),
          ...items,
          rule(90, 1060, 1060, "#e5e7eb", 3),
          txt("Subtotal", { x: 700, y: 1090, w: 220, h: 44, size: 26, weight: 400, color: "#6b7280", align: "right" }),
          txt("$4,800", { x: 940, y: 1090, w: 180, h: 44, size: 26, weight: 500, color: INK, align: "right" }),
          txt("VAT (11%)", { x: 700, y: 1140, w: 220, h: 44, size: 26, weight: 400, color: "#6b7280", align: "right" }),
          txt("$528", { x: 940, y: 1140, w: 180, h: 44, size: 26, weight: 500, color: INK, align: "right" }),
          rect({ x: 620, y: 1200, w: 530, h: 90, fill: "#ede9fe", r: 12 }),
          txt("TOTAL DUE", { x: 650, y: 1222, w: 240, h: 46, size: 28, font: F.cond, weight: 600, color: V, vAlign: "middle" }),
          txt("$5,328", { x: 900, y: 1214, w: 220, h: 62, size: 40, font: F.pop, weight: 800, color: V, align: "right", vAlign: "middle" }),
          rect({ x: 90, y: 1400, w: 1060, h: 200, fill: "#f9fafb", r: 12 }),
          txt("PAY TO", { x: 120, y: 1430, w: 300, h: 40, size: 22, font: F.cond, weight: 600, color: "#9ca3af", ls: 3 }),
          txt("Bank Nova — 8002 1104 5566 · SWIFT NOVABDJA\nor pay by card: nova.example/pay/2026-041", { x: 120, y: 1480, w: 980, h: 90, size: 26, font: F.mono, weight: 400, color: "#374151", lh: 1.7 }),
          txt("thank you for your business!", { x: 90, y: 1660, w: 1060, h: 44, size: 26, font: F.hand, weight: 400, color: "#9ca3af", align: "center" }),
        ]),
      ])
    },
  },
  {
    slug: "quote-estimate",
    name: "Project Estimate — One-pager",
    category: "business",
    type: "canvas",
    tags: ["quote", "estimate", "proposal", "freelance"],
    width: A4W,
    height: A4H,
    build: () => {
      const rows: [string, string][] = [
        ["Discovery workshop (2 h)", "$300"],
        ["Moodboards & direction", "$450"],
        ["Key page design ×3", "$1,350"],
        ["Handoff & assets", "$200"],
      ]
      return doc("canvas", A4W, A4H, solid("#fffbeb"), [
        page("Estimate", solid("#fffbeb"), [
          rect({ x: 0, y: 0, w: A4W, h: 300, fill: "#b45309", r: 0 }),
          txt("PROJECT ESTIMATE", { x: 90, y: 90, w: 800, h: 80, size: 60, font: F.cond, weight: 600, color: "#fffbeb", ls: 3 }),
          txt("for Bright Foods Co. · from Alex Morgan Studio · valid 30 days", { x: 92, y: 190, w: 900, h: 44, size: 26, font: F.mono, weight: 400, color: "#fde68a" }),
          ...rows.flatMap(([d, p], i) => {
            const y = 400 + i * 110
            return [
              txt(d, { x: 90, y, w: 700, h: 60, size: 32, weight: 500, color: "#78350f", vAlign: "middle" }),
              txt(p, { x: 830, y, w: 320, h: 60, size: 32, font: F.mono, weight: 700, color: "#b45309", align: "right", vAlign: "middle" }),
              rule(90, y + 70, 1060, "#fde68a", 3),
            ] as DesignElement[]
          }),
          rect({ x: 620, y: 890, w: 530, h: 110, fill: "#78350f", r: 14 }),
          txt("ESTIMATED TOTAL", { x: 660, y: 910, w: 300, h: 40, size: 24, font: F.cond, weight: 600, color: "#fde68a" }),
          txt("$2,300", { x: 900, y: 900, w: 220, h: 70, size: 46, font: F.pop, weight: 800, color: "#fffbeb", align: "right" }),
          txt("WHAT'S INCLUDED", { x: 90, y: 1080, w: 500, h: 50, size: 30, font: F.cond, weight: 600, color: "#b45309", ls: 3 }),
          txt("→ weekly check-in calls\n→ two revision rounds per deliverable\n→ editable source files + export pack\n→ 30 days of post-launch support", { x: 92, y: 1150, w: 900, h: 240, size: 28, weight: 400, color: "#92400e", lh: 1.7 }),
          txt("not included: stock licenses, copywriting, development", { x: 90, y: 1430, w: 900, h: 44, size: 24, font: F.mono, weight: 400, color: "#d6d3d1" }),
          ...pill("APPROVE → alex@studio.example", { x: 240, y: 1540, w: 760, h: 90, fill: "#b45309", size: 28, color: "#fffbeb" }),
        ]),
      ])
    },
  },
  {
    slug: "receipt-minimal",
    name: "Keep This — Receipt",
    category: "business",
    type: "canvas",
    tags: ["receipt", "purchase", "print"],
    width: 800,
    height: 1200,
    build: () => {
      const rows: [string, string][] = [
        ["Flat white", "3.80"],
        ["Banana bread", "3.80"],
        ["Filter beans 250g", "12.00"],
      ]
      return doc("canvas", 800, 1200, solid("#ffffff"), [
        page("Receipt", solid("#ffffff"), [
          txt("SUNRISE CAFÉ", { x: 0, y: 100, w: 800, h: 70, size: 48, font: F.mono, weight: 700, color: INK, align: "center", ls: 4 }),
          txt("12 riverside walk · VAT 876.543.210", { x: 0, y: 180, w: 800, h: 40, size: 20, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
          txt("--------------------------------", { x: 0, y: 260, w: 800, h: 40, size: 24, font: F.mono, weight: 400, color: "#d1d5db", align: "center" }),
          ...rows.flatMap(([n, p], i) => {
            const y = 320 + i * 70
            return [
              txt(n, { x: 90, y, w: 440, h: 50, size: 26, font: F.mono, weight: 400, color: "#374151", vAlign: "middle" }),
              txt(p, { x: 560, y, w: 150, h: 50, size: 26, font: F.mono, weight: 400, color: "#374151", align: "right", vAlign: "middle" }),
            ] as DesignElement[]
          }),
          txt("--------------------------------", { x: 0, y: 540, w: 800, h: 40, size: 24, font: F.mono, weight: 400, color: "#d1d5db", align: "center" }),
          txt("TOTAL", { x: 90, y: 600, w: 300, h: 60, size: 34, font: F.mono, weight: 700, color: INK, vAlign: "middle" }),
          txt("$19.60", { x: 460, y: 600, w: 250, h: 60, size: 34, font: F.mono, weight: 700, color: INK, align: "right", vAlign: "middle" }),
          txt("card ···· 4021", { x: 90, y: 690, w: 400, h: 44, size: 22, font: F.mono, weight: 400, color: "#9ca3af" }),
          txt("may 12 · 08:14 · register 2", { x: 90, y: 740, w: 500, h: 44, size: 22, font: F.mono, weight: 400, color: "#9ca3af" }),
          rect({ x: 290, y: 850, w: 220, h: 220, fill: "#ffffff", stroke: INK, sw: 3, r: 0 }),
          ...Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: 6 }, (_, c) =>
              rect({ x: 300 + c * 34, y: 860 + r * 34, w: 28, h: 28, fill: (r * 7 + c * 5 + 3) % 3 ? INK : "#ffffff", r: 0 }),
            ),
          ).flat(),
          txt("scan for your loyalty points", { x: 0, y: 1110, w: 800, h: 40, size: 22, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
        ]),
      ])
    },
  },
  {
    slug: "meeting-agenda",
    name: "Weekly Sync — Meeting Agenda",
    category: "business",
    type: "canvas",
    tags: ["agenda", "meeting", "team"],
    width: A4W,
    height: A4H,
    build: () => {
      const rows: [string, string, string][] = [
        ["09:00", "Wins since last week", "5 min"],
        ["09:05", "Metrics review — dashboard", "10 min"],
        ["09:15", "Blockers & unblocks", "15 min"],
        ["09:30", "Q3 planning homework", "20 min"],
        ["09:50", "Actions & owners", "10 min"],
      ]
      return doc("canvas", A4W, A4H, solid("#f8fafc"), [
        page("Agenda", solid("#f8fafc"), [
          rect({ x: 90, y: 100, w: 1060, h: 220, fill: "#0f172a", r: 24 }),
          txt("WEEKLY SYNC", { x: 130, y: 140, w: 700, h: 90, size: 64, font: F.display, weight: 400, color: "#ffffff", ls: 3 }),
          txt("mondays · 09:00 · 30 min · studio room + zoom", { x: 132, y: 240, w: 800, h: 44, size: 26, font: F.mono, weight: 400, color: "#94a3b8" }),
          txt("BEFORE WE MEET", { x: 90, y: 380, w: 500, h: 44, size: 26, font: F.cond, weight: 600, color: "#0891b2", ls: 3 }),
          txt("☐ read the metrics doc\n☐ add your blockers to the board\n☐ nominate one win (big or tiny)", { x: 92, y: 440, w: 900, h: 180, size: 28, weight: 400, color: "#334155", lh: 1.8 }),
          ...rows.flatMap(([time, topic, dur], i) => {
            const y = 680 + i * 150
            return [
              rect({ x: 90, y, w: 1060, h: 120, fill: "#ffffff", stroke: "#e2e8f0", sw: 2, r: 16 }),
              rect({ x: 110, y: y + 20, w: 160, h: 80, fill: "#ecfeff", r: 12 }),
              txt(time, { x: 110, y: y + 22, w: 160, h: 76, size: 30, font: F.mono, weight: 700, color: "#0e7490", align: "center", vAlign: "middle" }),
              txt(topic, { x: 300, y: y + 18, w: 640, h: 52, size: 30, weight: 600, color: INK, vAlign: "middle" }),
              txt(dur, { x: 960, y: y + 30, w: 160, h: 60, size: 26, font: F.mono, weight: 400, color: "#0e7490", align: "right", vAlign: "middle" }),
            ] as DesignElement[]
          }),
          txt("actions owner: rotate weekly — it's your turn, Sam", { x: 90, y: 1500, w: 1000, h: 50, size: 26, font: F.hand, weight: 400, color: "#64748b" }),
        ]),
      ])
    },
  },
]

/* ------------------------------ LinkedIn & diagrams ------------------------------ */

const linkedin: TemplateSpec[] = [
  {
    slug: "linkedin-banner-statement",
    name: "Bold Statement — LinkedIn Banner",
    category: "business",
    type: "canvas",
    tags: ["linkedin", "banner", "statement"],
    width: 1584,
    height: 396,
    build: () =>
      doc("canvas", 1584, 396, solid("#0a66c2"), [
        page("Banner", solid("#0a66c2"), [
          ellipse({ x: 1300, y: -120, w: 400, h: 400, fill: "#004182", opacity: 0.9 }),
          txt("I help small brands look\nlike big ones.", { x: 90, y: 80, w: 1000, h: 240, size: 64, font: F.serif, weight: 700, color: "#ffffff", lh: 1.3 }),
          txt("brand design · packaging · web — 12 yrs", { x: 94, y: 330, w: 800, h: 40, size: 26, font: F.mono, weight: 400, color: "#bfdcff" }),
        ]),
      ]),
  },
  {
    slug: "linkedin-banner-hiring",
    name: "We're Hiring — LinkedIn Banner",
    category: "business",
    type: "canvas",
    tags: ["linkedin", "banner", "hiring"],
    width: 1584,
    height: 396,
    build: () =>
      doc("canvas", 1584, 396, solid("#052e16"), [
        page("Banner", solid("#052e16"), [
          rect({ x: 1080, y: 60, w: 380, h: 100, fill: "#a3e635", r: 50 }),
          txt("WE'RE HIRING", { x: 1080, y: 62, w: 380, h: 96, size: 36, font: F.display, weight: 400, color: "#052e16", align: "center", vAlign: "middle", ls: 4 }),
          txt("3 open roles · remote-first\neng, design, support", { x: 90, y: 100, w: 900, h: 200, size: 54, font: F.pop, weight: 700, color: "#f0fdf4", lh: 1.35 }),
        ]),
      ]),
  },
  {
    slug: "org-chart",
    name: "Who Does What — Org Chart",
    category: "business",
    type: "whiteboard",
    tags: ["org chart", "team", "diagram", "structure"],
    width: 2400,
    height: 1600,
    build: () => {
      const box = (x: number, y: number, w: number, title: string, sub: string, fill: string, ink: string): DesignElement[] => [
        rect({ x, y, w, h: 190, fill, r: 20 }),
        txt(title, { x, y: y + 40, w, h: 60, size: 34, weight: 700, color: ink, align: "center" }),
        txt(sub, { x, y: y + 105, w, h: 44, size: 24, weight: 400, color: ink, align: "center", opacity: 0.75 }),
      ]
      const els: DesignElement[] = [
        txt("Who does what — Studio org, mid-2026", { x: 100, y: 80, w: 1200, h: 70, size: 52, font: F.cond, weight: 600, color: "#1f2937" }),
        ...box(960, 240, 480, "Alex — Director", "strategy & clients", "#7c3aed", "#ffffff"),
        rect({ x: 1198, y: 430, w: 4, h: 640, fill: "#d1d5db", r: 0 }),
        rect({ x: 520, y: 560, w: 1360, h: 4, fill: "#d1d5db", r: 0 }),
        rect({ x: 520, y: 560, w: 4, h: 90, fill: "#d1d5db", r: 0 }),
        rect({ x: 1198, y: 650, w: 4, h: 0.01, fill: "#d1d5db", r: 0 }),
        rect({ x: 1878, y: 560, w: 4, h: 90, fill: "#d1d5db", r: 0 }),
        ...box(280, 650, 480, "Maya — Design Lead", "illustration & brand", "#ede9fe", "#4c1d95"),
        ...box(960, 650, 480, "Sam — Product Lead", "web & editor", "#ede9fe", "#4c1d95"),
        ...box(1640, 650, 480, "Rina — Ops Lead", "finance & support", "#ede9fe", "#4c1d95"),
        ...box(340, 920, 360, "Junia", "illustrator", "#f9fafb", "#374151"),
        ...box(760, 920, 360, "Bimo", "brand designer", "#f9fafb", "#374151"),
        ...box(1020, 920, 360, "Dewi", "product designer", "#f9fafb", "#374151"),
        ...box(1700, 920, 360, "Tono", "support", "#f9fafb", "#374151"),
        txt("dotted lines = project squads — re-shuffled quarterly", { x: 100, y: 1480, w: 1200, h: 50, size: 30, font: F.hand, weight: 400, color: "#6b7280" }),
      ]
      return doc("whiteboard", 2400, 1600, solid("#f8fafc"), [page("Org chart", solid("#f8fafc"), els)])
    },
  },
  {
    slug: "process-flow-canva",
    name: "How We Work — Process Flow",
    category: "business",
    type: "canvas",
    tags: ["process", "flow", "workflow", "diagram"],
    width: 2400,
    height: 1200,
    build: () => {
      const steps: [string, string][] = [
        ["BRIEF", "goals & scope"],
        ["DRAFT", "2 directions"],
        ["REFINE", "2 rounds"],
        ["SHIP", "files + guide"],
      ]
      const els: DesignElement[] = [txt("How we work — every project, same honest path", { x: 100, y: 120, w: 1600, h: 80, size: 56, font: F.cond, weight: 600, color: "#0f172a" })]
      steps.forEach(([t, d], i) => {
        const x = 160 + i * 560
        els.push(rect({ x, y: 420, w: 400, h: 300, fill: i % 2 ? "#0ea5e9" : "#0f172a", r: 28 }))
        els.push(txt(String(i + 1), { x: x + 30, y: 440, w: 120, h: 100, size: 64, font: F.display, weight: 400, color: "#fde047" }))
        els.push(txt(t, { x, y: 540, w: 400, h: 70, size: 44, font: F.cond, weight: 600, color: "#ffffff", align: "center", ls: 4 }))
        els.push(txt(d, { x, y: 615, w: 400, h: 44, size: 26, weight: 400, color: "#e0f2fe", align: "center" }))
        if (i < 3) els.push(shp("arrow", { x: x + 420, y: 540, w: 120, h: 70, fill: "#94a3b8", rotation: 90 }))
      })
      els.push(txt("average timeline: 3–4 weeks · fixed price, no surprises", { x: 160, y: 860, w: 1600, h: 50, size: 32, font: F.hand, weight: 400, color: "#475569" }))
      return doc("canvas", 2400, 1200, solid("#f8fafc"), [page("Process", solid("#f8fafc"), els)])
    },
  },
  {
    slug: "swot-sheet",
    name: "SWOT — Strategy Sheet",
    category: "business",
    type: "canvas",
    tags: ["swot", "strategy", "analysis", "planning"],
    width: A4H,
    height: A4W,
    build: () => {
      const quad = (x: number, y: number, title: string, sub: string, fill: string, ink: string): DesignElement[] => [
        rect({ x, y, w: 780, h: 500, fill, r: 24 }),
        txt(title, { x: x + 50, y: y + 40, w: 500, h: 70, size: 48, font: F.display, weight: 400, color: ink, ls: 6 }),
        txt(sub, { x: x + 52, y: y + 120, w: 680, h: 44, size: 24, font: F.mono, weight: 400, color: ink, opacity: 0.7 }),
        rule(x + 52, y + 440, 676, ink, 2),
      ]
      return doc("canvas", A4H, A4W, solid("#ffffff"), [
        page("SWOT", solid("#ffffff"), [
          txt("SWOT ANALYSIS", { x: 60, y: 60, w: 900, h: 90, size: 70, font: F.display, weight: 400, color: INK, ls: 4 }),
          txt("subject: studio q3 · filled by: leadership · date: ____________", { x: 62, y: 160, w: 1200, h: 40, size: 24, font: F.mono, weight: 400, color: "#9ca3af" }),
          ...quad(60, 240, "STRENGTHS", "internal · helpful", "#ecfdf5", "#065f46"),
          ...quad(890, 240, "WEAKNESSES", "internal · harmful", "#fff1f2", "#9f1239"),
          ...quad(60, 790, "OPPORTUNITIES", "external · helpful", "#eff6ff", "#1e40af"),
          ...quad(890, 790, "THREATS", "external · harmful", "#fffbeb", "#92400e"),
          txt("rule of thumb: pair every threat with a strength", { x: 60, y: 1330, w: 1400, h: 50, size: 28, font: F.hand, weight: 400, color: "#6b7280" }),
        ]),
      ])
    },
  },
  {
    slug: "okr-sheet",
    name: "Quarterly OKRs — Planning Sheet",
    category: "business",
    type: "canvas",
    tags: ["okr", "goals", "planning", "quarter"],
    width: A4W,
    height: A4H,
    build: () => {
      const okr = (n: string, obj: string, krs: string[], y: number): DesignElement[] => [
        rect({ x: 90, y, w: 1060, h: 340, fill: "#ffffff", stroke: "#e5e7eb", sw: 3, r: 20 }),
        ellipse({ x: 120, y: y + 30, w: 90, h: 90, fill: V }),
        txt(n, { x: 120, y: y + 34, w: 90, h: 84, size: 38, font: F.display, weight: 400, color: "#ffffff", align: "center", vAlign: "middle" }),
        txt(obj, { x: 240, y: y + 40, w: 860, h: 70, size: 36, font: F.pop, weight: 700, color: INK, vAlign: "middle" }),
        ...krs.map((k, i) =>
          txt(`KR${i + 1}  ${k}`, { x: 240, y: y + 140 + i * 62, w: 860, h: 52, size: 26, weight: 400, color: "#374151", vAlign: "middle" }),
        ),
      ]
      return doc("canvas", A4W, A4H, solid("#f5f3ff"), [
        page("OKRs", solid("#f5f3ff"), [
          txt("Q3 2026 OKRs", { x: 90, y: 100, w: 800, h: 110, size: 84, font: F.display, weight: 400, color: "#4c1d95" }),
          txt("team: product · owner: sam · review: oct 2", { x: 92, y: 220, w: 800, h: 44, size: 26, font: F.mono, weight: 400, color: "#7c3aed" }),
          ...okr("O1", "Make the editor feel instant", ["P95 interaction < 80 ms", "Zero dropped frames while dragging", "Crash-free sessions ≥ 99.9%"], 320),
          ...okr("O2", "Grow free usage sustainably", ["WAU/MAU ≥ 45%", "Template→project conversion ≥ 60%", "Export success ≥ 99.5%"], 730),
          ...okr("O3", "Keep it free, keep the lights on", ["Infra cost per user −20%", "2 sober, sponsor-free funding pilots", "Support first-reply < 4 h"], 1140),
          txt("scoring: 0.0–1.0 each KR · commit, don't sandbag", { x: 90, y: 1540, w: 1060, h: 50, size: 26, font: F.hand, weight: 400, color: "#6d28d9" }),
        ]),
      ])
    },
  },
]

/* ------------------------------ resumes (family) ------------------------------ */

interface ResumeSpec {
  slug: string
  name: string
  tags: string[]
  featured?: boolean
  build: () => DesignDoc
}

const RESUME_SPECS: ResumeSpec[] = [
  {
    slug: "resume-two-column-modern",
    name: "Two-Column Modern — Resume",
    tags: ["resume", "cv", "modern"],
    featured: true,
    build: () =>
      doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Resume", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: 460, h: A4H, fill: "#0f172a", r: 0 }),
          ellipse({ x: 130, y: 120, w: 200, h: 200, fill: "#1e293b", stroke: "#38bdf8", sw: 4 }),
          txt("AM", { x: 130, y: 160, w: 200, h: 120, size: 64, font: F.display, weight: 400, color: "#38bdf8", align: "center" }),
          txt("Alex Morgan", { x: 60, y: 370, w: 340, h: 100, size: 48, font: F.pop, weight: 700, color: "#ffffff" }),
          txt("PRODUCT DESIGNER", { x: 62, y: 470, w: 340, h: 40, size: 22, font: F.mono, weight: 400, color: "#38bdf8", ls: 4 }),
          ...[
            ["CONTACT", "alex@studio.app\n+1 555 0100\nLisbon, PT (UTC+0)"],
            ["LINKS", "studio.app/alex\ngithub.com/alexm"],
            ["TOOLS", "Figma · After Effects\nHTML/CSS · Notion"],
          ].flatMap(([h, b], i) => {
            const y = 580 + i * 300
            return [
              txt(h, { x: 62, y, w: 340, h: 40, size: 24, font: F.cond, weight: 600, color: "#7dd3fc", ls: 4 }),
              txt(b, { x: 62, y: y + 50, w: 350, h: 200, size: 24, weight: 400, color: "#cbd5e1", lh: 1.7 }),
            ] as DesignElement[]
          }),
          txt("PROFILE", { x: 540, y: 120, w: 640, h: 46, size: 32, font: F.cond, weight: 600, color: "#0f172a", ls: 4 }),
          rule(542, 175, 90, "#38bdf8", 6),
          txt("Product designer with 8 years across fintech and tools. I turn messy workflows into calm interfaces — and ship.", { x: 540, y: 205, w: 620, h: 150, size: 26, weight: 400, color: "#334155", lh: 1.65 }),
          txt("EXPERIENCE", { x: 540, y: 400, w: 640, h: 46, size: 32, font: F.cond, weight: 600, color: "#0f172a", ls: 4 }),
          rule(542, 455, 90, "#38bdf8", 6),
          txt("2022–now   Lead Product Designer — Nova Labs\n                Design system used by 40+ engineers; onboarding\n                rewrite lifted activation 18%.\n\n2019–22     Product Designer — Bright\n                Shipped 12 core features; first hire on mobile.", { x: 540, y: 490, w: 640, h: 330, size: 25, weight: 400, color: "#334155", lh: 1.6 }),
          txt("EDUCATION", { x: 540, y: 870, w: 640, h: 46, size: 32, font: F.cond, weight: 600, color: "#0f172a", ls: 4 }),
          rule(542, 925, 90, "#38bdf8", 6),
          txt("BA Interaction Design — Porto Univ. (2019)\nDesign Systems Certificate — IxDF (2022)", { x: 540, y: 960, w: 640, h: 120, size: 25, weight: 400, color: "#334155", lh: 1.6 }),
          txt("SPEAKING & WRITING", { x: 540, y: 1130, w: 640, h: 46, size: 32, font: F.cond, weight: 600, color: "#0f172a", ls: 4 }),
          rule(542, 1185, 90, "#38bdf8", 6),
          txt("Config Community Track (2025) · 14 essays on\ndesignops at studio.app/journal", { x: 540, y: 1220, w: 640, h: 120, size: 25, weight: 400, color: "#334155", lh: 1.6 }),
        ]),
      ]),
  },
  {
    slug: "resume-serif-executive",
    name: "Serif Executive — Resume",
    tags: ["resume", "cv", "executive", "serif"],
    build: () =>
      doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Resume", solid("#ffffff"), [
          txt("ALEX MORGAN", { x: 0, y: 110, w: A4W, h: 100, size: 76, font: F.serif, weight: 700, color: INK, align: "center", ls: 6 }),
          txt("Product Design Executive", { x: 0, y: 220, w: A4W, h: 50, size: 30, font: F.serif, weight: 400, italic: true, color: "#6b7280", align: "center" }),
          rule(320, 300, 600, "#b45309", 3),
          txt("alex@studio.app · +1 555 0100 · Lisbon · studio.app/alex", { x: 0, y: 330, w: A4W, h: 40, size: 22, font: F.mono, weight: 400, color: "#6b7280", align: "center" }),
          ...[
            ["EXECUTIVE SUMMARY", "Design leader (8 yrs, 4 yrs managing) building calm, revenue-aware product design teams. Shipped three 0→1 products; last design system cut build time 30%."],
            ["SELECTED IMPACT", "Nova Labs — led 6-person design org through Series B; activation +18%.\nBright — first design hire; 12 core features; mobile app 4.8★.\nFreelance — 40+ engagements for fintech & health startups."],
            ["LEADERSHIP APPROACH", "Small teams, clear writing, prototypes over debates. Hiring bar: kindness first, craft always."],
            ["EDUCATION", "BA Interaction Design — Porto University · IxDF Design Systems Certificate"],
          ].flatMap(([h, b], i) => {
            const y = 430 + i * 300
            return [
              txt(h, { x: 110, y, w: 1020, h: 44, size: 27, font: F.serif, weight: 700, color: "#b45309", ls: 3 }),
              rule(110, y + 56, 1020, "#e5e7eb", 2),
              txt(b, { x: 110, y: y + 76, w: 1020, h: 200, size: 25, font: F.body, weight: 400, color: "#374151", lh: 1.65 }),
            ] as DesignElement[]
          }),
        ]),
      ]),
  },
  {
    slug: "resume-timeline",
    name: "Timeline Track — Resume",
    tags: ["resume", "cv", "timeline", "creative"],
    build: () =>
      doc("canvas", A4W, A4H, solid("#fff7ed"), [
        page("Resume", solid("#fff7ed"), [
          rect({ x: 0, y: 0, w: A4W, h: 280, fill: "#c2410c", r: 0 }),
          txt("Maya Lindholm", { x: 90, y: 70, w: 800, h: 100, size: 64, font: F.serif, weight: 700, color: "#fff7ed" }),
          txt("Illustrator & Visual Storyteller", { x: 92, y: 180, w: 700, h: 50, size: 30, weight: 400, color: "#fed7aa" }),
          rect({ x: 150, y: 380, w: 8, h: 1150, fill: "#ea580c", r: 0 }),
          ...[
            ["2022 — NOW", "Lead Illustrator, Papermoon Press", "6 picture books · 2 awards · mentoring 3 juniors"],
            ["2019 — 22", "Freelance Illustrator", "60+ editorial commissions · NatGeo Junior, Kite"],
            ["2017 — 19", "Junior Designer, Kite Agency", "brand illustration for 20+ campaigns"],
          ].flatMap(([years, role, sub], i) => {
            const y = 400 + i * 300
            return [
              ellipse({ x: 120, y, w: 60, h: 60, fill: i === 0 ? "#c2410c" : "#fdba74" }),
              txt(years, { x: 220, y: y - 6, w: 400, h: 40, size: 26, font: F.mono, weight: 700, color: "#c2410c", ls: 2 }),
              txt(role, { x: 220, y: y + 40, w: 800, h: 56, size: 34, font: F.serif, weight: 700, color: "#431407" }),
              txt(sub, { x: 222, y: y + 104, w: 820, h: 100, size: 26, weight: 400, color: "#7c2d12", lh: 1.6 }),
            ] as DesignElement[]
          }),
          txt("SKILLS", { x: 150, y: 1340, w: 400, h: 46, size: 28, font: F.cond, weight: 600, color: "#c2410c", ls: 4 }),
          txt("Editorial illustration · Watercolor & digital · Book layout · Art direction · Procreate, Photoshop", { x: 150, y: 1400, w: 940, h: 100, size: 26, weight: 400, color: "#7c2d12", lh: 1.6 }),
          txt("maya@inkforest.example · @mayadraws · inkforest.example", { x: 150, y: 1600, w: 940, h: 44, size: 24, font: F.mono, weight: 400, color: "#ea580c" }),
        ]),
      ]),
  },
  {
    slug: "resume-student-entry",
    name: "First Job — Student Resume",
    tags: ["resume", "cv", "student", "entry level"],
    build: () =>
      doc("canvas", A4W, A4H, solid("#f0fdf4"), [
        page("Resume", solid("#f0fdf4"), [
          rect({ x: 0, y: 0, w: A4W, h: 240, fill: "#166534", r: 0 }),
          txt("Bimo Santoso", { x: 90, y: 60, w: 700, h: 90, size: 56, font: F.pop, weight: 700, color: "#ffffff" }),
          txt("design student · class of 2026 — seeking internship", { x: 92, y: 155, w: 800, h: 44, size: 26, weight: 400, color: "#bbf7d0" }),
          ...[
            ["PROJECTS", "Kampus Kita — campus event app case study (usability tested with 12 students)\nStudio templates — 20+ social templates published, 4k downloads\nThrift pack — brand identity for student thrift shop"],
            ["EXPERIENCE", "Design intern — Kite Agency (summers 2024–25)\nVolunteer designer — Student Charity Run 2025 (posters, merch)"],
            ["SKILLS", "Figma · Canva-class tools · basic HTML/CSS · photography · public speaking"],
            ["CONTACT", "bimo@campus.example · +62 812 555 0188 · portfolio: bimo.design"],
          ].flatMap(([h, b], i) => {
            const y = 320 + i * 320
            return [
              txt(h, { x: 90, y, w: 500, h: 46, size: 30, font: F.cond, weight: 600, color: "#166534", ls: 4 }),
              rule(92, y + 58, 80, "#4ade80", 6),
              txt(b, { x: 90, y: y + 84, w: 1060, h: 220, size: 26, weight: 400, color: "#14532d", lh: 1.7 }),
            ] as DesignElement[]
          }),
        ]),
      ]),
  },
  {
    slug: "resume-skill-bars",
    name: "Skills First — Resume",
    tags: ["resume", "cv", "skills", "colorful"],
    build: () => {
      const bar = (label: string, pct: number, y: number): DesignElement[] => [
        txt(label, { x: 720, y, w: 420, h: 40, size: 25, weight: 600, color: "#1e1b4b" }),
        rect({ x: 720, y: y + 46, w: 420, h: 16, fill: "#e0e7ff", r: 8 }),
        rect({ x: 720, y: y + 46, w: Math.round(420 * pct), h: 16, fill: "#4f46e5", r: 8 }),
      ]
      return doc("canvas", A4W, A4H, solid("#eef2ff"), [
        page("Resume", solid("#eef2ff"), [
          rect({ x: 70, y: 70, w: 1100, h: 1614, fill: "#ffffff", stroke: "#c7d2fe", sw: 3, r: 20 }),
          txt("Alex Morgan", { x: 110, y: 130, w: 700, h: 90, size: 58, font: F.pop, weight: 800, color: "#1e1b4b" }),
          txt("UX & UI Designer — 8 yrs — Lisbon / remote", { x: 112, y: 230, w: 700, h: 46, size: 26, weight: 500, color: "#4f46e5" }),
          txt("SUMMARY", { x: 110, y: 330, w: 500, h: 44, size: 28, font: F.cond, weight: 600, color: "#4f46e5", ls: 4 }),
          txt("I design tools people don't have to think about. Recently: editor performance, onboarding, design systems.", { x: 110, y: 390, w: 540, h: 200, size: 26, weight: 400, color: "#312e81", lh: 1.7 }),
          txt("EXPERIENCE", { x: 110, y: 640, w: 500, h: 44, size: 28, font: F.cond, weight: 600, color: "#4f46e5", ls: 4 }),
          txt("2022–now  Lead Designer — Nova Labs\n                 design org of 6 · activation +18%\n2019–22    Product Designer — Bright\n                 12 features shipped · first design hire", { x: 110, y: 700, w: 560, h: 300, size: 26, weight: 400, color: "#312e81", lh: 1.7 }),
          ...bar("Product & UX design", 0.95, 360),
          ...bar("Design systems", 0.9, 490),
          ...bar("Prototyping", 0.8, 620),
          ...bar("Motion basics", 0.65, 750),
          ...bar("Front-end (HTML/CSS)", 0.6, 880),
          txt("ALSO", { x: 720, y: 1010, w: 300, h: 44, size: 28, font: F.cond, weight: 600, color: "#4f46e5", ls: 4 }),
          txt("mentor 4 juniors · write weekly\ndesign notes · poor but eager guitar", { x: 720, y: 1070, w: 420, h: 140, size: 24, weight: 400, color: "#312e81", lh: 1.7 }),
          txt("alex@studio.app · studio.app/alex · +1 555 0100", { x: 110, y: 1580, w: 1000, h: 44, size: 24, font: F.mono, weight: 400, color: "#4f46e5" }),
        ]),
      ])
    },
  },
  {
    slug: "cover-letter-classic",
    name: "Matching Cover Letter",
    tags: ["cover letter", "job application"],
    build: () =>
      doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Cover letter", solid("#ffffff"), [
          rect({ x: 90, y: 90, w: 1060, h: 200, fill: "#0f172a", r: 16 }),
          txt("ALEX MORGAN", { x: 130, y: 130, w: 600, h: 60, size: 44, font: F.pop, weight: 700, color: "#ffffff" }),
          txt("cover letter · product designer application", { x: 132, y: 200, w: 800, h: 40, size: 24, font: F.mono, weight: 400, color: "#94a3b8" }),
          txt("May 12, 2026", { x: 90, y: 340, w: 400, h: 44, size: 26, font: F.mono, weight: 400, color: "#9ca3af" }),
          txt("Dear Hiring Team,", { x: 90, y: 430, w: 600, h: 50, size: 30, font: F.body, weight: 700, color: INK }),
          ...[510, 570, 630, 690, 750, 810].map((y) => rule(90, y, 1060, "#f3f4f6", 2)),
          txt("I'm applying for the Senior Product Designer role. Three reasons: your\nproduct made me switch careers, your job post mentions craft AND kindness,\nand I've spent eight years doing exactly this work.", { x: 90, y: 900, w: 1060, h: 200, size: 26, font: F.body, weight: 400, color: "#374151", lh: 1.7 }),
          ...[1150, 1210, 1270].map((y) => rule(90, y, 1060, "#f3f4f6", 2)),
          txt("Warmly,", { x: 90, y: 1360, w: 300, h: 44, size: 26, font: F.body, weight: 400, color: "#374151" }),
          txt("Alex Morgan", { x: 90, y: 1480, w: 400, h: 56, size: 34, font: F.serif, weight: 700, italic: true, color: INK }),
          txt("alex@studio.app · studio.app/alex · +1 555 0100", { x: 90, y: 1600, w: 800, h: 40, size: 22, font: F.mono, weight: 400, color: "#9ca3af" }),
        ]),
      ]),
  },
  {
    slug: "resume-minimal-ats",
    name: "ATS-Safe Minimal — Resume",
    tags: ["resume", "cv", "ats", "minimal", "simple"],
    build: () =>
      doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Resume", solid("#ffffff"), [
          txt("ALEX MORGAN", { x: 90, y: 90, w: 800, h: 70, size: 54, font: F.sans, weight: 800, color: INK }),
          txt("Product Designer — 8 years — Lisbon, PT", { x: 90, y: 170, w: 800, h: 44, size: 26, weight: 500, color: "#374151" }),
          txt("alex@studio.app · +1 555 0100 · studio.app/alex · linkedin.com/in/alexm", { x: 90, y: 222, w: 1060, h: 40, size: 22, font: F.mono, weight: 400, color: "#6b7280" }),
          rule(90, 300, 1060, "#111827", 3),
          txt("PROFESSIONAL EXPERIENCE", { x: 90, y: 330, w: 800, h: 44, size: 27, weight: 700, color: INK, ls: 2 }),
          txt("Lead Product Designer — Nova Labs — 2022 to present", { x: 90, y: 396, w: 1060, h: 46, size: 26, weight: 700, color: "#1f2937" }),
          txt("• Lead a design org of 6 across web and mobile.\n• Rebuilt onboarding with engineering; activation improved 18%.\n• Own the design system adopted by 40+ engineers.", { x: 90, y: 448, w: 1060, h: 180, size: 25, weight: 400, color: "#374151", lh: 1.65 }),
          txt("Product Designer — Bright — 2019 to 2022", { x: 90, y: 660, w: 1060, h: 46, size: 26, weight: 700, color: "#1f2937" }),
          txt("• First design hire; shipped 12 core features.\n• Set the research practice; ran 60+ interviews.", { x: 90, y: 712, w: 1060, h: 120, size: 25, weight: 400, color: "#374151", lh: 1.65 }),
          rule(90, 870, 1060, "#111827", 3),
          txt("EDUCATION", { x: 90, y: 900, w: 800, h: 44, size: 27, weight: 700, color: INK, ls: 2 }),
          txt("BA Interaction Design — Porto University — 2019\nDesign Systems Certificate — IxDF — 2022", { x: 90, y: 952, w: 1060, h: 120, size: 25, weight: 400, color: "#374151", lh: 1.65 }),
          rule(90, 1110, 1060, "#111827", 3),
          txt("SKILLS", { x: 90, y: 1140, w: 800, h: 44, size: 27, weight: 700, color: INK, ls: 2 }),
          txt("Product design · UX research · Design systems · Prototyping · HTML/CSS\nTools: Figma, After Effects, Notion", { x: 90, y: 1192, w: 1060, h: 130, size: 25, weight: 400, color: "#374151", lh: 1.65 }),
        ]),
      ]),
  },
]

const resumeTpls: TemplateSpec[] = RESUME_SPECS.map((r) => ({
  slug: r.slug,
  name: r.name,
  category: "resume",
  type: "canvas" as const,
  tags: r.tags,
  width: A4W,
  height: A4H,
  featured: r.featured,
  build: r.build,
}))

export const BUSINESS_TPLS: TemplateSpec[] = [...cardTpls, ...paperwork, ...linkedin, ...resumeTpls]
