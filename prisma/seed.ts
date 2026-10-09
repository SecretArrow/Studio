/**
 * Seed script — demo accounts + starter templates (original CC0 content).
 * Run: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

interface TplSpec {
  slug: string
  name: string
  category: string
  type: string
  tags: string[]
  width: number
  height: number
  featured?: boolean
  build: () => object
}

const V = "#7c3aed"
const CREAM = "#fdf8f1"

function el(type: string, props: Record<string, unknown>) {
  return { id: `t_${Math.random().toString(36).slice(2, 10)}`, type, rotation: 0, opacity: 1, ...props }
}

function bg(color: string) {
  return { type: "solid", color }
}

function doc(width: number, height: number, bgc: string, elements: object[]) {
  return {
    schemaVersion: 1,
    type: "canvas",
    width,
    height,
    background: bg(bgc),
    pages: [{ id: "p1", name: "Page 1", background: bg(bgc), elements, notes: "", transition: "none", durationMs: 5000 }],
  }
}

const TEMPLATES: TplSpec[] = [
  {
    slug: "neon-sale-post", name: "Neon Sale — Instagram Post", category: "social", type: "canvas",
    tags: ["sale", "instagram", "promo"], width: 1080, height: 1080, featured: true,
    build: () =>
      doc(1080, 1080, "#111827", [
        el("shape", { variant: "rect", x: 80, y: 80, width: 920, height: 920, fill: V, cornerRadius: 48 }),
        el("text", { text: "MEGA\nSALE", x: 140, y: 300, width: 800, height: 360, fontFamily: "Bebas Neue", fontSize: 260, fontWeight: 400, color: "#ffffff", align: "left", lineHeight: 0.95, letterSpacing: 4 }),
        el("text", { text: "UP TO 70% OFF EVERYTHING", x: 150, y: 700, width: 780, height: 60, fontFamily: "Poppins", fontSize: 44, fontWeight: 600, color: "#fde68a", align: "left", lineHeight: 1.2 }),
        el("text", { text: "This weekend only · Use code STUDIO70", x: 150, y: 790, width: 780, height: 50, fontFamily: "Inter", fontSize: 30, fontWeight: 400, color: "#c4b5fd", align: "left", lineHeight: 1.2 }),
        el("shape", { variant: "ellipse", x: 700, y: 130, width: 200, height: 200, fill: "#f59e0b" }),
        el("text", { text: "-70%", x: 730, y: 195, width: 150, height: 70, fontFamily: "Bebas Neue", fontSize: 64, fontWeight: 400, color: "#111827", align: "center", lineHeight: 1 }),
      ]),
  },
  {
    slug: "minimal-quote-story", name: "Minimal Quote — Story", category: "story", type: "canvas",
    tags: ["quote", "story", "minimal"], width: 1080, height: 1920, featured: true,
    build: () =>
      doc(1080, 1920, CREAM, [
        el("text", { text: "“Design is\nthinking made\nvisual.”", x: 120, y: 640, width: 840, height: 480, fontFamily: "Playfair Display", fontSize: 110, fontWeight: 700, color: "#1f2937", align: "left", lineHeight: 1.15 }),
        el("text", { text: "— ALFRED NORTH WHITEHEAD", x: 124, y: 1180, width: 840, height: 50, fontFamily: "Inter", fontSize: 32, fontWeight: 600, color: "#7c3aed", align: "left", lineHeight: 1.4, letterSpacing: 6 }),
        el("shape", { variant: "rect", x: 124, y: 560, width: 160, height: 10, fill: V, cornerRadius: 5 }),
      ]),
  },
  {
    slug: "bold-yt-thumbnail", name: "Bold Tutorial — YouTube Thumbnail", category: "youtube", type: "canvas",
    tags: ["youtube", "thumbnail", "tutorial"], width: 1280, height: 720, featured: true,
    build: () =>
      doc(1280, 720, "#0f172a", [
        el("shape", { variant: "rect", x: 0, y: 0, width: 1280, height: 720, fill: "#0f172a", cornerRadius: 0 }),
        el("text", { text: "DESIGN\nFASTER ⚡", x: 64, y: 140, width: 700, height: 300, fontFamily: "Bebas Neue", fontSize: 150, fontWeight: 400, color: "#ffffff", align: "left", lineHeight: 1 }),
        el("text", { text: "5 STUDIO WORKFLOWS", x: 70, y: 470, width: 640, height: 60, fontFamily: "Poppins", fontSize: 42, fontWeight: 700, color: "#f59e0b", align: "left", lineHeight: 1.2 }),
        el("shape", { variant: "ellipse", x: 820, y: 120, width: 380, height: 380, fill: V }),
        el("text", { text: "2026", x: 900, y: 270, width: 220, height: 80, fontFamily: "Bebas Neue", fontSize: 90, fontWeight: 400, color: "#ffffff", align: "center", lineHeight: 1 }),
      ]),
  },
  {
    slug: "clean-resume-a4", name: "Clean Resume — A4", category: "resume", type: "canvas",
    tags: ["resume", "cv", "professional"], width: 1240, height: 1754, featured: true,
    build: () =>
      doc(1240, 1754, "#ffffff", [
        el("shape", { variant: "rect", x: 0, y: 0, width: 420, height: 1754, fill: "#1f2937", cornerRadius: 0 }),
        el("text", { text: "ALEX\nMORGAN", x: 60, y: 140, width: 320, height: 160, fontFamily: "Poppins", fontSize: 64, fontWeight: 700, color: "#ffffff", align: "left", lineHeight: 1.1 }),
        el("text", { text: "Product Designer", x: 62, y: 320, width: 320, height: 40, fontFamily: "Inter", fontSize: 28, fontWeight: 400, color: "#c4b5fd", align: "left", lineHeight: 1.3 }),
        el("text", { text: "CONTACT\n\nalex@studio.app\n+1 555 0100\nPortugal", x: 62, y: 420, width: 320, height: 240, fontFamily: "Inter", fontSize: 24, fontWeight: 400, color: "#e5e7eb", align: "left", lineHeight: 1.5 }),
        el("text", { text: "EXPERIENCE", x: 500, y: 140, width: 640, height: 50, fontFamily: "Poppins", fontSize: 34, fontWeight: 700, color: V, align: "left", lineHeight: 1.3, letterSpacing: 4 }),
        el("text", { text: "Senior Product Designer — Nova Labs (2022–now)\nLed design system used by 40+ engineers.\n\nProduct Designer — Bright (2019–2022)\nShipped 12 core features across web and mobile.", x: 500, y: 210, width: 660, height: 260, fontFamily: "Inter", fontSize: 24, fontWeight: 400, color: "#374151", align: "left", lineHeight: 1.55 }),
        el("text", { text: "EDUCATION", x: 500, y: 560, width: 640, height: 50, fontFamily: "Poppins", fontSize: 34, fontWeight: 700, color: V, align: "left", lineHeight: 1.3, letterSpacing: 4 }),
        el("text", { text: "BA Interaction Design — Porto Univ. (2019)", x: 500, y: 630, width: 660, height: 60, fontFamily: "Inter", fontSize: 24, fontWeight: 400, color: "#374151", align: "left", lineHeight: 1.55 }),
        el("text", { text: "SKILLS", x: 500, y: 760, width: 640, height: 50, fontFamily: "Poppins", fontSize: 34, fontWeight: 700, color: V, align: "left", lineHeight: 1.3, letterSpacing: 4 }),
        el("text", { text: "Figma · Prototyping · Design Systems · Motion", x: 500, y: 830, width: 660, height: 60, fontFamily: "Inter", fontSize: 24, fontWeight: 400, color: "#374151", align: "left", lineHeight: 1.55 }),
      ]),
  },
  {
    slug: "cert-of-achievement", name: "Certificate of Achievement", category: "education", type: "canvas",
    tags: ["certificate", "education", "award"], width: 1754, height: 1240,
    build: () =>
      doc(1754, 1240, "#fffbeb", [
        el("shape", { variant: "rect", x: 60, y: 60, width: 1634, height: 1120, fill: "transparent", stroke: "#b45309", strokeWidth: 8, cornerRadius: 24 }),
        el("shape", { variant: "rect", x: 90, y: 90, width: 1574, height: 1060, fill: "transparent", stroke: "#f59e0b", strokeWidth: 2, cornerRadius: 16 }),
        el("text", { text: "CERTIFICATE", x: 200, y: 240, width: 1354, height: 100, fontFamily: "Playfair Display", fontSize: 96, fontWeight: 700, color: "#92400e", align: "center", lineHeight: 1.2, letterSpacing: 10 }),
        el("text", { text: "OF ACHIEVEMENT", x: 200, y: 360, width: 1354, height: 60, fontFamily: "Inter", fontSize: 36, fontWeight: 600, color: "#b45309", align: "center", lineHeight: 1.4, letterSpacing: 14 }),
        el("text", { text: "proudly presented to", x: 200, y: 480, width: 1354, height: 50, fontFamily: "Inter", fontSize: 28, fontWeight: 400, color: "#78350f", align: "center", lineHeight: 1.4 }),
        el("text", { text: "{{name}}", x: 200, y: 560, width: 1354, height: 110, fontFamily: "Dancing Script", fontSize: 96, fontWeight: 700, color: "#1f2937", align: "center", lineHeight: 1.2 }),
        el("text", { text: "for outstanding completion of the {{course}} program", x: 200, y: 700, width: 1354, height: 50, fontFamily: "Inter", fontSize: 28, fontWeight: 400, color: "#78350f", align: "center", lineHeight: 1.4 }),
        el("text", { text: "Date: {{date}}", x: 1100, y: 980, width: 440, height: 50, fontFamily: "Inter", fontSize: 24, fontWeight: 400, color: "#92400e", align: "center", lineHeight: 1.4 }),
      ]),
  },
  {
    slug: "pitch-cover", name: "Pitch Deck Cover — 16:9", category: "presentation", type: "presentation",
    tags: ["pitch", "startup", "presentation"], width: 1920, height: 1080, featured: true,
    build: () => {
      const d = doc(1920, 1080, "#111827", [
        el("shape", { variant: "rect", x: 120, y: 120, width: 1680, height: 840, fill: "#1f2937", cornerRadius: 32 }),
        el("text", { text: "STUDIO", x: 220, y: 380, width: 800, height: 180, fontFamily: "Bebas Neue", fontSize: 170, fontWeight: 400, color: "#ffffff", align: "left", lineHeight: 1, letterSpacing: 8 }),
        el("text", { text: "Free all-in-one visual design platform", x: 226, y: 590, width: 900, height: 60, fontFamily: "Poppins", fontSize: 44, fontWeight: 400, color: "#c4b5fd", align: "left", lineHeight: 1.3 }),
        el("shape", { variant: "ellipse", x: 1350, y: 300, width: 330, height: 330, fill: V }),
        el("text", { text: "Seed\nRound", x: 1400, y: 400, width: 240, height: 130, fontFamily: "Poppins", fontSize: 48, fontWeight: 700, color: "#ffffff", align: "center", lineHeight: 1.2 }),
        el("text", { text: "2026", x: 226, y: 800, width: 300, height: 50, fontFamily: "Inter", fontSize: 30, fontWeight: 400, color: "#6b7280", align: "left", lineHeight: 1.3 }),
      ])
      ;(d as Record<string, unknown>).type = "presentation"
      return d
    },
  },
  {
    slug: "business-card-minimal", name: "Minimal Business Card", category: "business", type: "canvas",
    tags: ["business card", "minimal", "print"], width: 1050, height: 600,
    build: () =>
      doc(1050, 600, "#ffffff", [
        el("shape", { variant: "rect", x: 0, y: 0, width: 1050, height: 600, fill: "#ffffff", cornerRadius: 0, stroke: "#e5e7eb", strokeWidth: 2 }),
        el("shape", { variant: "rect", x: 0, y: 0, width: 14, height: 600, fill: V, cornerRadius: 0 }),
        el("text", { text: "ALEX MORGAN", x: 70, y: 170, width: 600, height: 70, fontFamily: "Poppins", fontSize: 52, fontWeight: 700, color: "#111827", align: "left", lineHeight: 1.2, letterSpacing: 2 }),
        el("text", { text: "Product Designer", x: 72, y: 250, width: 500, height: 40, fontFamily: "Inter", fontSize: 28, fontWeight: 400, color: V, align: "left", lineHeight: 1.3 }),
        el("text", { text: "alex@studio.app · +1 555 0100\nstudio.app", x: 72, y: 380, width: 620, height: 90, fontFamily: "Inter", fontSize: 24, fontWeight: 400, color: "#6b7280", align: "left", lineHeight: 1.6 }),
        el("shape", { variant: "ellipse", x: 800, y: 180, width: 160, height: 160, fill: "#ede9fe" }),
      ]),
  },
  {
    slug: "event-invitation", name: "Garden Party Invitation", category: "event", type: "canvas",
    tags: ["invitation", "event", "elegant"], width: 1050, height: 1500,
    build: () =>
      doc(1050, 1500, CREAM, [
        el("shape", { variant: "rect", x: 60, y: 60, width: 930, height: 1380, fill: "#ffffff", stroke: V, strokeWidth: 4, cornerRadius: 24 }),
        el("text", { text: "You're invited", x: 120, y: 300, width: 810, height: 70, fontFamily: "Dancing Script", fontSize: 72, fontWeight: 700, color: V, align: "center", lineHeight: 1.2 }),
        el("text", { text: "GARDEN\nPARTY", x: 120, y: 420, width: 810, height: 240, fontFamily: "Playfair Display", fontSize: 110, fontWeight: 700, color: "#1f2937", align: "center", lineHeight: 1.1 }),
        el("text", { text: "SATURDAY · JUNE 21 · 4 PM\nRooftop Garden, Lisbon", x: 120, y: 740, width: 810, height: 110, fontFamily: "Inter", fontSize: 34, fontWeight: 400, color: "#6b7280", align: "center", lineHeight: 1.6, letterSpacing: 2 }),
        el("shape", { variant: "rect", x: 445, y: 920, width: 160, height: 6, fill: "#f59e0b", cornerRadius: 3 }),
        el("text", { text: "RSVP by June 10 · alex@studio.app", x: 120, y: 990, width: 810, height: 50, fontFamily: "Inter", fontSize: 26, fontWeight: 400, color: "#9ca3af", align: "center", lineHeight: 1.5 }),
      ]),
  },
]

async function main() {
  const adminPass = await bcrypt.hash("admin1234", 10)
  const demoPass = await bcrypt.hash("demo1234", 10)

  const admin = await db.user.upsert({
    where: { email: "admin@studio.local" },
    update: {},
    create: { email: "admin@studio.local", name: "Studio Admin", passwordHash: adminPass, role: "admin", emailVerifiedAt: new Date() },
  })
  await db.user.upsert({
    where: { email: "demo@studio.local" },
    update: {},
    create: { email: "demo@studio.local", name: "Demo User", passwordHash: demoPass, emailVerifiedAt: new Date() },
  })

  for (const spec of TEMPLATES) {
    const contentJson = JSON.stringify(spec.build())
    await db.template.upsert({
      where: { slug: spec.slug },
      update: { contentJson, featured: spec.featured ?? false, name: spec.name, category: spec.category, width: spec.width, height: spec.height },
      create: {
        slug: spec.slug,
        name: spec.name,
        category: spec.category,
        type: spec.type,
        tags: JSON.stringify(spec.tags),
        width: spec.width,
        height: spec.height,
        contentJson,
        featured: spec.featured ?? false,
        license: "CC0",
      },
    })
  }

  await db.auditLog.create({ data: { action: "seed.run", actorId: admin.id, target: "templates" } })
  console.log(`Seeded ${TEMPLATES.length} templates + demo accounts (admin@studio.local / admin1234, demo@studio.local / demo1234)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
