/**
 * Event & education templates — invitations, certificates, flashcards,
 * worksheets, planners, classroom charts.
 */
import {
  asset,
  doc,
  ellipse,
  F,
  gradient,
  img,
  page,
  pill,
  rect,
  rule,
  shp,
  solid,
  tbl,
  txt,
  type DesignElement,
  type TemplateSpec,
} from "../template-builder"

const INK = "#111827"
const A4W = 1240
const A4H = 1754

/* ------------------------------ invitations ------------------------------ */

const invitations: TemplateSpec[] = [
  {
    slug: "invitation-wedding-botanical",
    name: "Wildflower Vows — Wedding Invitation",
    category: "event",
    type: "canvas",
    tags: ["invitation", "wedding", "botanical", "elegant"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, solid("#f7fee7"), [
        page("Invitation", solid("#f7fee7"), [
          rect({ x: 60, y: 60, w: 930, h: 1380, fill: "#ffffff", stroke: "#3f6212", sw: 3, r: 20 }),
          img(asset("leaf"), { x: 110, y: 110, w: 150, h: 150, rotation: -20 }),
          img(asset("leaf"), { x: 790, y: 1240, w: 150, h: 150, rotation: 160 }),
          img(asset("flower"), { x: 760, y: 120, w: 130, h: 130 }),
          txt("together with their families", { x: 0, y: 300, w: 1050, h: 60, size: 36, font: F.script, weight: 400, color: "#3f6212", align: "center" }),
          txt("EMMA\n& NOAH", { x: 0, y: 390, w: 1050, h: 320, size: 130, font: F.serif, weight: 700, color: "#1a2e05", align: "center", lh: 1.1 }),
          txt("22 · 06 · 2026", { x: 0, y: 760, w: 1050, h: 60, size: 38, font: F.mono, weight: 400, color: "#4d7c0f", align: "center", ls: 10 }),
          rule(455, 880, 140, "#a3e635", 6),
          txt("The Willow Estate · four in the afternoon\nfollowed by dinner under the strings lights", { x: 0, y: 940, w: 1050, h: 130, size: 32, weight: 400, color: "#3f6212", align: "center", lh: 1.7 }),
          txt("RSVP by May 1 · emma-noah@postbox.test", { x: 0, y: 1330, w: 1050, h: 44, size: 26, weight: 400, color: "#65a30d", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "invitation-wedding-modern",
    name: "Gallery White — Modern Wedding Invite",
    category: "event",
    type: "canvas",
    tags: ["invitation", "wedding", "modern", "minimal"],
    width: 1050,
    height: 1500,
    featured: true,
    build: () =>
      doc("canvas", 1050, 1500, solid("#ffffff"), [
        page("Invitation", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: 1050, h: 500, fill: "#1c1917", r: 0 }),
          txt("SAVE\nTHE DATE", { x: 90, y: 90, w: 600, h: 320, size: 110, font: F.display, weight: 400, color: "#ffffff", lh: 1.05, ls: 6 }),
          img(asset("frame-circle"), { x: 720, y: 200, w: 240, h: 240, opacity: 0.9 }),
          txt("SATURDAY", { x: 90, y: 580, w: 400, h: 44, size: 28, font: F.mono, weight: 700, color: "#e11d48", ls: 8 }),
          txt("June 22, 2026\nat four o'clock", { x: 90, y: 640, w: 800, h: 180, size: 64, font: F.serif, weight: 700, color: "#1c1917", lh: 1.35 }),
          rule(90, 880, 870, "#e7e5e4", 2),
          txt("The Rose Garden, Elm Lane 4\ndinner & dancing to follow", { x: 90, y: 930, w: 870, h: 130, size: 32, weight: 400, color: "#44403c", lh: 1.7 }),
          ...pill("RSVP · EMMA + NOAH", { x: 90, y: 1130, w: 480, h: 88, fill: "#1c1917", size: 28, color: "#ffffff" }),
          txt("formal invite to follow — save the date", { x: 90, y: 1330, w: 700, h: 44, size: 24, font: F.mono, weight: 400, color: "#a8a29e" }),
        ]),
      ]),
  },
  {
    slug: "invitation-retirement",
    name: "Happy Trails — Retirement Party",
    category: "event",
    type: "canvas",
    tags: ["invitation", "retirement", "office", "party"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, solid("#fff7ed"), [
        page("Invitation", solid("#fff7ed"), [
          img(asset("sunburst"), { x: 300, y: 140, w: 450, h: 450, opacity: 0.9 }),
          txt("AFTER 38 YEARS…", { x: 0, y: 640, w: 1050, h: 60, size: 34, font: F.mono, weight: 700, color: "#c2410c", align: "center", ls: 6 }),
          txt("MR. HARTONO\nRETIRES", { x: 0, y: 720, w: 1050, h: 340, size: 100, font: F.serif, weight: 700, color: "#7c2d12", align: "center", lh: 1.15 }),
          txt("come send off the legend himself", { x: 0, y: 1090, w: 1050, h: 70, size: 44, font: F.script, weight: 400, color: "#ea580c", align: "center" }),
          rect({ x: 240, y: 1190, w: 570, h: 180, fill: "#ffffff", r: 16, stroke: "#fb923c", sw: 3 }),
          txt("FRI · MAY 30 · 4 PM\nCommunity Hall, Maple St.", { x: 240, y: 1215, w: 570, h: 130, size: 30, weight: 600, color: "#7c2d12", align: "center", lh: 1.7 }),
          txt("stories & roast speeches welcome · sign the big card at the door", { x: 0, y: 1430, w: 1050, h: 44, size: 24, font: F.hand, weight: 400, color: "#c2410c", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "invitation-charity-gala",
    name: "Gold Evening — Charity Gala Invite",
    category: "event",
    type: "canvas",
    tags: ["invitation", "gala", "charity", "elegant", "gold"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, solid("#111827"), [
        page("Invitation", solid("#111827"), [
          rect({ x: 50, y: 50, w: 950, h: 1400, fill: "transparent", stroke: "#fcd34d", sw: 4, r: 8 }),
          rect({ x: 74, y: 74, w: 902, h: 1352, fill: "transparent", stroke: "#92400e", sw: 2, r: 4 }),
          img(asset("laurel"), { x: 415, y: 150, w: 220, h: 220 }),
          txt("THE ANNUAL", { x: 0, y: 420, w: 1050, h: 50, size: 28, font: F.mono, weight: 400, color: "#d4d4d8", align: "center", ls: 12 }),
          txt("GOLD EVENING", { x: 0, y: 490, w: 1050, h: 140, size: 100, font: F.serif, weight: 700, color: "#fcd34d", align: "center", ls: 4 }),
          txt("a charity gala for the city library", { x: 0, y: 650, w: 1050, h: 60, size: 34, font: F.serif, weight: 400, italic: true, color: "#e5e7eb", align: "center" }),
          rule(455, 780, 140, "#fcd34d", 3),
          txt("SAT · NOV 8 · 7 PM · BLACK TIE\nGrand Hotel Ballroom · dinner at 8", { x: 0, y: 830, w: 1050, h: 180, size: 32, weight: 500, color: "#f9fafb", align: "center", lh: 1.9 }),
          ...pill("TABLES FROM $500", { x: 300, y: 1080, w: 450, h: 88, fill: "#fcd34d", size: 28, color: "#111827" }),
          txt("rsvp@goldevening.example · 555-0142", { x: 0, y: 1330, w: 1050, h: 44, size: 24, font: F.mono, weight: 400, color: "#92400e", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "invitation-pool-party",
    name: "Splash Day — Kids Pool Party",
    category: "event",
    type: "canvas",
    tags: ["invitation", "pool party", "kids", "summer"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, gradient("#38bdf8", "#0ea5e9", 170), [
        page("Invitation", gradient("#38bdf8", "#0ea5e9", 170), [
          ellipse({ x: -140, y: 1180, w: 500, h: 500, fill: "#e0f2fe", opacity: 0.4 }),
          img(asset("sun"), { x: 700, y: 140, w: 220, h: 220 }),
          txt("SPLASH\nDAY!", { x: 0, y: 320, w: 1050, h: 400, size: 170, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 0.98, ls: 4 }),
          txt("LUCAS TURNS 8", { x: 0, y: 760, w: 1050, h: 90, size: 64, font: F.cond, weight: 600, color: "#082f49", align: "center", ls: 6 }),
          txt("pool games · watermelon · ice cream ·\nno cannonballs before sunscreen", { x: 0, y: 880, w: 1050, h: 140, size: 34, font: F.hand, weight: 700, color: "#ffffff", align: "center", lh: 1.5 }),
          rect({ x: 240, y: 1070, w: 570, h: 200, fill: "#ffffff", r: 24 }),
          txt("SAT · JULY 19 · 2–5 PM\ncommunity pool, lane 3", { x: 240, y: 1105, w: 570, h: 130, size: 32, weight: 700, color: "#0c4a6e", align: "center", lh: 1.7 }),
          txt("RSVP sarah@postbox.test · towel & goggles included", { x: 0, y: 1350, w: 1050, h: 44, size: 24, font: F.mono, weight: 400, color: "#e0f2fe", align: "center" }),
        ]),
      ]),
  },
]

/* ------------------------------ certificates (family) ------------------------------ */

interface CertSpec {
  slug: string
  name: string
  title: string
  sub: string
  accent: string
  accentSoft: string
  ink: string
  seal: string
  tags: string[]
  featured?: boolean
}

const CERT_SPECS: CertSpec[] = [
  { slug: "cert-completion", name: "Certificate of Completion", title: "CERTIFICATE", sub: "OF COMPLETION", accent: "#1d4ed8", accentSoft: "#dbeafe", ink: "#1e3a8a", seal: "#1d4ed8", tags: ["certificate", "course", "completion"] },
  { slug: "cert-excellence", name: "Certificate of Excellence", title: "CERTIFICATE", sub: "OF EXCELLENCE", accent: "#b45309", accentSoft: "#fef3c7", ink: "#78350f", seal: "#f59e0b", tags: ["certificate", "award", "excellence"], featured: true },
  { slug: "cert-participation-kids", name: "Super Star — Kids Certificate", title: "SUPER STAR", sub: "AWARD GOES TO", accent: "#db2777", accentSoft: "#fce7f3", ink: "#831843", seal: "#f472b6", tags: ["certificate", "kids", "school"] },
]

const certTpls: TemplateSpec[] = CERT_SPECS.map((c) => ({
  slug: c.slug,
  name: c.name,
  category: "education",
  type: "canvas" as const,
  tags: c.tags,
  width: 1754,
  height: 1240,
  featured: c.featured,
  build: () =>
    doc("canvas", 1754, 1240, solid("#ffffff"), [
      page("Certificate", solid("#ffffff"), [
        rect({ x: 50, y: 50, w: 1654, h: 1140, fill: c.accentSoft, r: 20 }),
        rect({ x: 80, y: 80, w: 1594, h: 1080, fill: "#ffffff", stroke: c.accent, sw: 5, r: 12 }),
        img(asset("trophy"), { x: 807, y: 130, w: 140, h: 140 }),
        txt(c.title, { x: 200, y: 320, w: 1354, h: 110, size: 92, font: F.serif, weight: 700, color: c.ink, align: "center", ls: 12 }),
        txt(c.sub, { x: 200, y: 450, w: 1354, h: 60, size: 34, weight: 600, color: c.accent, align: "center", ls: 14 }),
        txt("proudly presented to", { x: 200, y: 550, w: 1354, h: 50, size: 28, weight: 400, color: c.ink, align: "center", opacity: 0.8 }),
        txt("{{name}}", { x: 200, y: 620, w: 1354, h: 120, size: 96, font: F.script, weight: 700, color: INK, align: "center" }),
        rule(627, 770, 500, c.accent, 3),
        txt("for outstanding achievement in {{course}} — {{date}}", { x: 200, y: 810, w: 1354, h: 50, size: 28, weight: 400, color: c.ink, align: "center" }),
        rule(220, 1030, 360, "#d1d5db", 3),
        rule(1170, 1030, 360, "#d1d5db", 3),
        txt("signature", { x: 220, y: 1048, w: 360, h: 36, size: 20, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
        txt("date", { x: 1170, y: 1048, w: 360, h: 36, size: 20, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
        ellipse({ x: 807, y: 950, w: 140, h: 140, fill: c.seal }),
        img(asset("starburst"), { x: 817, y: 960, w: 120, h: 120, opacity: 0.9 }),
      ]),
    ]),
}))

/* ------------------------------ flashcards & worksheets ------------------------------ */

const studyTpls: TemplateSpec[] = [
  {
    slug: "flashcards-math-doubles",
    name: "Doubles Facts — Math Flashcards",
    category: "education",
    type: "canvas",
    tags: ["flashcards", "math", "study", "kids"],
    width: 1080,
    height: 1080,
    build: () => {
      const cards: DesignElement[] = []
      const facts: [string, string][] = [
        ["2 + 2", "4"], ["5 + 5", "10"], ["8 + 8", "16"], ["10 + 10", "20"],
      ]
      facts.forEach(([q, a], i) => {
        const x = 90 + (i % 2) * 460
        const y = 300 + Math.floor(i / 2) * 330
        cards.push(rect({ x, y, w: 400, h: 280, fill: "#eff6ff", r: 24, stroke: "#93c5fd", sw: 3 }))
        cards.push(txt(q, { x, y: y + 40, w: 400, h: 100, size: 64, font: F.mono, weight: 700, color: "#1e3a8a", align: "center" }))
        cards.push(txt(a, { x, y: y + 160, w: 400, h: 80, size: 56, font: F.display, weight: 400, color: "#2563eb", align: "center" }))
      })
      return doc("canvas", 1080, 1080, solid("#ffffff"), [
        page("Flashcards", solid("#ffffff"), [
          txt("DOUBLES FACTS", { x: 90, y: 100, w: 700, h: 60, size: 44, font: F.mono, weight: 700, color: "#2563eb", ls: 4 }),
          txt("fold on the line, quiz a friend", { x: 90, y: 175, w: 800, h: 44, size: 28, font: F.hand, weight: 400, color: "#60a5fa" }),
          ...cards,
        ]),
      ])
    },
  },
  {
    slug: "flashcards-vocab-en-id",
    name: "English–Indonesia — Vocab Flashcards",
    category: "education",
    type: "canvas",
    tags: ["flashcards", "language", "english", "indonesia"],
    width: 1080,
    height: 1080,
    featured: true,
    build: () => {
      const cards: DesignElement[] = []
      const words: [string, string][] = [
        ["APPLE", "apel"], ["CHAIR", "kursi"], ["CLOUD", "awan"], ["BRAVE", "berani"],
      ]
      words.forEach(([en, id], i) => {
        const x = 90 + (i % 2) * 460
        const y = 300 + Math.floor(i / 2) * 330
        cards.push(rect({ x, y, w: 400, h: 280, fill: "#f0fdf4", r: 24, stroke: "#86efac", sw: 3 }))
        cards.push(txt(en, { x, y: y + 45, w: 400, h: 80, size: 52, weight: 700, color: "#14532d", align: "center" }))
        cards.push(rule(x + 140, y + 145, 120, "#4ade80", 4))
        cards.push(txt(id, { x, y: y + 170, w: 400, h: 80, size: 48, font: F.script, weight: 400, color: "#16a34a", align: "center" }))
      })
      return doc("canvas", 1080, 1080, solid("#ffffff"), [
        page("Flashcards", solid("#ffffff"), [
          txt("ENGLISH — BAHASA INDONESIA", { x: 90, y: 100, w: 900, h: 60, size: 38, font: F.mono, weight: 700, color: "#16a34a", ls: 2 }),
          txt("cover the bottom, say it out loud", { x: 90, y: 175, w: 800, h: 44, size: 28, font: F.hand, weight: 400, color: "#4ade80" }),
          ...cards,
        ]),
      ])
    },
  },
  {
    slug: "worksheet-math-practice",
    name: "Long Division — Practice Worksheet",
    category: "education",
    type: "canvas",
    tags: ["worksheet", "math", "practice", "homework"],
    width: A4W,
    height: A4H,
    build: () => {
      const problems = ["144 ÷ 12 =", "625 ÷ 25 =", "378 ÷ 14 =", "512 ÷ 16 =", "805 ÷ 23 =", "936 ÷ 18 ="]
      const cells: DesignElement[] = problems.flatMap((p, i) => {
        const x = 90 + (i % 2) * 550
        const y = 430 + Math.floor(i / 2) * 330
        return [
          rect({ x, y, w: 500, h: 280, fill: "#fff7ed", r: 16, stroke: "#fdba74", sw: 2 }),
          txt(p, { x: x + 30, y: y + 24, w: 440, h: 60, size: 40, font: F.mono, weight: 700, color: "#9a3412" }),
          rule(x + 30, y + 210, 440, "#fdba74", 2),
          rule(x + 30, y + 150, 440, "#fdba74", 2),
        ] as DesignElement[]
      })
      return doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Worksheet", solid("#ffffff"), [
          txt("LONG DIVISION PRACTICE", { x: 90, y: 120, w: 900, h: 70, size: 52, font: F.display, weight: 400, color: "#9a3412", ls: 2 }),
          txt("name: ______________  date: __________  score: ____ / 6", { x: 90, y: 220, w: 1000, h: 50, size: 26, font: F.mono, weight: 400, color: "#c2410c" }),
          txt("show your work — neat columns count!", { x: 92, y: 280, w: 800, h: 44, size: 26, font: F.hand, weight: 400, color: "#ea580c" }),
          ...cells,
          txt("bonus: write your own division problem and swap with a deskmate", { x: 90, y: 1520, w: 1060, h: 50, size: 26, font: F.hand, weight: 400, color: "#9a3412" }),
        ]),
      ])
    },
  },
  {
    slug: "worksheet-handwriting",
    name: "Letter Loops — Handwriting Practice",
    category: "education",
    type: "canvas",
    tags: ["worksheet", "handwriting", "kids", "writing"],
    width: A4W,
    height: A4H,
    build: () => {
      const lines: DesignElement[] = []
      const rows = ["aaaaaaaaa", "bbbbbbbbb", "ccccccccc", "ddddddddd", "eeeeeeeee", "fffffffff"]
      rows.forEach((r, i) => {
        const y = 400 + i * 160
        lines.push(txt(r, { x: 110, y, w: 500, h: 70, size: 52, font: F.script, weight: 400, color: "#a78bfa", vAlign: "middle" }))
        lines.push(rule(650, y + 56, 480, "#e9d5ff", 2))
        lines.push(rule(650, y + 16, 480, "#ddd6fe", 2))
        lines.push(rule(650, y + 96, 480, "#ddd6fe", 2))
      })
      return doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Worksheet", solid("#ffffff"), [
          txt("HANDWRITING PRACTICE", { x: 90, y: 110, w: 900, h: 70, size: 50, font: F.display, weight: 400, color: "#6d28d9", ls: 2 }),
          txt("trace the letter, then write it twice on the lines", { x: 92, y: 195, w: 900, h: 46, size: 26, font: F.hand, weight: 400, color: "#8b5cf6" }),
          ...lines,
          txt("name: ______________", { x: 90, y: 1440, w: 500, h: 50, size: 26, font: F.mono, weight: 400, color: "#a78bfa" }),
          txt("star of the day if all six rows are neat!", { x: 90, y: 1540, w: 900, h: 50, size: 26, font: F.hand, weight: 400, color: "#7c3aed" }),
        ]),
      ])
    },
  },
  {
    slug: "lab-report-template",
    name: "Science Lab — Report Sheet",
    category: "education",
    type: "canvas",
    tags: ["worksheet", "science", "lab report", "stem"],
    width: A4W,
    height: A4H,
    build: () => {
      const box = (title: string, hint: string, y: number, h: number): DesignElement[] => [
        rect({ x: 90, y, w: 1060, h, fill: "#f0fdfa", stroke: "#5eead4", sw: 3, r: 14 }),
        txt(title, { x: 120, y: y + 20, w: 600, h: 44, size: 28, font: F.cond, weight: 600, color: "#0f766e", ls: 3 }),
        txt(hint, { x: 122, y: y + 74, w: 980, h: h - 100, size: 24, font: F.hand, weight: 400, color: "#14b8a6", lh: 1.8 }),
      ]
      return doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Lab report", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: A4W, h: 220, fill: "#0f766e", r: 0 }),
          txt("SCIENCE LAB REPORT", { x: 90, y: 60, w: 900, h: 80, size: 54, font: F.display, weight: 400, color: "#ffffff", ls: 3 }),
          txt("name ____________ · partner ____________ · date ________", { x: 90, y: 155, w: 1000, h: 44, size: 24, font: F.mono, weight: 400, color: "#99f6e4" }),
          ...box("QUESTION — what are we testing?", "I wonder what happens if…", 280, 220),
          ...box("HYPOTHESIS — what do we predict?", "I think … because …", 530, 220),
          ...box("MATERIALS", "list everything you used", 780, 220),
          ...box("RESULTS — draw or describe", "sketch below the line", 1030, 340),
          rule(120, 1290, 1000, "#5eead4", 3),
          txt("conclusion: was your hypothesis right? what would you try next?", { x: 90, y: 1420, w: 1060, h: 60, size: 26, font: F.hand, weight: 400, color: "#0f766e" }),
          ...pill("science is asking why twice", { x: 330, y: 1560, w: 580, h: 76, fill: "#0f766e", size: 26, color: "#f0fdfa" }),
        ]),
      ])
    },
  },
  {
    slug: "lesson-plan-weekly",
    name: "Week 12 — Lesson Plan",
    category: "education",
    type: "canvas",
    tags: ["lesson plan", "teacher", "planning"],
    width: A4H,
    height: A4W,
    build: () => {
      const cols: [string, string, string][] = [
        ["MON", "Fractions intro", "pizza math manipulatives"],
        ["TUE", "Fractions practice", "stations + worksheet p.44"],
        ["WED", "Reading circles", "roles rotate; ch. 5–6"],
        ["THU", "Art: mix palettes", "primary → secondary chart"],
        ["FRI", "Quiz + library", "10Q quiz · silent reading"],
      ]
      return doc("canvas", A4H, A4W, solid("#fffbeb"), [
        page("Lesson plan", solid("#fffbeb"), [
          txt("WEEK 12 — LESSON PLAN", { x: 60, y: 60, w: 1200, h: 80, size: 54, font: F.display, weight: 400, color: "#92400e", ls: 2 }),
          txt("grade 4 · teacher: Ms. Ayu · theme: parts & wholes", { x: 62, y: 155, w: 1200, h: 44, size: 26, font: F.mono, weight: 400, color: "#b45309" }),
          ...cols.flatMap(([day, topic, notes], i) => {
            const x = 60 + i * 250
            return [
              rect({ x, y: 260, w: 230, h: 760, fill: i % 2 ? "#fef3c7" : "#ffffff", stroke: "#fcd34d", sw: 2, r: 14 }),
              txt(day, { x, y: 280, w: 230, h: 50, size: 30, font: F.display, weight: 400, color: "#b45309", align: "center", ls: 4 }),
              txt(topic, { x: x + 16, y: 350, w: 200, h: 140, size: 26, weight: 600, color: "#78350f", lh: 1.4 }),
              rule(x + 16, 510, 200, "#fcd34d", 3),
              txt(notes, { x: x + 16, y: 535, w: 200, h: 220, size: 22, weight: 400, color: "#92400e", lh: 1.6 }),
            ] as DesignElement[]
          }),
          txt("materials to prep monday: fraction cards · chart paper · 24 pencils sharpened", { x: 60, y: 1090, w: 1300, h: 50, size: 24, font: F.mono, weight: 400, color: "#d6d3d1" }),
          ...pill("reflection friday: what worked?", { x: 480, y: 1170, w: 620, h: 84, fill: "#b45309", size: 26, color: "#fffbeb" }),
        ]),
      ])
    },
  },
  {
    slug: "reading-log",
    name: "Book Worm — Reading Log",
    category: "education",
    type: "canvas",
    tags: ["reading log", "books", "kids", "homework"],
    width: A4W,
    height: A4H,
    build: () => {
      const rows: DesignElement[] = []
      for (let i = 0; i < 8; i++) {
        const y = 420 + i * 120
        rows.push(rect({ x: 90, y, w: 1060, h: 90, fill: i % 2 ? "#fdf2f8" : "#ffffff", stroke: "#f9a8d4", sw: 2, r: 10 }))
        rows.push(txt(`☐`, { x: 110, y: y + 10, w: 60, h: 70, size: 40, weight: 400, color: "#ec4899", vAlign: "middle" }))
        rows.push(rule(200, y + 66, 380, "#fbcfe8", 2))
        rows.push(rule(620, y + 66, 180, "#fbcfe8", 2))
        rows.push(rule(830, y + 66, 290, "#fbcfe8", 2))
      }
      return doc("canvas", A4W, A4H, solid("#fff1f2"), [
        page("Reading log", solid("#fff1f2"), [
          img(asset("book-open"), { x: 90, y: 100, w: 150, h: 112 }),
          txt("READING LOG", { x: 280, y: 120, w: 600, h: 80, size: 60, font: F.display, weight: 400, color: "#9d174d", ls: 3 }),
          txt("title & author", { x: 200, y: 340, w: 380, h: 44, size: 24, font: F.mono, weight: 700, color: "#be185d" }),
          txt("pages", { x: 620, y: 340, w: 180, h: 44, size: 24, font: F.mono, weight: 700, color: "#be185d" }),
          txt("minutes", { x: 830, y: 340, w: 290, h: 44, size: 24, font: F.mono, weight: 700, color: "#be185d" }),
          ...rows,
          txt("read 20 minutes a day — 8 boxes = a bookmark reward", { x: 90, y: 1440, w: 1060, h: 50, size: 28, font: F.hand, weight: 400, color: "#9d174d" }),
        ]),
      ])
    },
  },
  {
    slug: "classroom-rules-poster",
    name: "Our Class Promise — Rules Poster",
    category: "education",
    type: "canvas",
    tags: ["classroom", "rules", "poster", "teacher"],
    width: A4W,
    height: A4H,
    featured: true,
    build: () =>
      doc("canvas", A4W, A4H, solid("#eff6ff"), [
        page("Poster", solid("#eff6ff"), [
          rect({ x: 90, y: 90, w: 1060, h: 1574, fill: "#ffffff", stroke: "#1d4ed8", sw: 6, r: 24 }),
          img(asset("sun"), { x: 520, y: 150, w: 200, h: 200 }),
          txt("OUR CLASS PROMISE", { x: 0, y: 380, w: A4W, h: 90, size: 64, font: F.cond, weight: 600, color: "#1e3a8a", align: "center", ls: 4 }),
          ...["We listen when others speak.", "We try, even when it's hard.", "We are kind — always.", "We clean up after ourselves.", "We ask questions. Lots of them."].flatMap((r, i) => {
            const y = 540 + i * 190
            return [
              shp("badge", { x: 150, y, w: 100, h: 100, fill: i % 2 ? "#93c5fd" : "#1d4ed8" }),
              txt(String(i + 1), { x: 150, y: y - 2, w: 100, h: 104, size: 48, font: F.display, weight: 400, color: i % 2 ? INK : "#ffffff", align: "center", vAlign: "middle" }),
              txt(r, { x: 290, y, w: 800, h: 100, size: 40, font: F.body, weight: 500, color: "#1e3a8a", vAlign: "middle" }),
            ] as DesignElement[]
          }),
          txt("signed by all of us — first day of school", { x: 0, y: 1540, w: A4W, h: 60, size: 30, font: F.hand, weight: 400, color: "#2563eb", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "alphabet-chart",
    name: "A is for… — Alphabet Chart",
    category: "education",
    type: "canvas",
    tags: ["alphabet", "chart", "kids", "literacy"],
    width: A4W,
    height: A4H,
    build: () => {
      const pairs: [string, string][] = [
        ["Aa", "apple"], ["Bb", "boat"], ["Cc", "cat"], ["Dd", "dog"],
        ["Ee", "egg"], ["Ff", "fish"], ["Gg", "grape"], ["Hh", "hat"],
        ["Ii", "ice"], ["Jj", "jam"], ["Kk", "kite"], ["Ll", "leaf"],
      ]
      const cells: DesignElement[] = pairs.flatMap(([letter, word], i) => {
        const x = 90 + (i % 4) * 270
        const y = 400 + Math.floor(i / 4) * 380
        const colors = ["#ef4444", "#f97316", "#22c55e", "#0ea5e9"]
        return [
          rect({ x, y, w: 240, h: 330, fill: "#ffffff", stroke: "#e5e7eb", sw: 3, r: 16 }),
          txt(letter, { x, y: y + 40, w: 240, h: 150, size: 110, font: F.display, weight: 400, color: colors[i % 4], align: "center" }),
          txt(word, { x, y: y + 230, w: 240, h: 50, size: 30, font: F.script, weight: 400, color: "#6b7280", align: "center" }),
        ] as DesignElement[]
      })
      return doc("canvas", A4W, A4H, solid("#fafaf9"), [
        page("Chart", solid("#fafaf9"), [
          txt("A IS FOR…", { x: 0, y: 130, w: A4W, h: 110, size: 80, font: F.display, weight: 400, color: INK, align: "center", ls: 6 }),
          txt("point, say it, trace it in the air", { x: 0, y: 260, w: A4W, h: 50, size: 28, font: F.hand, weight: 400, color: "#9ca3af", align: "center" }),
          ...cells,
        ]),
      ])
    },
  },
  {
    slug: "multiplication-table",
    name: "Times Table — Multiplication Chart",
    category: "education",
    type: "canvas",
    tags: ["multiplication", "math", "chart", "study"],
    width: A4W,
    height: A4H,
    build: () => {
      const rows: string[][] = [["×", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]]
      for (let r = 1; r <= 10; r++) {
        rows.push([String(r), ...Array.from({ length: 10 }, (_, c) => String(r * (c + 1)))])
      }
      return doc("canvas", A4W, A4H, solid("#f5f3ff"), [
        page("Chart", solid("#f5f3ff"), [
          txt("TIMES TABLE", { x: 0, y: 90, w: A4W, h: 100, size: 76, font: F.display, weight: 400, color: "#5b21b6", align: "center", ls: 6 }),
          txt("cover the answers with your hand and quiz yourself", { x: 0, y: 210, w: A4W, h: 44, size: 26, font: F.hand, weight: 400, color: "#8b5cf6", align: "center" }),
          tbl(rows, {
            x: 70, y: 300, w: 1100, h: 1200, fontSize: 24,
            headerBg: "#7c3aed", headerColor: "#ffffff",
            rowBg: "#ffffff", altRowBg: "#f5f3ff",
            borderColor: "#ddd6fe", color: "#1f2937",
          }),
          txt("tip: the diagonal is the squares — 1, 4, 9, 16…", { x: 70, y: 1560, w: 1100, h: 50, size: 26, font: F.hand, weight: 400, color: "#7c3aed" }),
        ]),
      ])
    },
  },
  {
    slug: "quiz-sheet-blank",
    name: "Pop Quiz — Answer Sheet",
    category: "education",
    type: "canvas",
    tags: ["quiz", "answer sheet", "test", "teacher"],
    width: A4W,
    height: A4H,
    build: () => {
      const qs: DesignElement[] = []
      for (let i = 0; i < 10; i++) {
        const y = 470 + i * 105
        qs.push(txt(`${i + 1}.`, { x: 90, y, w: 70, h: 60, size: 30, font: F.mono, weight: 700, color: "#0f766e", vAlign: "middle" }))
        qs.push(rule(170, y + 52, 380, "#99f6e4", 2))
        qs.push(txt("A", { x: 620, y, w: 50, h: 60, size: 26, font: F.mono, weight: 400, color: "#14b8a6", vAlign: "middle" }))
        qs.push(ellipse({ x: 660, y: y + 8, w: 44, h: 44, fill: "transparent", stroke: "#5eead4", sw: 3 }))
        qs.push(txt("B", { x: 760, y, w: 50, h: 60, size: 26, font: F.mono, weight: 400, color: "#14b8a6", vAlign: "middle" }))
        qs.push(ellipse({ x: 800, y: y + 8, w: 44, h: 44, fill: "transparent", stroke: "#5eead4", sw: 3 }))
        qs.push(txt("C", { x: 900, y, w: 50, h: 60, size: 26, font: F.mono, weight: 400, color: "#14b8a6", vAlign: "middle" }))
        qs.push(ellipse({ x: 940, y: y + 8, w: 44, h: 44, fill: "transparent", stroke: "#5eead4", sw: 3 }))
      }
      return doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Quiz", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: A4W, h: 200, fill: "#0f766e", r: 0 }),
          txt("POP QUIZ", { x: 90, y: 55, w: 500, h: 90, size: 64, font: F.display, weight: 400, color: "#ffffff", ls: 4 }),
          txt("name ______________ · class ____ · 10 questions", { x: 620, y: 85, w: 540, h: 44, size: 22, font: F.mono, weight: 400, color: "#99f6e4", align: "right" }),
          txt("circle the best answer — good luck!", { x: 90, y: 260, w: 800, h: 50, size: 30, font: F.hand, weight: 400, color: "#0f766e" }),
          ...qs,
          txt("score: ____ / 10", { x: 820, y: 1560, w: 330, h: 60, size: 34, font: F.mono, weight: 700, color: "#0f766e", align: "right", vAlign: "middle" }),
        ]),
      ])
    },
  },
]

export const EVENT_EDU_TPLS: TemplateSpec[] = [...invitations, ...certTpls, ...studyTpls]
