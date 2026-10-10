/**
 * Story & YouTube templates — 9:16 stories and 16:9 YouTube assets.
 * Story patterns cover the full small-business lifecycle: sell, engage,
 * teach, show behind-the-scenes, hire, announce.
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
  txt,
  type DesignElement,
  type TemplateSpec,
} from "../template-builder"

const W = 1080
const H = 1920
const INK = "#111827"

/* ------------------------------ story helper: header + footer ------------------------------ */

function chrome(els: DesignElement[], label: string, handle: string, color: string) {
  els.push(txt(label, { x: 90, y: 200, w: 900, h: 44, size: 28, font: F.mono, weight: 700, color, ls: 6, upper: true }))
  els.push(txt(handle, { x: 90, y: 1770, w: 900, h: 40, size: 26, font: F.mono, weight: 400, color, opacity: 0.8 }))
}

/* ------------------------------ sales stories ------------------------------ */

const saleStories: TemplateSpec[] = [
  {
    slug: "story-countdown-sale",
    name: "Ends Tonight — Countdown Story",
    category: "story",
    type: "canvas",
    tags: ["story", "sale", "countdown", "urgent"],
    width: W,
    height: H,
    featured: true,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 90, y: 520, w: 900, h: 880, fill: "#f43f5e", r: 40 }),
        txt("ENDS\nTONIGHT", { x: 0, y: 640, w: W, h: 420, size: 190, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 0.95, ls: 4 }),
        txt("MIDNIGHT · WIB", { x: 0, y: 1100, w: W, h: 70, size: 54, font: F.cond, weight: 600, color: "#fecdd3", align: "center", ls: 8 }),
        ...pill("USE CODE: TONIGHT30", { x: 240, y: 1210, w: 600, h: 100, fill: INK, size: 34, color: "#fde047" }),
      ]
      chrome(els, "FLASH SALE", "@yourstudio · link up top", "#fecdd3")
      els.push(img(asset("lightning"), { x: 440, y: 300, w: 200, h: 200 }))
      return doc("canvas", W, H, solid("#fff1f2"), [page("Story", solid("#fff1f2"), els)])
    },
  },
  {
    slug: "story-discount-code",
    name: "Secret Code — Discount Story",
    category: "story",
    type: "canvas",
    tags: ["story", "sale", "code", "exclusive"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 70, y: 70, w: 940, h: 1780, fill: "#0b1220", r: 48 }),
        txt("FOLLOWERS ONLY", { x: 0, y: 380, w: W, h: 50, size: 32, font: F.mono, weight: 700, color: "#22d3ee", align: "center", ls: 8 }),
        txt("SECRET\nSALE CODE", { x: 0, y: 480, w: W, h: 380, size: 150, font: F.display, weight: 400, color: "#fafafa", align: "center", lh: 1 }),
        rect({ x: 240, y: 950, w: 600, h: 150, fill: "transparent", stroke: "#22d3ee", sw: 4, r: 20, dash: [18, 14] }),
        txt("INSIDER15", { x: 240, y: 960, w: 600, h: 130, size: 76, font: F.mono, weight: 700, color: "#22d3ee", align: "center", vAlign: "middle", ls: 6 }),
        txt("15% off everything — expires sunday 23:59", { x: 0, y: 1180, w: W, h: 50, size: 32, weight: 400, color: "#94a3b8", align: "center" }),
        ...pill("SHOP NOW", { x: 340, y: 1300, w: 400, h: 92, fill: "#22d3ee", size: 32, color: "#0b1220" }),
      ]
      els.push(img(asset("sparkle"), { x: 130, y: 300, w: 130, h: 130 }))
      els.push(img(asset("sparkle-small"), { x: 830, y: 1420, w: 120, h: 120 }))
      chrome(els, "INSIDER LIST", "@yourstudio", "#64748b")
      return doc("canvas", W, H, solid("#0f172a"), [page("Story", solid("#0f172a"), els)])
    },
  },
  {
    slug: "story-last-chance",
    name: "Last Chance — Restock Story",
    category: "story",
    type: "canvas",
    tags: ["story", "sale", "restock", "final"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        img(asset("stripes-diag"), { x: 0, y: 0, w: W, h: H, opacity: 0.9 }),
        rect({ x: 110, y: 560, w: 860, h: 800, fill: "#fff7ed", r: 32 }),
        txt("LAST\nCHANCE", { x: 0, y: 640, w: W, h: 380, size: 180, font: F.display, weight: 400, color: "#9a3412", align: "center", lh: 0.98 }),
        txt("the famous cinnamon buns are back\nuntil saturday — then gone again", { x: 150, y: 1060, w: 780, h: 130, size: 34, weight: 500, color: "#7c2d12", align: "center", lh: 1.5 }),
        ...pill("RESERVE YOURS", { x: 290, y: 1220, w: 500, h: 96, fill: "#ea580c", size: 34, color: "#fff7ed" }),
      ]
      chrome(els, "CRUMB BAKERY", "@crumb.bakery · order by DM", "#9a3412")
      els.push(img(asset("coffee"), { x: 100, y: 300, w: 190, h: 190, rotation: -8 }))
      return doc("canvas", W, H, solid("#7c2d12"), [page("Story", solid("#7c2d12"), els)])
    },
  },
]

/* ------------------------------ engagement stories ------------------------------ */

