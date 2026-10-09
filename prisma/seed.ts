/**
 * Seed script — demo accounts + original CC0 template library + public assets.
 * Run: bun prisma/seed.ts  (idempotent — safe to re-run)
 */
import { PrismaClient } from "@prisma/client"
import { readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import bcrypt from "bcryptjs"
import { TPLS, tplCountByCategory } from "../src/lib/design/template-builder"

const db = new PrismaClient()

/* ------------------------------ accounts ------------------------------ */

async function seedUsers() {
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
  return admin
}

/* ------------------------------ templates ------------------------------ */

/** Slugs from earlier seeds that were superseded by richer re-authored versions. */
const RETIRED_SLUGS = ["pitch-cover", "event-invitation"]

async function seedTemplates() {
  for (const slug of RETIRED_SLUGS) {
    await db.template.deleteMany({ where: { slug } })
  }
  for (const spec of TPLS) {
    const contentJson = JSON.stringify(spec.build())
    await db.template.upsert({
      where: { slug: spec.slug },
      update: {
        contentJson,
        featured: spec.featured ?? false,
        name: spec.name,
        category: spec.category,
        type: spec.type,
        tags: JSON.stringify(spec.tags),
        width: spec.width,
        height: spec.height,
        license: "CC0",
      },
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
  return TPLS.length
}

/* ------------------------------ public assets ------------------------------ */

/** Original CC0 vector art served from /public/assets for the editor assets panel. */
const PUBLIC_ASSETS: { file: string; label: string; category: string; w: number; h: number; tags: string[] }[] = [
  { file: "blob-violet.svg", label: "Violet Blob", category: "shapes", w: 400, h: 400, tags: ["blob", "organic", "shape"] },
  { file: "sunburst.svg", label: "Sunburst", category: "decorations", w: 400, h: 400, tags: ["sun", "rays", "retro"] },
  { file: "wave-band.svg", label: "Ocean Waves", category: "decorations", w: 800, h: 300, tags: ["waves", "sea", "band"] },
  { file: "mountains.svg", label: "Mountain Scene", category: "illustrations", w: 800, h: 500, tags: ["mountains", "landscape", "nature"] },
  { file: "plant.svg", label: "Potted Plant", category: "illustrations", w: 400, h: 520, tags: ["plant", "monstera", "green"] },
  { file: "coffee-cup.svg", label: "Coffee Cup", category: "illustrations", w: 400, h: 400, tags: ["coffee", "cafe", "cup"] },
  { file: "starburst.svg", label: "Starburst", category: "decorations", w: 300, h: 300, tags: ["star", "sparkle", "burst"] },
  { file: "arch-frame.svg", label: "Arch Frame", category: "frames", w: 400, h: 560, tags: ["arch", "frame", "photo"] },
  { file: "gradient-scene.svg", label: "Gradient Sunset", category: "backgrounds", w: 800, h: 600, tags: ["gradient", "sunset", "abstract"] },
  { file: "balloon.svg", label: "Balloon", category: "illustrations", w: 300, h: 420, tags: ["balloon", "party", "birthday"] },
]

async function seedAssets() {
  const dir = join(process.cwd(), "public", "assets")
  let count = 0
  for (const a of PUBLIC_ASSETS) {
    const path = join(dir, a.file)
    const size = statSync(path).size
    readFileSync(path) // validate the file exists and is readable
    const url = `/assets/${a.file}`
    const existing = await db.asset.findFirst({ where: { url, kind: "svg", ownerId: null } })
    if (existing) {
      await db.asset.update({
        where: { id: existing.id },
        data: { filename: a.file, mime: "image/svg+xml", size, width: a.w, height: a.h, license: "CC0", tags: JSON.stringify([a.category, ...a.tags]) },
      })
    } else {
      await db.asset.create({
        data: {
          kind: "svg",
          url,
          filename: a.file,
          mime: "image/svg+xml",
          size,
          width: a.w,
          height: a.h,
          license: "CC0",
          tags: JSON.stringify([a.category, ...a.tags]),
        },
      })
    }
    count += 1
  }
  return count
}

/* ------------------------------ main ------------------------------ */

async function main() {
  const admin = await seedUsers()
  const tplCount = await seedTemplates()
  const assetCount = await seedAssets()
  await db.auditLog.create({ data: { action: "seed.run", actorId: admin.id, target: `templates:${tplCount},assets:${assetCount}` } })

  console.log(`Seeded ${tplCount} templates by category:`, tplCountByCategory())
  console.log(`Seeded ${assetCount} public CC0 assets under /assets/`)
  console.log("Accounts ready: admin@studio.local / admin1234, demo@studio.local / demo1234")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
