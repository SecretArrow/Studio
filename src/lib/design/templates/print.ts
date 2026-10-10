/**
 * Print templates — menus, calendars, cards, invitations, labels, stickers,
 * bookmarks, kids activities.
 */
import {
  asset,
  doc,
  ellipse,
  F,
  img,
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

const A4W = 1240
const A4H = 1754
const INK = "#111827"

/* ------------------------------ menus ------------------------------ */

function menuSection(title: string, items: [string, string][], y: number, accent: string, ink: string, ruleColor: string): DesignElement[] {
  const out: DesignElement[] = [txt(title, { x: 140, y, w: 700, h: 60, size: 42, font: F.cond, weight: 600, color: accent, upper: true, ls: 4 })]
  items.forEach(([name, price], i) => {
    const iy = y + 88 + i * 66
    out.push(txt(name, { x: 140, y: iy, w: 640, h: 50, size: 30, font: F.body, weight: 500, color: ink, vAlign: "middle" }))
    out.push(txt(price, { x: 800, y: iy, w: 300, h: 50, size: 30, font: F.mono, weight: 400, color: accent, align: "right", vAlign: "middle" }))
    out.push(rule(140, iy + 52, 960, ruleColor, 3))
  })
  return out
}

const menus: TemplateSpec[] = [
  {
    slug: "menu-bakery",
    name: "Crumb & Butter — Bakery Menu",
    category: "print",
    type: "canvas",
    tags: ["menu", "bakery", "price list"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#fffbeb"), [
        page("Menu", solid("#fffbeb"), [
          img(asset("cake"), { x: 520, y: 120, w: 200, h: 200 }),
          txt("CRUMB & BUTTER", { x: 0, y: 350, w: A4W, h: 100, size: 84, font: F.script, weight: 700, color: "#92400e", align: "center" }),
          txt("baked at 5 am, gone by 3 pm", { x: 0, y: 460, w: A4W, h: 50, size: 30, font: F.hand, weight: 400, color: "#b45309", align: "center" }),
          ...menuSection("Morning", [["Butter croissant", "3.20"], ["Pain au chocolat", "3.60"], ["Cinnamon bun", "3.80"], ["Sourdough toast + jam", "4.50"]], 580, "#b45309", "#78350f", "#fde68a"),
          ...menuSection("Cake by the slice", [["Basque cheesecake", "5.50"], ["Carrot & walnut", "5.00"], ["Lemon drizzle", "4.80"]], 1010, "#b45309", "#78350f", "#fde68a"),
          ...menuSection("To drink", [["Kopi susu", "3.50"], ["Matcha latte", "4.50"], ["Hot chocolate", "4.00"]], 1420, "#b45309", "#78350f", "#fde68a"),
          txt("follow @crumbandbutter for the daily bake list", { x: 0, y: 1660, w: A4W, h: 44, size: 26, font: F.mono, weight: 400, color: "#d6d3d1", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "menu-diner",
    name: "Blue Plate — Diner Menu",
    category: "print",
    type: "canvas",
    tags: ["menu", "diner", "restaurant", "retro"],
    width: A4W,
    height: A4H,
    featured: true,
    build: () =>
      doc("canvas", A4W, A4H, solid("#eff6ff"), [
        page("Menu", solid("#eff6ff"), [
          rect({ x: 90, y: 90, w: 1060, h: 1574, fill: "#ffffff", stroke: "#1d4ed8", sw: 8, r: 8 }),
          rect({ x: 110, y: 110, w: 1020, h: 1534, fill: "transparent", stroke: "#93c5fd", sw: 3, r: 4 }),
          txt("BLUE PLATE", { x: 0, y: 180, w: A4W, h: 120, size: 100, font: F.display, weight: 400, color: "#1d4ed8", align: "center", ls: 6 }),
          txt("DINER · OPEN 7–9 DAILY", { x: 0, y: 310, w: A4W, h: 44, size: 26, font: F.mono, weight: 700, color: "#1e3a8a", align: "center", ls: 8 }),
          ...menuSection("Plates — all with fries & slaw", [["Buttermilk fried chicken", "11.50"], ["Blue-plate meatloaf", "12.00"], ["Grilled mackerel", "13.50"], ["Veg nut roast", "10.50"]], 420, "#1d4ed8", "#1e293b", "#dbeafe"),
          ...menuSection("Shakes & sodas", [["Vanilla malt", "5.50"], ["Cherry cola float", "5.00"], ["Lemon squash", "4.00"]], 940, "#1d4ed8", "#1e293b", "#dbeafe"),
          ...menuSection("Pies", [["Apple & blackcurrant", "5.50"], ["Banana cream", "5.50"], ["Chocolate silk", "6.00"]], 1290, "#1d4ed8", "#1e293b", "#dbeafe"),
          txt("ask about the blue-plate special — it changes daily", { x: 0, y: 1580, w: A4W, h: 44, size: 26, font: F.hand, weight: 400, color: "#1e3a8a", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "menu-bar-drinks",
    name: "Neon Tiger — Bar Drinks Menu",
    category: "print",
    type: "canvas",
    tags: ["menu", "bar", "drinks", "cocktails", "dark"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#0c0a09"), [
        page("Menu", solid("#0c0a09"), [
          rect({ x: 70, y: 70, w: 1100, h: 1614, fill: "transparent", stroke: "#f472b6", sw: 4, r: 20 }),
          ellipse({ x: 470, y: 120, w: 300, h: 300, fill: "#f472b6", opacity: 0.15 }),
          txt("NEON TIGER", { x: 0, y: 190, w: A4W, h: 120, size: 100, font: F.display, weight: 400, color: "#f472b6", align: "center", ls: 8 }),
          txt("cocktails · until late", { x: 0, y: 320, w: A4W, h: 50, size: 30, font: F.mono, weight: 400, color: "#a1a1aa", align: "center", ls: 6 }),
          ...menuSection("Signatures", [["Tiger old fashioned", "14"], ["Yuzu spritz", "13"], ["Smoked negroni", "14"], ["Pandan colada", "13"]], 440, "#f472b6", "#fafaf9", "#27272a"),
          ...menuSection("Low & no", [["Garden tonic", "7"], ["Grapefruit soda", "7"], ["Ginger shut-eye", "8"]], 950, "#fde047", "#fafaf9", "#27272a"),
          ...menuSection("Snacks", [["Salted edamame", "5"], ["Fries w/ sambal mayo", "6"], ["Charred corn ribs", "7"]], 1310, "#22d3ee", "#fafaf9", "#27272a"),
          txt("happy hour 5–7 · two-for-one signatures", { x: 0, y: 1620, w: A4W, h: 44, size: 26, font: F.mono, weight: 400, color: "#52525b", align: "center" }),
        ]),
      ]),
  },
]

/* ------------------------------ calendars & planners ------------------------------ */

const calendars: TemplateSpec[] = [
  {
    slug: "calendar-year-grid",
    name: "2026 Year at a Glance — Calendar",
    category: "print",
    type: "canvas",
    tags: ["calendar", "year", "2026", "planner"],
    width: A4W,
    height: A4H,
    build: () => {
      const months: [string, string][] = [
        ["JAN", "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31"],
        ["FEB", "1..28"],
      ]
      void months
      const miniCal = (label: string, x: number, y: number): DesignElement[] => {
        const days = ["M", "T", "W", "T", "F", "S", "S"]
        const cells: DesignElement[] = [
          txt(label, { x, y, w: 220, h: 44, size: 28, font: F.mono, weight: 700, color: "#7c3aed" }),
        ]
        days.forEach((d, i) => {
          cells.push(txt(d, { x: x + i * 31, y: y + 52, w: 28, h: 30, size: 18, font: F.mono, weight: 400, color: "#9ca3af" }))
        })
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 7; c++) {
            const d = r * 7 + c + 1
            cells.push(
              rect({ x: x + c * 31, y: y + 88 + r * 31, w: 27, h: 27, fill: d <= 31 ? "#f5f3ff" : "transparent", r: 4 }),
            )
          }
        }
        return cells
      }
      const els: DesignElement[] = [txt("2026", { x: 90, y: 100, w: 500, h: 180, size: 150, font: F.display, weight: 400, color: INK })]
      const labels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
      labels.forEach((m, i) => {
        const x = 90 + (i % 4) * 280
        const y = 330 + Math.floor(i / 4) * 380
        els.push(...miniCal(m, x, y))
      })
      els.push(rule(90, 1520, 1060, "#e5e7eb", 3))
      els.push(txt("print me · pin me · plan a good year", { x: 90, y: 1580, w: 1060, h: 44, size: 28, font: F.hand, weight: 400, color: "#9ca3af" }))
      els.push(shp("star", { x: 980, y: 120, w: 110, h: 110, fill: "#fde68a", rotation: 15 }))
      return doc("canvas", A4W, A4H, solid("#ffffff"), [page("Calendar", solid("#ffffff"), els)])
    },
  },
  {
    slug: "weekly-desk-planner",
    name: "My Week — Desk Planner",
    category: "print",
    type: "canvas",
    tags: ["planner", "weekly", "schedule", "organizer"],
    width: A4W,
    height: A4H,
    build: () => {
      const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
      const rows: DesignElement[] = []
      days.forEach((d, i) => {
        const y = 420 + i * 150
        rows.push(rect({ x: 90, y, w: 1060, h: 120, fill: i % 2 ? "#faf5ff" : "#ffffff", stroke: "#e9d5ff", sw: 2, r: 12 }))
        rows.push(txt(d, { x: 120, y: y + 12, w: 300, h: 50, size: 30, font: F.cond, weight: 600, color: "#7c3aed", ls: 3 }))
        rows.push(rule(120, y + 92, 1000, "#ede9fe", 2))
        rows.push(rule(120, y + 62, 1000, "#ede9fe", 2))
      })
      return doc("canvas", A4W, A4H, solid("#faf5ff"), [
        page("Planner", solid("#faf5ff"), [
          txt("MY WEEK", { x: 90, y: 110, w: 700, h: 140, size: 110, font: F.display, weight: 400, color: "#6d28d9", ls: 4 }),
          txt("week of ______ · top goal: ______________", { x: 92, y: 280, w: 900, h: 60, size: 32, font: F.hand, weight: 400, color: "#7c3aed" }),
          ...rows,
          txt("little wins this week:", { x: 90, y: 1520, w: 400, h: 50, size: 30, font: F.hand, weight: 700, color: "#6d28d9" }),
          rule(90, 1600, 1060, "#ede9fe", 3),
          rule(90, 1670, 1060, "#ede9fe", 3),
        ]),
      ])
    },
  },
]

/* ------------------------------ cards & invitations ------------------------------ */

const cards: TemplateSpec[] = [
  {
    slug: "card-thank-you",
    name: "Thank You — Folded Card",
    category: "print",
    type: "canvas",
    tags: ["card", "thank you", "gratitude"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, solid("#f0fdf4"), [
        page("Card", solid("#f0fdf4"), [
          rect({ x: 75, y: 75, w: 900, h: 1350, fill: "#ffffff", stroke: "#059669", sw: 3, r: 16 }),
          img(asset("flower"), { x: 435, y: 220, w: 180, h: 180 }),
          txt("thank you", { x: 0, y: 470, w: 1050, h: 140, size: 110, font: F.script, weight: 700, color: "#065f46", align: "center" }),
          rule(440, 640, 170, "#34d399", 6),
          txt("your kindness made our week —\ntruly, thank you for thinking of us.", { x: 140, y: 720, w: 770, h: 160, size: 36, font: F.serif, weight: 400, italic: true, color: "#064e3b", align: "center", lh: 1.6 }),
          txt("with love,\nthe green team", { x: 0, y: 1080, w: 1050, h: 140, size: 40, font: F.hand, weight: 400, color: "#047857", align: "center", lh: 1.5 }),
        ]),
      ]),
  },
  {
    slug: "card-birthday-cake",
    name: "Birthday — Greeting Card",
    category: "print",
    type: "canvas",
    tags: ["card", "birthday", "greeting"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, solid("#fdf2f8"), [
        page("Card", solid("#fdf2f8"), [
          img(asset("confetti"), { x: 60, y: 90, w: 930, h: 280 }),
          img(asset("cake"), { x: 375, y: 400, w: 300, h: 300 }),
          txt("HAPPY\nBIRTHDAY", { x: 0, y: 740, w: 1050, h: 300, size: 120, font: F.display, weight: 400, color: "#be185d", align: "center", lh: 1.02 }),
          txt("another year of being absolutely\nunforgettable — celebrate loudly.", { x: 120, y: 1080, w: 810, h: 140, size: 34, font: F.hand, weight: 400, color: "#9d174d", align: "center", lh: 1.55 }),
          ...pill("MAKE A WISH", { x: 340, y: 1280, w: 370, h: 84, fill: "#be185d", size: 28, color: "#fdf2f8" }),
        ]),
      ]),
  },
  {
    slug: "postcard-greetings",
    name: "Wish You Were Here — Postcard",
    category: "print",
    type: "canvas",
    tags: ["postcard", "travel", "greetings"],
    width: 1500,
    height: 1050,
    build: () =>
      doc("canvas", 1500, 1050, solid("#fff7ed"), [
        page("Postcard", solid("#fff7ed"), [
          rect({ x: 60, y: 60, w: 640, h: 930, fill: "#7dd3fc", r: 12 }),
          img(asset("mountain"), { x: 60, y: 590, w: 640, h: 400 }),
          img(asset("sun"), { x: 420, y: 130, w: 180, h: 180 }),
          txt("wish you\nwere here", { x: 90, y: 260, w: 560, h: 220, size: 72, font: F.script, weight: 700, color: "#ffffff", lh: 1.2 }),
          rule(790, 200, 620, "#fdba74", 3),
          txt("dear you,", { x: 790, y: 240, w: 600, h: 50, size: 34, font: F.hand, weight: 700, color: "#9a3412" }),
          txt("the mountains are impossibly\ntall and the coffee is impossibly\ngood. we found a cat at the\ntop of the trail. 10/10.", { x: 790, y: 310, w: 620, h: 260, size: 30, font: F.hand, weight: 400, color: "#7c2d12", lh: 1.6 }),
          ellipse({ x: 1120, y: 640, w: 250, h: 250, fill: "transparent", stroke: "#d97706", sw: 4, dash: [6, 8] }),
          txt("STAMP", { x: 1120, y: 730, w: 250, h: 60, size: 30, font: F.mono, weight: 400, color: "#d97706", align: "center" }),
          txt("to: everyone back home\n123 memory lane", { x: 790, y: 680, w: 300, h: 140, size: 26, font: F.mono, weight: 400, color: "#9a3412", lh: 1.6 }),
          txt("P.S. bringing back snacks", { x: 790, y: 900, w: 600, h: 44, size: 26, font: F.hand, weight: 400, color: "#c2410c" }),
        ]),
      ]),
  },
  {
    slug: "invitation-graduation-party",
    name: "Class of 2026 — Graduation Party",
    category: "event",
    type: "canvas",
    tags: ["invitation", "graduation", "party", "school"],
    width: 1050,
    height: 1500,
    featured: true,
    build: () =>
      doc("canvas", 1050, 1500, solid("#f5f3ff"), [
        page("Invitation", solid("#f5f3ff"), [
          img(asset("grad-cap"), { x: 390, y: 200, w: 270, h: 202 }),
          txt("CLASS OF 2026", { x: 0, y: 450, w: 1050, h: 60, size: 36, font: F.mono, weight: 700, color: "#7c3aed", align: "center", ls: 10 }),
          txt("GRADUATION\nPARTY", { x: 0, y: 540, w: 1050, h: 340, size: 120, font: F.serif, weight: 700, color: "#1e1b4b", align: "center", lh: 1.15 }),
          txt("celebrating Maya Lindholm", { x: 0, y: 900, w: 1050, h: 70, size: 44, font: F.script, weight: 400, color: "#7c3aed", align: "center" }),
          rect({ x: 250, y: 1020, w: 550, h: 220, fill: "#ffffff", r: 20, stroke: "#c4b5fd", sw: 3 }),
          txt("SAT · JUNE 27 · 4 PM\nAurora Hall, Elm Street 9\ndinner, speeches, dancing", { x: 250, y: 1050, w: 550, h: 170, size: 30, weight: 500, color: "#312e81", align: "center", lh: 1.7 }),
          txt("RSVP jun 10 · maya-grad@postbox.test", { x: 0, y: 1330, w: 1050, h: 44, size: 26, font: F.mono, weight: 400, color: "#7c3aed", align: "center" }),
          img(asset("sparkle"), { x: 130, y: 180, w: 120, h: 120 }),
          img(asset("sparkle-small"), { x: 800, y: 1240, w: 120, h: 120 }),
        ]),
      ]),
  },
  {
    slug: "invitation-housewarming",
    name: "New Nest — Housewarming Invitation",
    category: "event",
    type: "canvas",
    tags: ["invitation", "housewarming", "home", "party"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, solid("#ecfdf5"), [
        page("Invitation", solid("#ecfdf5"), [
          rect({ x: 70, y: 70, w: 910, h: 1360, fill: "#ffffff", stroke: "#059669", sw: 3, r: 20 }),
          img(asset("leaf"), { x: 440, y: 170, w: 170, h: 170 }),
          txt("NEW NEST", { x: 0, y: 390, w: 1050, h: 90, size: 70, font: F.cond, weight: 600, color: "#047857", align: "center", ls: 10 }),
          txt("housewarming", { x: 0, y: 490, w: 1050, h: 90, size: 64, font: F.script, weight: 400, color: "#10b981", align: "center" }),
          txt("We finally have a roof, a garden\nand exactly one wobbly shelf —\ncome see it all.", { x: 140, y: 620, w: 770, h: 200, size: 32, font: F.serif, weight: 400, italic: true, color: "#065f46", align: "center", lh: 1.7 }),
          txt("SUN · MAY 3 · FROM 2 PM\n14 Fern Lane · bring nothing\nbut yourself", { x: 0, y: 880, w: 1050, h: 220, size: 34, weight: 600, color: "#064e3b", align: "center", lh: 1.8 }),
          ...pill("RSVP BY APR 20", { x: 320, y: 1180, w: 410, h: 84, fill: "#047857", size: 28, color: "#ecfdf5" }),
          txt("dana & sam · 555-0164", { x: 0, y: 1330, w: 1050, h: 40, size: 24, font: F.mono, weight: 400, color: "#059669", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "invitation-engagement",
    name: "She Said Yes — Engagement Invitation",
    category: "event",
    type: "canvas",
    tags: ["invitation", "engagement", "party", "elegant"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, solid("#fff1f2"), [
        page("Invitation", solid("#fff1f2"), [
          rect({ x: 60, y: 60, w: 930, h: 1380, fill: "#ffffff", stroke: "#e11d48", sw: 3, r: 24 }),
          img(asset("heart-big"), { x: 445, y: 170, w: 160, h: 144 }),
          txt("she said yes!", { x: 0, y: 370, w: 1050, h: 100, size: 72, font: F.script, weight: 700, color: "#e11d48", align: "center" }),
          txt("ENGAGEMENT\nPARTY", { x: 0, y: 500, w: 1050, h: 300, size: 110, font: F.serif, weight: 700, color: "#881337", align: "center", lh: 1.15 }),
          rule(455, 850, 140, "#fb7185", 5),
          txt("SAT · AUG 15 · 6 PM\nThe Orchard House\n16 Willow Way", { x: 0, y: 920, w: 1050, h: 220, size: 34, weight: 500, color: "#9f1239", align: "center", lh: 1.8 }),
          txt("dinner & dancing · dress: garden chic", { x: 0, y: 1180, w: 1050, h: 50, size: 28, font: F.body, weight: 400, color: "#be123c", align: "center" }),
          txt("rsvp by jul 25 · rara-sam@postbox.test", { x: 0, y: 1330, w: 1050, h: 44, size: 24, font: F.mono, weight: 400, color: "#fb7185", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "invitation-baby-shower",
    name: "Welcome Little One — Baby Shower",
    category: "event",
    type: "canvas",
    tags: ["invitation", "baby shower", "kids", "soft"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, solid("#f0f9ff"), [
        page("Invitation", solid("#f0f9ff"), [
          img(asset("cloud"), { x: 100, y: 140, w: 280, h: 182 }),
          img(asset("moon"), { x: 760, y: 120, w: 150, h: 150 }),
          txt("welcome\nlittle one", { x: 0, y: 420, w: 1050, h: 280, size: 110, font: F.script, weight: 700, color: "#0369a1", align: "center", lh: 1.2 }),
          txt("A BABY SHOWER FOR", { x: 0, y: 740, w: 1050, h: 50, size: 28, font: F.mono, weight: 700, color: "#075985", align: "center", ls: 8 }),
          txt("Dinda & Bimo", { x: 0, y: 800, w: 1050, h: 110, size: 80, font: F.serif, weight: 700, color: "#0c4a6e", align: "center" }),
          txt("SAT · SEP 12 · 10 AM\nBluebird Café garden · games,\ncake and one tiny wardrobe", { x: 0, y: 950, w: 1050, h: 180, size: 32, weight: 500, color: "#075985", align: "center", lh: 1.8 }),
          ...pill("RSVP THE MOM-TO-BE", { x: 280, y: 1190, w: 490, h: 86, fill: "#0369a1", size: 26, color: "#f0f9ff" }),
          txt("registry: tinythings.example/dindabimo", { x: 0, y: 1350, w: 1050, h: 44, size: 24, font: F.mono, weight: 400, color: "#0284c7", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "raffle-ticket",
    name: "Lucky Draw — Raffle Ticket",
    category: "event",
    type: "canvas",
    tags: ["ticket", "raffle", "print", "event"],
    width: 1050,
    height: 600,
    build: () =>
      doc("canvas", 1050, 600, solid("#fdf2f8"), [
        page("Ticket", solid("#fdf2f8"), [
          rect({ x: 30, y: 30, w: 990, h: 540, fill: "#be123c", r: 24 }),
          rect({ x: 770, y: 55, w: 4, h: 490, fill: "transparent", stroke: "#fda4af", sw: 4, dash: [16, 14], r: 0 }),
          txt("CHARITY RAFFLE", { x: 80, y: 90, w: 600, h: 50, size: 28, font: F.mono, weight: 700, color: "#fecdd3", ls: 6 }),
          txt("LUCKY DRAW", { x: 76, y: 150, w: 640, h: 110, size: 80, font: F.display, weight: 400, color: "#ffffff", ls: 3 }),
          txt("1st prize: weekend stay for two\n2nd: $100 gift card · 3rd: hamper", { x: 80, y: 290, w: 640, h: 110, size: 26, weight: 400, color: "#ffe4e6", lh: 1.7 }),
          ...pill("DRAW: AUG 30 · 8 PM", { x: 80, y: 430, w: 420, h: 76, fill: "#fde047", size: 26, color: "#881337" }),
          txt("№\n0042", { x: 800, y: 200, w: 170, h: 130, size: 40, font: F.mono, weight: 700, color: "#fde047", align: "center", lh: 1.3 }),
          txt("keep this stub", { x: 780, y: 490, w: 220, h: 36, size: 18, font: F.mono, weight: 400, color: "#fecdd3", align: "center", ls: 2 }),
        ]),
      ]),
  },
  {
    slug: "event-program",
    name: "Order of the Day — Event Program",
    category: "event",
    type: "canvas",
    tags: ["program", "wedding", "event", "schedule"],
    width: 1050,
    height: 1500,
    build: () => {
      const rows: [string, string][] = [
        ["3:00 PM", "guests arrive"],
        ["3:30 PM", "ceremony"],
        ["4:15 PM", "photos & mocktails"],
        ["5:30 PM", "dinner is served"],
        ["7:00 PM", "toasts & speeches"],
        ["8:00 PM", "first dance"],
        ["9:00 PM", "party!!"],
      ]
      const list = vstack(
        150,
        520,
        0,
        rows.map(([time, what]) =>
          txt(`${time}   —   ${what}`, { x: 150, y: 0, w: 750, h: 90, size: 32, font: F.body, weight: 500, color: "#78350f", vAlign: "middle" }),
        ),
      )
      const seps: DesignElement[] = []
      for (let i = 1; i < rows.length; i++) seps.push(rule(150, 520 + i * 90, 750, "#fde68a", 2))
      return doc("canvas", 1050, 1500, solid("#fffbeb"), [
        page("Program", solid("#fffbeb"), [
          rect({ x: 60, y: 60, w: 930, h: 1380, fill: "#ffffff", stroke: "#f59e0b", sw: 3, r: 16 }),
          img(asset("flower"), { x: 450, y: 130, w: 150, h: 150 }),
          txt("ORDER OF THE DAY", { x: 0, y: 330, w: 1050, h: 70, size: 52, font: F.serif, weight: 700, color: "#78350f", align: "center", ls: 6 }),
          txt("emma & noah · june 22 · the rose garden", { x: 0, y: 420, w: 1050, h: 50, size: 26, font: F.mono, weight: 400, color: "#b45309", align: "center", ls: 3 }),
          ...list,
          ...seps,
          txt("confetti station by the door — you know what to do", { x: 0, y: 1330, w: 1050, h: 50, size: 26, font: F.hand, weight: 400, color: "#92400e", align: "center" }),
        ]),
      ])
    },
  },
  {
    slug: "seating-chart",
    name: "Find Your Seat — Seating Chart",
    category: "event",
    type: "canvas",
    tags: ["seating", "chart", "wedding", "event"],
    width: 1080,
    height: 1350,
    build: () => {
      const tables: [string, string][] = [
        ["1", "Adi, Bella, Chen, Dewi"],
        ["2", "Eka, Fajar, Gita, Hana"],
        ["3", "Indra, Juleha, Kiki, Lala"],
        ["4", "Momo, Nia, Okto, Putri"],
        ["5", "Qori, Rara, Sari, Tono"],
        ["6", "Umar, Vina, Wawan, Yani"],
      ]
      const cells: DesignElement[] = tables.flatMap(([n, names], i) => {
        const x = 90 + (i % 2) * 460
        const y = 480 + Math.floor(i / 2) * 250
        return [
          rect({ x, y, w: 400, h: 210, fill: "#faf5ff", stroke: "#d8b4fe", sw: 3, r: 16 }),
          ellipse({ x: x + 20, y: y + 20, w: 64, h: 64, fill: "#7c3aed" }),
          txt(n, { x: x + 20, y: y + 22, w: 64, h: 60, size: 30, font: F.display, weight: 400, color: "#ffffff", align: "center", vAlign: "middle" }),
          txt(names, { x: x + 24, y: y + 100, w: 350, h: 90, size: 26, weight: 500, color: "#4c1d95", lh: 1.45 }),
        ] as DesignElement[]
      })
      return doc("canvas", 1080, 1350, solid("#ffffff"), [
        page("Seating", solid("#ffffff"), [
          txt("FIND YOUR SEAT", { x: 0, y: 130, w: 1080, h: 110, size: 90, font: F.display, weight: 400, color: "#581c87", align: "center", ls: 4 }),
          txt("emma & noah · june 22, 2026", { x: 0, y: 260, w: 1080, h: 50, size: 28, font: F.mono, weight: 400, color: "#a78bfa", align: "center", ls: 4 }),
          txt("kids' table is table 6 — crayons provided", { x: 0, y: 340, w: 1080, h: 44, size: 26, font: F.hand, weight: 400, color: "#7c3aed", align: "center" }),
          ...cells,
          ...pill("WELCOME!", { x: 415, y: 1230, w: 250, h: 76, fill: "#7c3aed", size: 28, color: "#ffffff" }),
        ]),
      ])
    },
  },
]

/* ------------------------------ labels & stickers ------------------------------ */

const labels: TemplateSpec[] = [
  {
    slug: "label-jam-jar",
    name: "Strawberry Jam — Jar Label",
    category: "print",
    type: "canvas",
    tags: ["label", "jam", "jar", "kitchen", "handmade"],
    width: 800,
    height: 800,
    build: () =>
      doc("canvas", 800, 800, solid("#fdf2f8"), [
        page("Label", solid("#fdf2f8"), [
          ellipse({ x: 100, y: 100, w: 600, h: 600, fill: "#ffffff", stroke: "#be123c", sw: 8 }),
          ellipse({ x: 130, y: 130, w: 540, h: 540, fill: "transparent", stroke: "#fda4af", sw: 3, dash: [6, 10] }),
          img(asset("flower"), { x: 330, y: 160, w: 140, h: 140 }),
          txt("STRAWBERRY", { x: 100, y: 340, w: 600, h: 60, size: 44, font: F.mono, weight: 700, color: "#9f1239", align: "center", ls: 6 }),
          txt("JAM", { x: 100, y: 400, w: 600, h: 110, size: 90, font: F.display, weight: 400, color: "#be123c", align: "center", ls: 8 }),
          txt("small batch · june 2026", { x: 100, y: 520, w: 600, h: 44, size: 26, font: F.script, weight: 400, color: "#9f1239", align: "center" }),
          txt("made in a tiny kitchen with\nmore love than sense", { x: 150, y: 570, w: 500, h: 90, size: 22, font: F.hand, weight: 400, color: "#be123c", align: "center", lh: 1.5 }),
        ]),
      ]),
  },
  {
    slug: "label-product-simple",
    name: "Pure Soap — Product Label",
    category: "print",
    type: "canvas",
    tags: ["label", "product", "cosmetics", "minimal"],
    width: 600,
    height: 1200,
    build: () =>
      doc("canvas", 600, 1200, solid("#ffffff"), [
        page("Label", solid("#ffffff"), [
          rect({ x: 30, y: 30, w: 540, h: 1140, fill: "#fafaf9", stroke: "#e7e5e4", sw: 3, r: 12 }),
          img(asset("leaf"), { x: 230, y: 120, w: 140, h: 140 }),
          txt("PURE", { x: 0, y: 300, w: 600, h: 90, size: 80, font: F.serif, weight: 700, color: INK, align: "center", ls: 10 }),
          txt("olive oil soap", { x: 0, y: 400, w: 600, h: 50, size: 30, font: F.script, weight: 400, color: "#059669", align: "center" }),
          rule(200, 500, 200, "#d6d3d1", 3),
          txt("cold-pressed olive oil,\ngoat milk and nothing else.\n120 g — hand-cut.", { x: 90, y: 560, w: 420, h: 200, size: 24, font: F.body, weight: 400, color: "#57534e", align: "center", lh: 1.7 }),
          txt("batch 042 · olive + lavender", { x: 0, y: 830, w: 600, h: 40, size: 22, font: F.mono, weight: 400, color: "#a8a29e", align: "center" }),
          txt("saponified in small pots\nsince 2024", { x: 0, y: 1050, w: 600, h: 80, size: 20, font: F.mono, weight: 400, color: "#d6d3d1", align: "center", lh: 1.6 }),
        ]),
      ]),
  },
  {
    slug: "stickers-faces",
    name: "Good Mood — Faces Sticker Sheet",
    category: "print",
    type: "canvas",
    tags: ["sticker", "faces", "kids", "fun"],
    width: 600,
    height: 600,
    build: () => {
      const faces: DesignElement[] = []
      const cols = ["#fde047", "#f9a8d4", "#a5b4fc", "#86efac"]
      const mouths = ["smile!", "yay", "ok", "zZZ"]
      faces.push(rect({ x: 20, y: 20, w: 560, h: 560, fill: "transparent", stroke: "#e5e7eb", sw: 3, r: 20, dash: [14, 10] }))
      for (let i = 0; i < 4; i++) {
        const x = 60 + (i % 2) * 260
        const y = 60 + Math.floor(i / 2) * 260
        faces.push(ellipse({ x, y, w: 200, h: 200, fill: cols[i] }))
        faces.push(ellipse({ x: x + 55, y: y + 65, w: 22, h: 30, fill: INK }))
        faces.push(ellipse({ x: x + 123, y: y + 65, w: 22, h: 30, fill: INK }))
        faces.push(txt(mouths[i], { x, y: y + 118, w: 200, h: 50, size: 26, font: F.hand, weight: 700, color: INK, align: "center" }))
      }
      return doc("canvas", 600, 600, solid("#ffffff"), [page("Stickers", solid("#ffffff"), faces)])
    },
  },
  {
    slug: "stickers-planner",
    name: "Get It Done — Planner Sticker Sheet",
    category: "print",
    type: "canvas",
    tags: ["sticker", "planner", "productivity"],
    width: 600,
    height: 900,
    build: () => {
      const chips: [string, string][] = [
        ["DEADLINE", "#ef4444"], ["DONE ✓", "#22c55e"], ["IDEA", "#a855f7"],
        ["MEETING", "#0ea5e9"], ["SELF CARE", "#f472b6"], ["URGENT!!", "#f97316"],
      ]
      const els: DesignElement[] = [rect({ x: 20, y: 20, w: 560, h: 860, fill: "transparent", stroke: "#e5e7eb", sw: 3, r: 20, dash: [14, 10] })]
      chips.forEach(([label, color], i) => {
        const x = 50 + (i % 2) * 265
        const y = 60 + Math.floor(i / 2) * 130
        els.push(rect({ x, y, w: 230, h: 90, fill: color, r: 45, rotation: i % 2 ? 2 : -2 }))
        els.push(txt(label, { x, y, w: 230, h: 90, size: 28, font: F.mono, weight: 700, color: "#ffffff", align: "center", vAlign: "middle" }))
      })
      els.push(txt("for planners, journals & fridges", { x: 0, y: 700, w: 600, h: 44, size: 24, font: F.hand, weight: 400, color: "#6b7280", align: "center" }))
      els.push(img(asset("sparkle"), { x: 250, y: 750, w: 100, h: 100 }))
      return doc("canvas", 600, 900, solid("#ffffff"), [page("Stickers", solid("#ffffff"), els)])
    },
  },
  {
    slug: "bookmark-reading",
    name: "One More Chapter — Bookmark",
    category: "print",
    type: "canvas",
    tags: ["bookmark", "reading", "books", "print"],
    width: 500,
    height: 1500,
    build: () =>
      doc("canvas", 500, 1500, solid("#f5f3ff"), [
        page("Bookmark", solid("#f5f3ff"), [
          rect({ x: 30, y: 30, w: 440, h: 1440, fill: "#ffffff", stroke: "#a78bfa", sw: 4, r: 12 }),
          img(asset("book-open"), { x: 150, y: 140, w: 200, h: 150 }),
          txt("one more\nchapter", { x: 0, y: 340, w: 500, h: 220, size: 66, font: F.script, weight: 700, color: "#6d28d9", align: "center", lh: 1.2 }),
          rule(180, 610, 140, "#c4b5fd", 5),
          txt("“A reader lives a\nthousand lives\nbefore he dies.”", { x: 60, y: 680, w: 380, h: 280, size: 32, font: F.serif, weight: 400, italic: true, color: "#4c1d95", align: "center", lh: 1.55 }),
          txt("— george r.r. martin", { x: 0, y: 990, w: 500, h: 44, size: 22, font: F.mono, weight: 400, color: "#a78bfa", align: "center" }),
          img(asset("starburst"), { x: 175, y: 1150, w: 150, h: 150, opacity: 0.9 }),
          txt("cut · laminate · read", { x: 0, y: 1400, w: 500, h: 40, size: 20, font: F.mono, weight: 400, color: "#c4b5fd", align: "center", ls: 4 }),
        ]),
      ]),
  },
]

/* ------------------------------ kids & education print ------------------------------ */

const kids: TemplateSpec[] = [
  {
    slug: "coloring-page-robot",
    name: "Color Me — Robot Coloring Page",
    category: "education",
    type: "canvas",
    tags: ["coloring", "kids", "robot", "activity"],
    width: A4W,
    height: A4H,
    build: () => {
      const S = "#111827"
      const els: DesignElement[] = [
        txt("COLOR ME!", { x: 0, y: 100, w: A4W, h: 90, size: 64, font: F.marker, weight: 400, color: S, align: "center" }),
        rect({ x: 380, y: 260, w: 480, h: 380, fill: "#ffffff", stroke: S, sw: 10, r: 40 }),
        ellipse({ x: 430, y: 320, w: 80, h: 80, fill: "#ffffff", stroke: S, sw: 8 }),
        ellipse({ x: 730, y: 320, w: 80, h: 80, fill: "#ffffff", stroke: S, sw: 8 }),
        rule(500, 430, 240, S, 10),
        rule(450, 520, 340, S, 8),
        rule(560, 160, 120, S, 10),
        ellipse({ x: 545, y: 90, w: 50, h: 50, fill: "#ffffff", stroke: S, sw: 8 }),
        rule(300, 640, 640, S, 10),
        rule(360, 700, 520, S, 10),
        rect({ x: 300, y: 700, w: 120, h: 120, fill: "#ffffff", stroke: S, sw: 8, r: 16 }),
        rect({ x: 820, y: 700, w: 120, h: 120, fill: "#ffffff", stroke: S, sw: 8, r: 16 }),
        rule(360, 890, 60, S, 10),
        rule(820, 890, 60, S, 10),
        rule(300, 900, 640, S, 10),
        txt("name: ____________  age: ____", { x: 0, y: 1560, w: A4W, h: 50, size: 28, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
        txt("free to print from studio templates", { x: 0, y: 1640, w: A4W, h: 40, size: 22, font: F.mono, weight: 400, color: "#d1d5db", align: "center" }),
      ]
      return doc("canvas", A4W, A4H, solid("#ffffff"), [page("Coloring", solid("#ffffff"), els)])
    },
  },
  {
    slug: "placemat-animals",
    name: "Snack Time — Kids Placemat",
    category: "print",
    type: "canvas",
    tags: ["placemat", "kids", "activity", "animals"],
    width: 1500,
    height: 1050,
    build: () =>
      doc("canvas", 1500, 1050, solid("#fff7ed"), [
        page("Placemat", solid("#fff7ed"), [
          rect({ x: 40, y: 40, w: 1420, h: 970, fill: "#ffffff", stroke: "#f97316", sw: 6, r: 24, dash: [20, 14] }),
          txt("SNACK TIME!", { x: 0, y: 80, w: 1500, h: 80, size: 60, font: F.marker, weight: 400, color: "#c2410c", align: "center" }),
          txt("find 5 hidden stars · color the fruits · write your name", { x: 0, y: 170, w: 1500, h: 44, size: 26, font: F.hand, weight: 400, color: "#9a3412", align: "center" }),
          ellipse({ x: 130, y: 300, w: 300, h: 300, fill: "#fef3c7", stroke: "#f59e0b", sw: 6 }),
          txt("orange", { x: 130, y: 400, w: 300, h: 60, size: 34, font: F.hand, weight: 400, color: "#b45309", align: "center" }),
          ellipse({ x: 480, y: 300, w: 300, h: 300, fill: "#ecfccb", stroke: "#84cc16", sw: 6 }),
          txt("apple", { x: 480, y: 400, w: 300, h: 60, size: 34, font: F.hand, weight: 400, color: "#3f6212", align: "center" }),
          ellipse({ x: 830, y: 300, w: 300, h: 300, fill: "#fce7f3", stroke: "#ec4899", sw: 6 }),
          txt("banana", { x: 830, y: 400, w: 300, h: 60, size: 34, font: F.hand, weight: 400, color: "#9d174d", align: "center" }),
          shp("star", { x: 1220, y: 320, w: 70, h: 70, fill: "transparent", stroke: "#f59e0b", sw: 6 }),
          shp("star", { x: 1300, y: 480, w: 50, h: 50, fill: "transparent", stroke: "#f59e0b", sw: 6 }),
          shp("star", { x: 1200, y: 560, w: 40, h: 40, fill: "#f59e0b" }),
          txt("name: ______________________", { x: 0, y: 720, w: 1500, h: 60, size: 34, font: F.mono, weight: 400, color: "#78716c", align: "center" }),
          txt("stars found: ☐ ☐ ☐ ☐ ☐", { x: 0, y: 810, w: 1500, h: 60, size: 34, font: F.mono, weight: 400, color: "#78716c", align: "center" }),
          txt("print · laminate · repeat", { x: 0, y: 940, w: 1500, h: 40, size: 22, font: F.mono, weight: 400, color: "#d6d3d1", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "door-hanger-quiet",
    name: "Shhh — Recording Door Hanger",
    category: "print",
    type: "canvas",
    tags: ["door hanger", "office", "fun", "print"],
    width: 600,
    height: 1400,
    build: () => {
      const els: DesignElement[] = [
        ellipse({ x: 150, y: 70, w: 300, h: 300, fill: "transparent" }),
        rect({ x: 40, y: 300, w: 520, h: 1050, fill: "#111827", r: 24 }),
        txt("SHHH…", { x: 0, y: 420, w: 600, h: 110, size: 84, font: F.display, weight: 400, color: "#fde047", align: "center", ls: 4 }),
        txt("RECORDING\nIN PROGRESS", { x: 0, y: 560, w: 600, h: 220, size: 54, font: F.cond, weight: 600, color: "#ffffff", align: "center", lh: 1.2 }),
        rule(200, 820, 200, "#fde047", 5),
        txt("whisper-level quiet appreciated", { x: 0, y: 860, w: 600, h: 50, size: 26, font: F.hand, weight: 400, color: "#9ca3af", align: "center" }),
        ...pill("COME BACK AT 5", { x: 120, y: 1000, w: 360, h: 84, fill: "#fde047", size: 26, color: INK }),
        txt("flip for: knock anyway", { x: 0, y: 1180, w: 600, h: 44, size: 24, font: F.mono, weight: 400, color: "#6b7280", align: "center" }),
      ]
      return doc("canvas", 600, 1400, solid("#f9fafb"), [page("Hanger", solid("#f9fafb"), els)])
    },
  },
]

export const PRINT_TPLS: TemplateSpec[] = [...menus, ...calendars, ...cards, ...labels, ...kids]