const engagementStories: TemplateSpec[] = [
  {
    slug: "story-this-or-that",
    name: "This or That — Poll Story",
    category: "story",
    type: "canvas",
    tags: ["story", "poll", "engagement", "interactive"],
    width: W,
    height: H,
    featured: true,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 80, y: 500, w: 920, h: 300, fill: "#f9a8d4", r: 28 }),
        rect({ x: 80, y: 860, w: 920, h: 300, fill: "#a5b4fc", r: 28 }),
        txt("SUMMER", { x: 80, y: 560, w: 920, h: 120, size: 90, font: F.display, weight: 400, color: "#831843", align: "center" }),
        txt("beach days & tan lines", { x: 80, y: 690, w: 920, h: 60, size: 38, font: F.script, weight: 400, color: "#fdf2f8", align: "center" }),
        txt("WINTER", { x: 80, y: 920, w: 920, h: 120, size: 90, font: F.display, weight: 400, color: "#312e81", align: "center" }),
        txt("coats, cocoa & quiet", { x: 80, y: 1050, w: 920, h: 60, size: 38, font: F.script, weight: 400, color: "#eef2ff", align: "center" }),
        txt("VOTE IN THE POLL ↑", { x: 0, y: 1280, w: W, h: 70, size: 48, font: F.cond, weight: 600, color: INK, align: "center", ls: 6 }),
      ]
      chrome(els, "THIS OR THAT", "@yourstudio", "#6b7280")
      els.push(txt("which team are you?", { x: 0, y: 330, w: W, h: 90, size: 64, font: F.serif, weight: 700, color: INK, align: "center" }))
      return doc("canvas", W, H, solid("#fdf2f8"), [page("Story", solid("#fdf2f8"), els)])
    },
  },
  {
    slug: "story-quiz-time",
    name: "Pop Quiz — Quiz Story",
    category: "story",
    type: "canvas",
    tags: ["story", "quiz", "education", "fun"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 90, y: 430, w: 900, h: 700, fill: "#fef9c3", r: 32 }),
        img(asset("pencil"), { x: 770, y: 350, w: 150, h: 150, rotation: 14 }),
        txt("POP QUIZ", { x: 140, y: 490, w: 500, h: 60, size: 36, font: F.mono, weight: 700, color: "#a16207", ls: 8 }),
        txt("What year was\nthe very first\nemoji sent? 🙂", { x: 140, y: 580, w: 800, h: 300, size: 62, font: F.serif, weight: 700, color: "#713f12", lh: 1.3 }),
        txt("tap your answer — no googling!", { x: 140, y: 990, w: 800, h: 50, size: 30, font: F.hand, weight: 400, color: "#a16207" }),
        ...pill("answer in tonight's story", { x: 240, y: 1220, w: 600, h: 84, fill: "#a16207", size: 28, color: "#fef9c3" }),
      ]
      chrome(els, "QUIZ TIME", "@yourstudio · daily", "#a16207")
      return doc("canvas", W, H, solid("#f7fee7"), [page("Story", solid("#f7fee7"), els)])
    },
  },
  {
    slug: "story-ask-anything",
    name: "Ask Me Anything — Q&A Story",
    category: "story",
    type: "canvas",
    tags: ["story", "q&a", "engagement", "ama"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        ellipse({ x: -140, y: 1280, w: 560, h: 560, fill: "#c4b5fd", opacity: 0.5 }),
        ellipse({ x: 720, y: 160, w: 480, h: 480, fill: "#ddd6fe", opacity: 0.6 }),
        txt("ASK ME\nANYTHING", { x: 0, y: 600, w: W, h: 440, size: 160, font: F.display, weight: 400, color: "#4c1d95", align: "center", lh: 1 }),
        txt("about design, freelancing,\nfailures, cats — whatever", { x: 0, y: 1080, w: W, h: 140, size: 40, font: F.hand, weight: 400, color: "#6d28d9", align: "center", lh: 1.4 }),
        ...pill("DROP A QUESTION ↑", { x: 290, y: 1330, w: 500, h: 96, fill: "#4c1d95", size: 32, color: "#f5f3ff" }),
      ]
      chrome(els, "Q&A FRIDAY", "@yourstudio", "#7c3aed")
      return doc("canvas", W, H, solid("#f5f3ff"), [page("Story", solid("#f5f3ff"), els)])
    },
  },
  {
    slug: "story-would-you-rather",
    name: "Would You Rather — Story",
    category: "story",
    type: "canvas",
    tags: ["story", "game", "engagement"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 0, y: 0, w: W, h: H / 2, fill: "#0ea5e9", r: 0 }),
        rect({ x: 0, y: H / 2, w: W, h: H / 2, fill: "#f97316", r: 0 }),
        txt("WOULD YOU RATHER…", { x: 0, y: 260, w: W, h: 60, size: 40, font: F.mono, weight: 700, color: "#ffffff", align: "center", ls: 6 }),
        txt("WORK FROM\nA BEACH", { x: 0, y: 420, w: W, h: 300, size: 110, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1.05 }),
        txt("OR", { x: 460, y: 880, w: 160, h: 160, size: 64, font: F.pop, weight: 800, color: "#ffffff", align: "center", vAlign: "middle", rotation: -4, bgColor: INK }),
        txt("WORK FROM\nA CABIN", { x: 0, y: 1120, w: W, h: 300, size: 110, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1.05 }),
        txt("vote with the sliders ↑↓", { x: 0, y: 1600, w: W, h: 50, size: 32, font: F.hand, weight: 400, color: "#ffffff", align: "center" }),
      ]
      chrome(els, "GAME NIGHT", "@yourstudio", "#ffffff")
      return doc("canvas", W, H, solid(INK), [page("Story", solid(INK), els)])
    },
  },
]

/* ------------------------------ content & community stories ------------------------------ */

