"use client"

/**
 * Website builder — section model, typed prop shapes, palette and factories.
 * The persisted document is DesignDoc.config = WebsiteConfig with
 * props: Record<string, unknown>; these helpers normalize + type it safely
 * so legacy or hand-edited docs never crash the editor.
 */

import type { WebsiteConfig, WebsiteSection } from "@/lib/design/types"
import { uid } from "@/lib/design/types"

export type SectionKind = WebsiteSection["kind"]

export type Device = "desktop" | "tablet" | "mobile"

export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1200, tablet: 768, mobile: 375 }

/* ---------------- typed section props ---------------- */

export interface NavLinkItem { label: string; href: string }
export interface FeatureItem { icon: string; title: string; text: string }
export interface GalleryImage { src: string; alt: string }
export interface TestimonialItem { quote: string; author: string; role: string; avatarUrl: string }
export interface PlanItem { name: string; price: string; period: string; features: string[]; highlighted: boolean }
export interface FaqItem { q: string; a: string }
export interface StatItem { value: string; label: string }
export interface LogoItem { name: string; imageUrl: string }
export interface FooterLink { label: string; href: string }

export interface SectionPropsMap {
  nav: { brand: string; links: NavLinkItem[] }
  hero: { title: string; subtitle: string; imageUrl: string; ctaText: string; ctaHref: string; align: "left" | "center" }
  features: { title: string; items: FeatureItem[] }
  gallery: { title: string; images: GalleryImage[] }
  video: { url: string; title: string; caption: string }
  testimonials: { title: string; items: TestimonialItem[] }
  pricing: { title: string; subtitle: string; plans: PlanItem[] }
  faq: { title: string; items: FaqItem[] }
  cta: { title: string; text: string; button: string }
  contact: { title: string; emailNote: string; fields: string[] }
  footer: { text: string; links: FooterLink[] }
  richText: { title: string; markdown: string }
  logos: { title: string; items: LogoItem[] }
  stats: { items: StatItem[] }
}

export type AnySectionProps = SectionPropsMap[SectionKind]

/* ---------------- palette ---------------- */

export interface SectionDef {
  kind: SectionKind
  label: string
  hint: string
  defaults: () => AnySectionProps
}