const contentStories: TemplateSpec[] = [
  {
    slug: "story-behind-scenes",
    name: "Behind the Scenes — Story",
    category: "story",
    type: "canvas",
    tags: ["story", "behind the scenes", "studio", "process"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 80, y: 420, w: 920, h: 900, fill: "#ffffff", r: 24, stroke: "#e5e7eb", sw: 3 }),
        img(asset("frame-polaroid"), { x: 160, y: 480, w: 760, h: 700, opacity: 0.9 }),
        txt("PUT YOUR WORKSPACE PHOTO HERE", { x: 240, y: 790, w: 600, h: 60, size: 30, font: F.mono, weight: 700, color: "#9ca3af", align: "center" }),
        txt("BEHIND THE SCENES", { x: 0, y: 250, w: W, h: 70, size: 44, font: F.cond, weight: 600, color: INK, align: "center", ls: 8 }),
        txt("where the sticker magic happens —\nthird coffee, second sketchbook", { x: 120, y: 1400, w: 840, h: 120, size: 34, font: F.hand, weight: 400, color: "#374151", align: "center", lh: 1.45 }),
        ...pill("SEE THE PROCESS", { x: 290, y: 1560, w: 500, h: 90, fill: INK, size: 30, color: "#ffffff" }),
      ]
      chrome(els, "STUDIO LIFE", "@yourstudio", "#6b7280")
      return doc("canvas", W, H, solid("#f3f4f6"), [page("Story", solid("#f3f4f6"), els)])
    },
  },
  {
    slug: "story-new-arrival",
    name: "Just Dropped — New Arrival Story",
    category: "story",
    type: "canvas",
    tags: ["story", "product", "launch", "ecommerce"],
    width: W,
    height: H,
    featured: true,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 140, y: 480, w: 800, h: 800, fill: "#1f2937", r: 36 }),
        ellipse({ x: 420, y: 640, w: 440, h: 440, fill: "#374151" }),
        txt("PRODUCT\nPHOTO", { x: 140, y: 830, w: 800, h: 100, size: 40, font: F.mono, weight: 700, color: "#9ca3af", align: "center", ls: 6 }),
        txt("JUST\nDROPPED", { x: 0, y: 240, w: W, h: 200, size: 110, font: F.display, weight: 400, color: "#111827", align: "center", lh: 0.98, ls: 4 }),
        txt("The Everyday Tote — canvas, 14\" laptop\nsleeve, 6 pockets. Limited first run of 50.", { x: 120, y: 1340, w: 840, h: 120, size: 34, weight: 500, color: "#1f2937", align: "center", lh: 1.5 }),
        txt("$34 — free shipping today", { x: 0, y: 1480, w: W, h: 60, size: 44, font: F.pop, weight: 700, color: "#b45309", align: "center" }),
        ...pill("SHOP THE DROP", { x: 290, y: 1580, w: 500, h: 94, fill: "#111827", size: 32, color: "#ffffff" }),
      ]
      els.push(shp("badge", { x: 780, y: 420, w: 130, h: 130, fill: "#fde047", rotation: 12 }))
      els.push(txt("NEW", { x: 780, y: 462, w: 130, h: 60, size: 34, font: F.display, weight: 400, color: INK, align: "center" }))
      chrome(els, "NEW IN", "@yourstudio · story link", "#6b7280")
      return doc("canvas", W, H, solid("#f9fafb"), [page("Story", solid("#f9fafb"), els)])
    },
  },
  {
    slug: "story-product-spotlight",
    name: "Fan Favorite — Product Spotlight",
    category: "story",
    type: "canvas",
    tags: ["story", "product", "bestseller"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 90, y: 90, w: 900, h: 1740, fill: "#fef3c7", r: 44 }),
        txt("★ BESTSELLER ★", { x: 0, y: 300, w: W, h: 60, size: 36, font: F.mono, weight: 700, color: "#b45309", align: "center", ls: 8 }),
        ellipse({ x: 340, y: 420, w: 400, h: 400, fill: "#fbbf24" }),
        img(asset("coffee"), { x: 400, y: 470, w: 280, h: 280 }),
        txt("HONEY LATTE", { x: 0, y: 900, w: W, h: 110, size: 84, font: F.display, weight: 400, color: "#78350f", align: "center", ls: 4 }),
        txt("espresso · steamed oat milk ·\nlocal raw honey · cinnamon", { x: 190, y: 1030, w: 700, h: 110, size: 32, font: F.body, weight: 400, color: "#92400e", align: "center", lh: 1.5 }),
        txt("$4.50", { x: 0, y: 1190, w: W, h: 100, size: 76, font: F.display, weight: 400, color: "#b45309", align: "center" }),
        ...pill("ORDER AT THE COUNTER", { x: 270, y: 1330, w: 540, h: 90, fill: "#78350f", size: 28, color: "#fef3c7" }),
        txt("“tastes like a warm hug” — Rina, regular since 2023", { x: 150, y: 1500, w: 780, h: 50, size: 28, font: F.hand, weight: 400, color: "#92400e", align: "center" }),
      ]
      chrome(els, "MENU SPOTLIGHT", "@sunrise.cafe", "#b45309")
      return doc("canvas", W, H, solid("#fffbeb"), [page("Story", solid("#fffbeb"), els)])
    },
  },
  {
    slug: "story-quote-morning",
    name: "Slow Morning — Quote Story",
    category: "story",
    type: "canvas",
    tags: ["story", "quote", "calm", "morning"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        img(asset("waves-pattern"), { x: 0, y: 1250, w: W, h: 670, opacity: 0.8 }),
        img(asset("sun"), { x: 380, y: 320, w: 320, h: 320 }),
        txt("“Almost everything\nworks better if you\nunplug it for a\nfew minutes —\nincluding you.”", { x: 120, y: 720, w: 840, h: 480, size: 62, font: F.serif, weight: 700, color: "#0c4a6e", align: "center", lh: 1.35 }),
        txt("— anne lamott", { x: 0, y: 1230, w: W, h: 60, size: 36, font: F.script, weight: 400, color: "#0369a1", align: "center" }),
      ]
      chrome(els, "SLOW SUNDAY", "@yourstudio", "#075985")
      return doc("canvas", W, H, solid("#f0f9ff"), [page("Story", solid("#f0f9ff"), els)])
    },
  },
  {
    slug: "story-tips-list",
    name: "5 Quick Tips — Story",
    category: "story",
    type: "canvas",
    tags: ["story", "tips", "listicle", "education"],
    width: W,
    height: H,
    build: () => {
      const tips = ["Shoot near a window", "Wipe your lens first", "Use the grid — always", "One hero color per shot", "Edit less, crop more"]
      const rows: DesignElement[] = []
      tips.forEach((s, i) => {
        const y = 560 + i * 130
        rows.push(shp("badge", { x: 120, y, w: 76, h: 76, fill: i % 2 ? "#22d3ee" : "#0f172a" }))
        rows.push(txt(String(i + 1), { x: 120, y: y - 2, w: 76, h: 80, size: 38, font: F.display, weight: 400, color: i % 2 ? INK : "#ffffff", align: "center", vAlign: "middle" }))
        rows.push(txt(s, { x: 230, y, w: 720, h: 76, size: 40, weight: 600, color: "#0f172a", vAlign: "middle" }))
      })
      const els: DesignElement[] = [
        txt("5 QUICK TIPS", { x: 90, y: 320, w: 900, h: 110, size: 90, font: F.display, weight: 400, color: "#0f172a", ls: 2 }),
        txt("for better phone photos — screenshot this", { x: 94, y: 440, w: 880, h: 50, size: 32, weight: 400, color: "#0891b2" }),
        ...rows,
        txt("save + share with a friend who needs this", { x: 120, y: 1290, w: 840, h: 50, size: 30, font: F.hand, weight: 400, color: "#0e7490", align: "center" }),
      ]
      chrome(els, "TUTORIAL", "@yourstudio", "#0891b2")
      return doc("canvas", W, H, solid("#ecfeff"), [page("Story", solid("#ecfeff"), els)])
    },
  },
  {
    slug: "story-tutorial-steps",
    name: "3-Step Recipe — Tutorial Story",
    category: "story",
    type: "canvas",
    tags: ["story", "recipe", "tutorial", "steps"],
    width: W,
    height: H,
    build: () => {
      const steps: [string, string][] = [
        ["TOAST", "Sourdough, butter, low heat — patience."],
        ["MASH", "Avocado + lime + flaky salt. Chunky."],
        ["TOP", "Egg, chili crisp, done. 5 minutes total."],
      ]
      const rows: DesignElement[] = []
      steps.forEach(([t, d], i) => {
        const y = 520 + i * 300
        rows.push(ellipse({ x: 120, y, w: 180, h: 180, fill: "#166534" }))
        rows.push(txt(String(i + 1), { x: 120, y: y + 30, w: 180, h: 120, size: 80, font: F.display, weight: 400, color: "#ecfdf5", align: "center" }))
        rows.push(txt(t, { x: 350, y: y + 10, w: 600, h: 80, size: 56, font: F.cond, weight: 600, color: "#14532d", upper: true, ls: 3 }))
        rows.push(txt(d, { x: 352, y: y + 100, w: 620, h: 70, size: 30, weight: 400, color: "#374151", lh: 1.4 }))
        if (i < 2) rows.push(rule(200, y + 210, 4, "#bbf7d0", 90))
      })
      const els: DesignElement[] = [
        txt("5-MINUTE\nAVO TOAST", { x: 90, y: 280, w: 900, h: 220, size: 92, font: F.display, weight: 400, color: "#14532d", lh: 1.02 }),
        ...rows,
        ...pill("full recipe → link", { x: 320, y: 1480, w: 440, h: 88, fill: "#166534", size: 30, color: "#ecfdf5" }),
      ]
      chrome(els, "RECIPE OF THE DAY", "@kitchen.notes", "#166534")
      return doc("canvas", W, H, solid("#f0fdf4"), [page("Story", solid("#f0fdf4"), els)])
    },
  },
  {
    slug: "story-testimonial",
    name: "Wall of Love — Testimonial Story",
    category: "story",
    type: "canvas",
    tags: ["story", "testimonial", "review", "social proof"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 90, y: 420, w: 900, h: 560, fill: "#ffffff", r: 28, stroke: "#f9a8d4", sw: 4 }),
        txt("★★★★★", { x: 0, y: 490, w: W, h: 70, size: 48, font: F.sans, weight: 700, color: "#f59e0b", align: "center" }),
        txt("“Ordered Tuesday, arrived\nThursday, quality is unreal.\nMy go-to shop from now on.”", { x: 130, y: 590, w: 820, h: 240, size: 42, font: F.serif, weight: 700, color: "#831843", align: "center", lh: 1.4 }),
        txt("— Putri S. · verified buyer", { x: 0, y: 890, w: W, h: 50, size: 30, weight: 500, color: "#db2777", align: "center" }),
        txt("WALL OF LOVE", { x: 0, y: 240, w: W, h: 80, size: 70, font: F.display, weight: 400, color: "#831843", align: "center", ls: 6 }),
        txt("2,400+ five-star orders and counting", { x: 0, y: 1050, w: W, h: 50, size: 32, weight: 400, color: "#9d174d", align: "center" }),
        ...pill("SHOP FAVORITES", { x: 290, y: 1180, w: 500, h: 94, fill: "#db2777", size: 32, color: "#fdf2f8" }),
      ]
      els.push(img(asset("heart-big"), { x: 440, y: 1420, w: 200, h: 180 }))
      chrome(els, "REVIEWS", "@yourstudio", "#be185d")
      return doc("canvas", W, H, solid("#fdf2f8"), [page("Story", solid("#fdf2f8"), els)])
    },
  },
  {
    slug: "story-before-after",
    name: "Before & After — Story",
    category: "story",
    type: "canvas",
    tags: ["story", "before after", "transformation", "makeover"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 90, y: 480, w: 425, h: 560, fill: "#e5e7eb", r: 20 }),
        rect({ x: 565, y: 480, w: 425, h: 560, fill: "#a78bfa", r: 20 }),
        txt("BEFORE", { x: 90, y: 700, w: 425, h: 70, size: 40, font: F.mono, weight: 700, color: "#4b5563", align: "center" }),
        txt("photo / old design", { x: 90, y: 780, w: 425, h: 50, size: 24, weight: 400, color: "#6b7280", align: "center" }),
        txt("AFTER", { x: 565, y: 700, w: 425, h: 70, size: 40, font: F.mono, weight: 700, color: "#ffffff", align: "center" }),
        txt("studio · 20 minutes", { x: 565, y: 780, w: 425, h: 50, size: 24, weight: 400, color: "#ede9fe", align: "center" }),
        txt("BEFORE & AFTER", { x: 0, y: 280, w: W, h: 110, size: 90, font: F.display, weight: 400, color: "#4c1d95", align: "center", ls: 4 }),
        txt("same brand, same photo — new template,\nnew palette, new confidence.", { x: 120, y: 1130, w: 840, h: 120, size: 34, weight: 400, color: "#5b21b6", align: "center", lh: 1.5 }),
        ...pill("TRY IT FREE", { x: 320, y: 1300, w: 440, h: 92, fill: "#7c3aed", size: 32, color: "#ffffff" }),
      ]
      chrome(els, "GLOW UP", "@yourstudio", "#6d28d9")
      return doc("canvas", W, H, solid("#f5f3ff"), [page("Story", solid("#f5f3ff"), els)])
    },
  },
  {
    slug: "story-event-reminder",
    name: "Tomorrow! — Event Reminder Story",
    category: "story",
    type: "canvas",
    tags: ["story", "event", "reminder", "countdown"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 0, y: 0, w: W, h: 700, fill: "#1d4ed8", r: 0 }),
        img(asset("confetti"), { x: 90, y: 140, w: 900, h: 280, opacity: 0.85 }),
        txt("TOMORROW!", { x: 0, y: 430, w: W, h: 130, size: 120, font: F.display, weight: 400, color: "#ffffff", align: "center", ls: 6 }),
        rect({ x: 140, y: 800, w: 800, h: 440, fill: "#ffffff", r: 28, stroke: "#bfdbfe", sw: 3 }),
        txt("DESIGN\nMEETUP #7", { x: 0, y: 850, w: W, h: 220, size: 90, font: F.display, weight: 400, color: "#1e3a8a", align: "center", lh: 1.05 }),
        txt("6 PM · Kopi Kelir, Jl. Melati 12\nfree entry · 40 seats · pizza after", { x: 0, y: 1090, w: W, h: 120, size: 32, weight: 500, color: "#374151", align: "center", lh: 1.55 }),
        ...pill("REMIND ME", { x: 340, y: 1330, w: 400, h: 92, fill: "#1d4ed8", size: 32, color: "#ffffff" }),
        txt("set an alarm — last meetup filled in 2 hours", { x: 0, y: 1500, w: W, h: 44, size: 26, font: F.mono, weight: 400, color: "#64748b", align: "center" }),
      ]
      chrome(els, "COMMUNITY", "@design.meetup", "#1e40af")
      return doc("canvas", W, H, solid("#eff6ff"), [page("Story", solid("#eff6ff"), els)])
    },
  },
  {
    slug: "story-job-opening",
    name: "Join Us — Job Opening Story",
    category: "story",
    type: "canvas",
    tags: ["story", "hiring", "career", "jobs"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 90, y: 420, w: 900, h: 780, fill: "#052e16", r: 36 }),
        txt("JOIN OUR\nCREW", { x: 0, y: 520, w: W, h: 340, size: 140, font: F.display, weight: 400, color: "#a3e635", align: "center", lh: 1 }),
        txt("Barista (full-time) — Kota Bandung\nlove first, latte art second", { x: 0, y: 900, w: W, h: 120, size: 34, weight: 500, color: "#d9f99d", align: "center", lh: 1.55 }),
        ...pill("APPLY IN STORIES", { x: 320, y: 1060, w: 440, h: 92, fill: "#a3e635", size: 30, color: "#052e16" }),
        txt("perks: staff meals, weekend off, fair pay", { x: 0, y: 1220, w: W, h: 44, size: 26, font: F.mono, weight: 400, color: "#65a30d", align: "center" }),
      ]
      chrome(els, "WE'RE HIRING", "@kopikelir", "#4d7c0f")
      els.push(img(asset("coffee"), { x: 760, y: 300, w: 170, h: 170, rotation: 10 }))
      return doc("canvas", W, H, solid("#f7fee7"), [page("Story", solid("#f7fee7"), els)])
    },
  },
  {
    slug: "story-travel-diary",
    name: "Postcard — Travel Story",
    category: "story",
    type: "canvas",
    tags: ["story", "travel", "diary", "nature"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        img(asset("mountain"), { x: 0, y: 380, w: W, h: 560 }),
        rect({ x: 90, y: 1020, w: 900, h: 420, fill: "#fffbeb", r: 6, stroke: "#fde68a", sw: 3 }),
        txt("Greetings from\nthe highlands!", { x: 140, y: 1080, w: 800, h: 160, size: 54, font: F.script, weight: 700, color: "#92400e", lh: 1.3 }),
        txt("Day 3: mist until noon, the best\nnasi goreng of my life, and a\nhomestay cat named Bolt.", { x: 140, y: 1260, w: 800, h: 150, size: 30, font: F.hand, weight: 400, color: "#78350f", lh: 1.5 }),
        txt("postcard · day 3", { x: 90, y: 1480, w: 300, h: 40, size: 24, font: F.mono, weight: 400, color: "#b45309" }),
        txt("HIGHLAND\nDIARY", { x: 0, y: 210, w: W, h: 160, size: 100, font: F.display, weight: 400, color: "#f0fdf4", align: "center", ls: 8 }),
      ]
      chrome(els, "TRAVEL LOG", "@wander.journal", "#166534")
      return doc("canvas", W, H, solid("#14532d"), [page("Story", solid("#14532d"), els)])
    },
  },
  {
    slug: "story-vlog-cover",
    name: "Vlog Ep. 12 — Daily Cover Story",
    category: "story",
    type: "canvas",
    tags: ["story", "vlog", "daily", "cover"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 0, y: 640, w: W, h: 640, fill: "#0f172a", opacity: 0.85, rotation: 0 }),
        txt("VLOG", { x: 90, y: 740, w: 400, h: 160, size: 130, font: F.display, weight: 400, color: "#fde047", ls: 8 }),
        txt("EPISODE 12", { x: 94, y: 910, w: 500, h: 60, size: 40, font: F.mono, weight: 700, color: "#ffffff", ls: 6 }),
        txt("market morning →\nstudio afternoon →\nsunset badminton", { x: 90, y: 1000, w: 700, h: 220, size: 38, font: F.hand, weight: 400, color: "#e2e8f0", lh: 1.5 }),
        txt("new every saturday", { x: 90, y: 1350, w: 500, h: 44, size: 28, font: F.mono, weight: 400, color: "#94a3b8" }),
        img(asset("sun"), { x: 700, y: 250, w: 240, h: 240 }),
      ]
      chrome(els, "DAILY DIARY", "@nadia.daily", "#fde047")
      return doc("canvas", W, H, solid("#334155"), [page("Story", solid("#334155"), els)])
    },
  },
  {
    slug: "story-music-release",
    name: "Out Now — Music Release Story",
    category: "story",
    type: "canvas",
    tags: ["story", "music", "release", "promo"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 190, y: 480, w: 700, h: 700, fill: "#4c1d95", r: 24 }),
        img(asset("planet"), { x: 280, y: 640, w: 520, h: 364 }),
        txt("OUT NOW", { x: 0, y: 300, w: W, h: 80, size: 60, font: F.mono, weight: 700, color: "#c4b5fd", align: "center", ls: 12 }),
        txt("ORBIT", { x: 0, y: 1260, w: W, h: 160, size: 140, font: F.display, weight: 400, color: "#f5f3ff", align: "center", ls: 10 }),
        txt("single · 3:47 · everywhere you stream", { x: 0, y: 1440, w: W, h: 50, size: 30, weight: 400, color: "#a78bfa", align: "center" }),
        ...pill("▶ LISTEN NOW", { x: 340, y: 1560, w: 400, h: 92, fill: "#f5f3ff", size: 30, color: "#4c1d95" }),
      ]
      chrome(els, "NEW MUSIC", "@nova.sounds", "#8b5cf6")
      return doc("canvas", W, H, solid("#1e1b4b"), [page("Story", solid("#1e1b4b"), els)])
    },
  },
  {
    slug: "story-charity-drive",
    name: "Giving Back — Charity Story",
    category: "story",
    type: "canvas",
    tags: ["story", "charity", "donation", "community"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 90, y: 420, w: 900, h: 820, fill: "#fff1f2", r: 36 }),
        img(asset("heart-big"), { x: 440, y: 500, w: 200, h: 180 }),
        txt("BUY ONE,\nGIVE ONE", { x: 0, y: 730, w: W, h: 320, size: 110, font: F.display, weight: 400, color: "#9f1239", align: "center", lh: 1.05 }),
        txt("every tote sold this month sends\na school kit to a first-grader", { x: 150, y: 1080, w: 780, h: 110, size: 32, weight: 400, color: "#be123c", align: "center", lh: 1.5 }),
        ...pill("READ THE REPORT", { x: 300, y: 1220, w: 480, h: 90, fill: "#9f1239", size: 30, color: "#fff1f2" }),
        txt("137 kits given so far — updated weekly", { x: 0, y: 1500, w: W, h: 44, size: 26, font: F.mono, weight: 400, color: "#e11d48", align: "center" }),
      ]
      chrome(els, "GIVING BACK", "@paperandtwine", "#be123c")
      return doc("canvas", W, H, solid("#ffe4e6"), [page("Story", solid("#ffe4e6"), els)])
    },
  },
  {
    slug: "story-podcast-promo",
    name: "New Episode — Podcast Story",
    category: "story",
    type: "canvas",
    tags: ["story", "podcast", "audio", "promo"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 140, y: 520, w: 800, h: 800, fill: "#7c2d12", r: 32 }),
        img(asset("music-note"), { x: 560, y: 600, w: 300, h: 300, opacity: 0.9 }),
        txt("EP.042", { x: 200, y: 580, w: 300, h: 50, size: 32, font: F.mono, weight: 700, color: "#fde047", ls: 6 }),
        txt("Small brands,\nbig taste", { x: 200, y: 660, w: 620, h: 240, size: 64, font: F.serif, weight: 700, color: "#fff7ed", lh: 1.2 }),
        txt("with Rara of Kopi Kita", { x: 202, y: 920, w: 500, h: 50, size: 30, font: F.hand, weight: 400, color: "#fcd34d" }),
        txt("38 min · free on every app", { x: 0, y: 1420, w: W, h: 46, size: 30, font: F.mono, weight: 400, color: "#fb923c", align: "center" }),
        ...pill("▶ PLAY EPISODE", { x: 320, y: 1520, w: 440, h: 92, fill: "#fde047", size: 30, color: "#7c2d12" }),
      ]
      chrome(els, "TALK & TEA", "@talkandtea.fm", "#c2410c")
      return doc("canvas", W, H, solid("#431407"), [page("Story", solid("#431407"), els)])
    },
  },
  {
    slug: "story-real-estate",
    name: "Open House — Real Estate Story",
    category: "story",
    type: "canvas",
    tags: ["story", "real estate", "open house", "property"],
    width: W,
    height: H,
    build: () => {
      const els: DesignElement[] = [
        rect({ x: 90, y: 430, w: 900, h: 620, fill: "#e0f2fe", r: 24 }),
        img(asset("frame-simple"), { x: 150, y: 470, w: 780, h: 540, opacity: 0.4 }),
        txt("HOUSE PHOTO", { x: 90, y: 710, w: 900, h: 60, size: 36, font: F.mono, weight: 700, color: "#0369a1", align: "center", ls: 8 }),
        txt("OPEN HOUSE", { x: 0, y: 250, w: W, h: 100, size: 84, font: F.display, weight: 400, color: "#0c4a6e", align: "center", ls: 6 }),
        txt("SAT · 10 AM – 2 PM\nJl. Kenanga No. 8", { x: 0, y: 1140, w: W, h: 140, size: 44, font: F.cond, weight: 600, color: "#075985", align: "center", lh: 1.4 }),
        txt("3 bed · 2 bath · 180 m² · $429k", { x: 0, y: 1300, w: W, h: 50, size: 32, weight: 500, color: "#0c4a6e", align: "center" }),
        ...pill("DM FOR ADDRESS", { x: 320, y: 1400, w: 440, h: 90, fill: "#0369a1", size: 30, color: "#f0f9ff" }),
        txt("coffee & snacks on us — no pressure, just look", { x: 0, y: 1570, w: W, h: 44, size: 26, font: F.hand, weight: 400, color: "#0369a1", align: "center" }),
      ]
      chrome(els, "PROPERTY", "@sm.property", "#075985")
      return doc("canvas", W, H, solid("#f0f9ff"), [page("Story", solid("#f0f9ff"), els)])
    },
  },
]