export const SECTION_DEFS: SectionDef[] = [
  {
    kind: "nav", label: "Navigation", hint: "Brand + menu links",
    defaults: () => ({ brand: "My Site", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Contact", href: "#/contact" }] }),
  },
  {
    kind: "hero", label: "Hero", hint: "Big headline + CTA",
    defaults: () => ({ title: "Build something people love", subtitle: "Describe your product in one clear sentence and give visitors a reason to keep scrolling.", imageUrl: "", ctaText: "Get started", ctaHref: "#cta", align: "center" }),
  },
  {
    kind: "features", label: "Features", hint: "Icon + text grid",
    defaults: () => ({ title: "Why choose us", items: [
      { icon: "zap", title: "Fast", text: "Everything loads instantly, on any device." },
      { icon: "shield", title: "Reliable", text: "Built on proven, boring technology." },
      { icon: "heart", title: "Friendly", text: "Human support that actually replies." },
    ] }),
  },
  {
    kind: "gallery", label: "Gallery", hint: "Image grid",
    defaults: () => ({ title: "Gallery", images: [
      { src: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=70", alt: "Workspace" },
      { src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=70", alt: "Code" },
      { src: "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=800&q=70", alt: "Team" },
    ] }),
  },
  {
    kind: "video", label: "Video", hint: "Embedded player",
    defaults: () => ({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "See it in action", caption: "A 90-second tour of the product." }),
  },
  {
    kind: "testimonials", label: "Testimonials", hint: "Customer quotes",
    defaults: () => ({ title: "Loved by customers", items: [
      { quote: "This replaced three tools for us. Setup took minutes.", author: "Ada Lovelace", role: "CTO, Analytical Co.", avatarUrl: "" },
      { quote: "The free plan is genuinely free. No tricks.", author: "Grace Hopper", role: "Founder, Compiler Labs", avatarUrl: "" },
    ] }),
  },
  {
    kind: "pricing", label: "Pricing", hint: "Plan cards",
    defaults: () => ({ title: "Simple pricing", subtitle: "Start free, upgrade when you need more.", plans: [
      { name: "Free", price: "$0", period: "/mo", features: ["Unlimited projects", "All export formats", "Community support"], highlighted: false },
      { name: "Pro", price: "$12", period: "/mo", features: ["Everything in Free", "Priority support", "Custom domains"], highlighted: true },
    ] }),
  },
  {
    kind: "faq", label: "FAQ", hint: "Question / answer list",
    defaults: () => ({ title: "Frequently asked questions", items: [
      { q: "Is this really free?", a: "Yes. Every feature in this build is free — no paywalls, no watermarks." },
      { q: "Can I export my site?", a: "Yes, as a single HTML file or a ZIP archive you can host anywhere." },
    ] }),
  },
  {
    kind: "cta", label: "Call to action", hint: "Banner + button",
    defaults: () => ({ title: "Ready to start?", text: "Join thousands of makers shipping faster today.", button: "Start building" }),
  },
  {
    kind: "contact", label: "Contact", hint: "Form + note",
    defaults: () => ({ title: "Get in touch", emailNote: "We reply within one business day. Email us at hello@example.com.", fields: ["Name", "Email", "Message"] }),
  },
  {
    kind: "footer", label: "Footer", hint: "Copyright + links",
    defaults: () => ({ text: "© 2025 My Site. All rights reserved.", links: [{ label: "Privacy", href: "#/privacy" }, { label: "Terms", href: "#/terms" }] }),
  },
  {
    kind: "richText", label: "Rich text", hint: "Paragraphs, **bold**, [links](url)",
    defaults: () => ({ title: "About this site", markdown: "Write your story here.\n\nUse **bold** for emphasis and [links](https://example.com) to reference sources. Blank lines start new paragraphs." }),
  },
  {
    kind: "logos", label: "Logos", hint: "Customer / press logos",
    defaults: () => ({ title: "Trusted by teams at", items: [
      { name: "Acme", imageUrl: "" }, { name: "Globex", imageUrl: "" }, { name: "Initech", imageUrl: "" }, { name: "Umbrella", imageUrl: "" },
    ] }),
  },
  {
    kind: "stats", label: "Stats", hint: "Numbers row",
    defaults: () => ({ items: [
      { value: "12k+", label: "Happy users" },
      { value: "99.9%", label: "Uptime" },
      { value: "4.9★", label: "Average rating" },
    ] }),
  },
]

export const FEATURE_ICONS = ["sparkles", "zap", "shield", "heart", "star", "rocket", "globe", "check", "clock", "users", "mail", "camera", "code", "award", "message"] as const

export function sectionDef(kind: SectionKind): SectionDef | undefined {
  return SECTION_DEFS.find((d) => d.kind === kind)
}

export function makeSection(kind: SectionKind): WebsiteSection {
  const def = sectionDef(kind)
  return { id: uid("sec"), kind, props: (def ? def.defaults() : { title: "Section" }) as Record<string, unknown> }
}

/* ---------------- normalization ---------------- */

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback
}
function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback
}
function arr<T>(v: unknown, map: (item: unknown, i: number) => T, fallback: T[]): T[] {
  return Array.isArray(v) && v.length ? v.map(map) : fallback
}
function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}
function listItem<T>(raw: unknown, make: () => T, fields: (r: Record<string, unknown>, t: T) => T): T {
  const r = rec(raw)
  return fields(r, { ...make(), ...r } as T)
}

export function normalizeSectionProps(kind: SectionKind, raw: unknown): Record<string, unknown> {
  const p = rec(raw)
  switch (kind) {
    case "nav":
      return {
        brand: str(p.brand, "My Site"),
        links: arr(p.links, (l) => listItem<NavLinkItem>(l, () => ({ label: "Link", href: "#" }), (r, t) => ({ label: str(r.label, t.label), href: str(r.href, t.href) })), [{ label: "Home", href: "#" }]),
      }
    case "hero":
      return {
        title: str(p.title, "Your headline"),
        subtitle: str(p.subtitle, ""),
        imageUrl: str(p.imageUrl, ""),
        ctaText: str(p.ctaText, ""),
        ctaHref: str(p.ctaHref, "#"),
        align: p.align === "left" ? "left" : "center",
      }
    case "features":
      return {
        title: str(p.title, "Features"),
        items: arr(p.items, (i) => listItem<FeatureItem>(i, () => ({ icon: "sparkles", title: "Feature", text: "" }), (r, t) => ({ icon: str(r.icon, t.icon), title: str(r.title, t.title), text: str(r.text, t.text) })), []),
      }
    case "gallery":
      return {
        title: str(p.title, "Gallery"),
        images: arr(p.images, (i) => listItem<GalleryImage>(i, () => ({ src: "", alt: "" }), (r, t) => ({ src: str(r.src, t.src), alt: str(r.alt, t.alt) })), []),
      }
    case "video":
      return { url: str(p.url, ""), title: str(p.title, ""), caption: str(p.caption, "") }
    case "testimonials":
      return {
        title: str(p.title, "Testimonials"),
        items: arr(p.items, (i) => listItem<TestimonialItem>(i, () => ({ quote: "", author: "", role: "", avatarUrl: "" }), (r, t) => ({ quote: str(r.quote, t.quote), author: str(r.author, t.author), role: str(r.role, t.role), avatarUrl: str(r.avatarUrl, t.avatarUrl) })), []),
      }
    case "pricing":
      return {
        title: str(p.title, "Pricing"),
        subtitle: str(p.subtitle, ""),
        plans: arr(p.plans, (i) => {
          const base = { name: "Plan", price: "$0", period: "/mo", features: [] as string[], highlighted: false }
          const t = { ...base, ...rec(i) } as PlanItem
          return { ...t, features: Array.isArray(t.features) ? t.features.map(String) : [], highlighted: Boolean(t.highlighted) }
        }, []),
      }
    case "faq":
      return {
        title: str(p.title, "FAQ"),
        items: arr(p.items, (i) => listItem<FaqItem>(i, () => ({ q: "", a: "" }), (r, t) => ({ q: str(r.q, t.q), a: str(r.a, t.a) })), []),
      }
    case "cta":
      return { title: str(p.title, "Ready?"), text: str(p.text, ""), button: str(p.button, "Get started") }
    case "contact":
      return {
        title: str(p.title, "Contact"),
        emailNote: str(p.emailNote, ""),
        fields: arr(p.fields, (f) => str(f, "Field"), ["Name", "Email", "Message"]),
      }
    case "footer":
      return {
        text: str(p.text, "© 2025"),
        links: arr(p.links, (l) => listItem<FooterLink>(l, () => ({ label: "Link", href: "#" }), (r, t) => ({ label: str(r.label, t.label), href: str(r.href, t.href) })), []),
      }
    case "richText":
      return { title: str(p.title, ""), markdown: str(p.markdown, "") }
    case "logos":
      return {
        title: str(p.title, ""),
        items: arr(p.items, (i) => listItem<LogoItem>(i, () => ({ name: "Logo", imageUrl: "" }), (r, t) => ({ name: str(r.name, t.name), imageUrl: str(r.imageUrl, t.imageUrl) })), []),
      }
    case "stats":
      return {
        items: arr(p.items, (i) => listItem<StatItem>(i, () => ({ value: "0", label: "Label" }), (r, t) => ({ value: str(r.value, t.value), label: str(r.label, t.label) })), []),
      }
    default:
      return rec(p)
  }
}

export function normalizeSection(raw: unknown): WebsiteSection {
  const r = rec(raw)
  const kind = (SECTION_DEFS.some((d) => d.kind === r.kind) ? r.kind : "richText") as SectionKind
  return { id: str(r.id, uid("sec")), kind, props: normalizeSectionProps(kind, r.props) }
}

export function normalizePage(raw: unknown, index: number): WebsiteConfig["pages"][number] {
  const r = rec(raw)
  const name = str(r.name, `Page ${index + 1}`)
  const rawPath = str(r.path, `/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `page-${index + 1}`}`)
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`
  return {
    id: str(r.id, uid("page")),
    name,
    path,
    sections: Array.isArray(r.sections) ? r.sections.map(normalizeSection) : [],
  }
}

export function normalizeWebsiteConfig(raw: unknown): WebsiteConfig {
  const c = rec(raw)
  const t = rec(c.theme)
  return {
    siteName: str(c.siteName, "My Site"),
    pages: Array.isArray(c.pages) && c.pages.length ? c.pages.map(normalizePage) : [{ id: uid("page"), name: "Home", path: "/", sections: [] }],
    theme: {
      primary: str(t.primary, "#8b5cf6"),
      accent: str(t.accent, "#f59e0b"),
      background: str(t.background, "#ffffff"),
      text: str(t.text, "#111827"),
      headingFont: str(t.headingFont, "Poppins"),
      bodyFont: str(t.bodyFont, "Inter"),
      radius: num(t.radius, 12),
    },
    seo: (() => {
      const s = rec(c.seo)
      return {
        title: str(s.title, "My Site"),
        description: str(s.description, ""),
        favicon: typeof s.favicon === "string" && s.favicon ? s.favicon : undefined,
        socialImage: typeof s.socialImage === "string" && s.socialImage ? s.socialImage : undefined,
      }
    })(),
    customCss: str(c.customCss, ""),
  }
}

/** slug used for page file names / anchor ids */
export function pageSlug(path: string): string {
  const clean = path.replace(/^\/+/, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "")
  return clean || "index"
}

/** Resolve a youtube/vimeo url to an embeddable url (best-effort, honest fallback = original) */
export function videoEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i.exec(url)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vm = /vimeo\.com\/(\d+)/i.exec(url)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return /^https:\/\//i.test(url) ? url : null
}