/* ------------------------------ youtube ------------------------------ */

const youtubeTpls: TemplateSpec[] = [
  {
    slug: "yt-thumb-tech-review",
    name: "Honest Review — Tech Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "tech", "review"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid("#020617"), [
        page("Thumbnail", solid("#020617"), [
          ellipse({ x: 760, y: 90, w: 440, h: 440, fill: "#0ea5e9", opacity: 0.25 }),
          img(asset("camera"), { x: 830, y: 200, w: 340, h: 255 }),
          txt("WORTH IT?", { x: 60, y: 110, w: 660, h: 150, size: 130, font: F.display, weight: 400, color: "#f8fafc", lh: 1 }),
          txt("in 4 minutes", { x: 66, y: 280, w: 600, h: 60, size: 44, font: F.hand, weight: 400, color: "#38bdf8" }),
          rect({ x: 66, y: 400, w: 420, h: 80, fill: "#f43f5e", r: 12 }),
          txt("NOVA X2 REVIEW", { x: 66, y: 402, w: 420, h: 76, size: 32, font: F.mono, weight: 700, color: "#ffffff", align: "center", vAlign: "middle" }),
          txt("unfiltered · no sponsor", { x: 66, y: 510, w: 500, h: 40, size: 26, font: F.mono, weight: 400, color: "#64748b" }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-cooking",
    name: "15-Min Dinner — Cooking Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "cooking", "recipe"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid("#431407"), [
        page("Thumbnail", solid("#431407"), [
          img(asset("pizza"), { x: 850, y: 120, w: 340, h: 340, rotation: 10 }),
          ellipse({ x: 780, y: 60, w: 480, h: 480, fill: "#fbbf24", opacity: 0.18 }),
          txt("15-MINUTE\nDINNER!", { x: 60, y: 120, w: 720, h: 340, size: 140, font: F.marker, weight: 400, color: "#fef3c7", lh: 1.05, rotation: -2 }),
          rect({ x: 66, y: 520, w: 560, h: 90, fill: "#fbbf24", r: 45 }),
          txt("one pan · 6 ingredients", { x: 66, y: 522, w: 560, h: 86, size: 34, font: F.pop, weight: 700, color: "#431407", align: "center", vAlign: "middle" }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-finance",
    name: "Save More — Finance Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "finance", "money"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid("#052e16"), [
        page("Thumbnail", solid("#052e16"), [
          txt("$10,000", { x: 620, y: 120, w: 620, h: 200, size: 150, font: F.display, weight: 400, color: "#4ade80", align: "center" }),
          txt("in 12 months", { x: 620, y: 330, w: 620, h: 70, size: 48, font: F.pop, weight: 600, color: "#bbf7d0", align: "center" }),
          rect({ x: 700, y: 450, w: 460, h: 6, fill: "#4ade80", r: 3 }),
          txt("ON A NORMAL\nSALARY", { x: 60, y: 140, w: 560, h: 300, size: 90, font: F.cond, weight: 600, color: "#f0fdf4", lh: 1.1, upper: true }),
          txt("my exact system, no crypto", { x: 64, y: 480, w: 520, h: 60, size: 40, font: F.hand, weight: 400, color: "#4ade80" }),
          ...pill("EP. 08", { x: 64, y: 580, w: 170, h: 70, fill: "#4ade80", size: 28, color: "#052e16" }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-vlog",
    name: "Weekend Vlog — Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "vlog", "lifestyle"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid("#0c4a6e"), [
        page("Thumbnail", solid("#0c4a6e"), [
          img(asset("mountain"), { x: 0, y: 300, w: 1280, h: 420 }),
          img(asset("sun"), { x: 950, y: 60, w: 200, h: 200 }),
          rect({ x: 70, y: 90, w: 460, h: 110, fill: "#fde047", r: 12, rotation: -3 }),
          txt("SLOW VLOG ☕", { x: 70, y: 92, w: 460, h: 106, size: 48, font: F.pop, weight: 800, color: "#713f12", align: "center", vAlign: "middle" }),
          txt("rainy market morning\n& a new coffee spot", { x: 74, y: 400, w: 700, h: 160, size: 52, font: F.serif, weight: 700, color: "#ffffff", lh: 1.3 }),
          txt("ep. 12 · 22 min · no talking, just vibes", { x: 74, y: 590, w: 700, h: 40, size: 26, font: F.mono, weight: 400, color: "#bae6fd" }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-fitness",
    name: "No Gym? — Fitness Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "fitness", "workout"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid(INK), [
        page("Thumbnail", solid(INK), [
          rect({ x: 700, y: 0, w: 580, h: 720, fill: "#22c55e", rotation: 0 }),
          shp("star", { x: 1080, y: 70, w: 110, h: 110, fill: "#fde047", rotation: 18 }),
          txt("20\nMIN", { x: 820, y: 160, w: 380, h: 400, size: 170, font: F.display, weight: 400, color: INK, align: "center", lh: 0.95 }),
          txt("NO GYM.\nNO EXCUSES.", { x: 60, y: 180, w: 640, h: 320, size: 100, font: F.cond, weight: 600, color: "#f9fafb", lh: 1.08, upper: true }),
          txt("full-body · zero equipment", { x: 64, y: 530, w: 600, h: 60, size: 40, font: F.pop, weight: 600, color: "#4ade80" }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-podcast-clip",
    name: "Best Moment — Podcast Clip Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "podcast", "clip"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid("#1c1917"), [
        page("Thumbnail", solid("#1c1917"), [
          rect({ x: 70, y: 80, w: 500, h: 560, fill: "#44403c", r: 20 }),
          txt("GUEST\nPHOTO", { x: 70, y: 300, w: 500, h: 120, size: 48, font: F.mono, weight: 700, color: "#d6d3d1", align: "center" }),
          rect({ x: 640, y: 80, w: 570, h: 560, fill: "transparent", stroke: "#fbbf24", sw: 6, r: 20 }),
          txt("“WE ALMOST\nQUIT IN\nYEAR TWO”", { x: 680, y: 140, w: 500, h: 340, size: 74, font: F.display, weight: 400, color: "#fef3c7", lh: 1.08 }),
          txt("— rara, kopi kita roastery", { x: 684, y: 520, w: 500, h: 50, size: 30, font: F.hand, weight: 400, color: "#fbbf24" }),
          txt("TALK & TEA · CLIP", { x: 74, y: 660, w: 400, h: 40, size: 24, font: F.mono, weight: 400, color: "#a8a29e", ls: 4 }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-travel",
    name: "$50 Travel Day — Travel Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "travel", "budget"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, gradient("#0369a1", "#22d3ee", 135), [
        page("Thumbnail", gradient("#0369a1", "#22d3ee", 135), [
          rect({ x: 60, y: 60, w: 500, h: 170, fill: "#ffffff", r: 20, rotation: -2 }),
          txt("$50 DAY IN BALI", { x: 60, y: 62, w: 500, h: 166, size: 54, font: F.display, weight: 400, color: "#0c4a6e", align: "center", vAlign: "middle" }),
          txt("surf · food · scooter\n— everything included", { x: 70, y: 300, w: 640, h: 160, size: 44, font: F.hand, weight: 700, color: "#ffffff", lh: 1.4 }),
          img(asset("mountain"), { x: 700, y: 330, w: 520, h: 330, opacity: 0.95 }),
          img(asset("sun"), { x: 1010, y: 60, w: 160, h: 160 }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-diy",
    name: "DIY Home Upgrade — Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "diy", "home"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid("#fefce8"), [
        page("Thumbnail", solid("#fefce8"), [
          rect({ x: 640, y: 80, w: 560, h: 560, fill: "#0f766e", r: 24 }),
          img(asset("pencil"), { x: 800, y: 250, w: 240, h: 240 }),
          txt("UNDER $20!", { x: 640, y: 560, w: 560, h: 80, size: 60, font: F.display, weight: 400, color: "#fde047", align: "center", ls: 2 }),
          txt("RENTAL-\nFRIENDLY\nUPGRADES", { x: 70, y: 130, w: 560, h: 380, size: 96, font: F.cond, weight: 600, color: "#134e4a", lh: 1.08, upper: true }),
          txt("5 changes, zero drills", { x: 74, y: 540, w: 500, h: 60, size: 38, font: F.hand, weight: 400, color: "#0f766e" }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-interview",
    name: "Meet the Maker — Interview Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "interview", "story"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid("#fdf8f1"), [
        page("Thumbnail", solid("#fdf8f1"), [
          rect({ x: 720, y: 60, w: 500, h: 600, fill: "#1c1917", r: 24 }),
          ellipse({ x: 830, y: 150, w: 280, h: 280, fill: "#44403c" }),
          txt("PORTRAIT", { x: 720, y: 330, w: 500, h: 50, size: 30, font: F.mono, weight: 700, color: "#d6d3d1", align: "center", ls: 6 }),
          txt("JUNIA DEWI", { x: 720, y: 520, w: 500, h: 60, size: 44, font: F.display, weight: 400, color: "#fbbf24", align: "center", ls: 4 }),
          txt("How I draw\n600 stickers\na month", { x: 70, y: 140, w: 600, h: 340, size: 80, font: F.serif, weight: 700, color: "#1c1917", lh: 1.15 }),
          ...pill("MAKER SERIES · S02E03", { x: 74, y: 540, w: 520, h: 80, fill: "#f97316", size: 28, color: "#fff7ed" }),
        ]),
      ]),
  },
  {
    slug: "yt-thumb-top5",
    name: "Top 5 Apps — Listicle Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "listicle", "top5"],
    width: 1280,
    height: 720,
    build: () => {
      const chips = ["#f43f5e", "#f59e0b", "#22c55e", "#0ea5e9", "#a855f7"].map((c, i) => {
        const x = 620 + (i % 3) * 210
        const y = 110 + Math.floor(i / 3) * 220
        return [
          rect({ x, y, w: 180, h: 180, fill: c, r: 28 }),
          txt(String(i + 1), { x, y: y + 40, w: 180, h: 100, size: 80, font: F.display, weight: 400, color: "#ffffff", align: "center" }),
        ] as DesignElement[]
      }).flat()
      return doc("canvas", 1280, 720, solid("#18181b"), [
        page("Thumbnail", solid("#18181b"), [...chips,
          txt("TOP 5", { x: 60, y: 140, w: 520, h: 170, size: 150, font: F.display, weight: 400, color: "#fafafa", lh: 1 }),
          txt("free design apps", { x: 66, y: 330, w: 520, h: 70, size: 50, font: F.pop, weight: 700, color: "#fbbf24" }),
          txt("no watermarks — all free forever", { x: 66, y: 420, w: 520, h: 50, size: 28, font: F.mono, weight: 400, color: "#a1a1aa" }),
        ])
      ])
    },
  },
  {
    slug: "yt-banner-minimal",
    name: "Clean Minimal — YouTube Banner",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "banner", "channel", "minimal"],
    width: 2560,
    height: 1440,
    build: () =>
      doc("canvas", 2560, 1440, solid("#fafaf9"), [
        page("Banner", solid("#fafaf9"), [
          rule(0, 600, 2560, "#e7e5e4", 3),
          rule(0, 840, 2560, "#e7e5e4", 3),
          txt("the slow studio", { x: 0, y: 620, w: 2560, h: 200, size: 150, font: F.serif, weight: 700, color: "#1c1917", align: "center" }),
          txt("one quiet video every sunday — process, print & paper", { x: 0, y: 860, w: 2560, h: 60, size: 40, font: F.hand, weight: 400, color: "#78716c", align: "center" }),
          img(asset("leaf"), { x: 1180, y: 380, w: 200, h: 200 }),
        ]),
      ]),
  },
  {
    slug: "yt-end-screen",
    name: "Watch Next — YouTube End Screen",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "end screen", "outro", "subscribe"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, solid("#111827"), [
        page("End screen", solid("#111827"), [
          rect({ x: 80, y: 180, w: 340, h: 190, fill: "#374151", r: 12, dash: [10, 8] }),
          rect({ x: 80, y: 400, w: 340, h: 190, fill: "#374151", r: 12, dash: [10, 8] }),
          rect({ x: 860, y: 180, w: 340, h: 340, fill: "#374151", r: 200, dash: [10, 8] }),
          txt("next video", { x: 80, y: 250, w: 340, h: 50, size: 28, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
          txt("playlist", { x: 80, y: 470, w: 340, h: 50, size: 28, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
          txt("subscribe", { x: 860, y: 330, w: 340, h: 50, size: 28, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
          txt("THANKS FOR\nWATCHING", { x: 480, y: 260, w: 340, h: 220, size: 54, font: F.display, weight: 400, color: "#fde047", align: "center", lh: 1.15 }),
        ]),
      ]),
  },
]

export const STORIES_TPLS: TemplateSpec[] = [...saleStories, ...engagementStories, ...contentStories, ...youtubeTpls]
