"use client"

/**
 * Email designer — block model, palette and normalization.
 * Persisted as DesignDoc.config = EmailConfig with props: Record<string, unknown>.
 */

import type { EmailBlock, EmailConfig } from "@/lib/design/types"
import { uid } from "@/lib/design/types"

export type BlockKind = EmailBlock["kind"]

export const SOCIAL_NETWORKS = ["instagram", "x", "facebook", "linkedin", "youtube"] as const
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]
export interface SocialLink { network: SocialNetwork; href: string }

export interface BlockPropsMap {
  heading: { text: string; size: number; align: "left" | "center" | "right"; color: string }
  text: { content: string; align: "left" | "center" | "right" }
  image: { src: string; alt: string; href: string; width: number }
  button: { text: string; href: string; bg: string; radius: number; align: "left" | "center" | "right" }
  divider: { color: string; thickness: number }
  spacer: { height: number }
  social: { links: SocialLink[] }
  columns: { left: string; right: string }
  html: { code: string }
}

export interface BlockDef {
  kind: BlockKind
  label: string
  hint: string
  defaults: () => Record<string, unknown>
}

export const BLOCK_DEFS: BlockDef[] = [
  { kind: "heading", label: "Heading", hint: "Large title line", defaults: () => ({ text: "Your heading", size: 26, align: "left", color: "" }) },
  { kind: "text", label: "Text", hint: "Paragraph, **bold** [link](url)", defaults: () => ({ content: "Write your message here. Use **bold**, *italic* and [links](https://example.com).", align: "left" }) },
  { kind: "image", label: "Image", hint: "Hosted image URL", defaults: () => ({ src: "", alt: "", href: "", width: 100 }) },
  { kind: "button", label: "Button", hint: "Bulletproof CTA", defaults: () => ({ text: "Shop now", href: "https://example.com", bg: "", radius: 8, align: "center" }) },
  { kind: "divider", label: "Divider", hint: "Horizontal rule", defaults: () => ({ color: "", thickness: 1 }) },
  { kind: "spacer", label: "Spacer", hint: "Vertical gap", defaults: () => ({ height: 24 }) },
  { kind: "social", label: "Social", hint: "Profile links row", defaults: () => ({ links: [{ network: "instagram", href: "https://instagram.com/" }] as SocialLink[] }) },
  { kind: "columns", label: "Columns", hint: "Two text cells", defaults: () => ({ left: "**Left column**\n\nShort supporting text.", right: "**Right column**\n\nShort supporting text." }) },
  { kind: "html", label: "HTML", hint: "Raw sanitized HTML", defaults: () => ({ code: "" }) },
]

export function blockDef(kind: BlockKind): BlockDef | undefined {
  return BLOCK_DEFS.find((d) => d.kind === kind)
}

export function makeBlock(kind: BlockKind): EmailBlock {
  const def = blockDef(kind)
  return { id: uid("blk"), kind, props: def ? def.defaults() : {} }
}

/* ---------------- normalization ---------------- */

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback
}
function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback
}
function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function normalizeBlockProps(kind: BlockKind, raw: unknown): Record<string, unknown> {
  const p = rec(raw)
  switch (kind) {
    case "heading":
      return {
        text: str(p.text, "Heading"),
        size: clamp(num(p.size, 26), 12, 56),
        align: p.align === "center" || p.align === "right" ? p.align : "left",
        color: str(p.color, ""),
      }
    case "text":
      return { content: str(p.content, ""), align: p.align === "center" || p.align === "right" ? p.align : "left" }
    case "image":
      return { src: str(p.src, ""), alt: str(p.alt, ""), href: str(p.href, ""), width: clamp(num(p.width, 100), 20, 100) }
    case "button":
      return {
        text: str(p.text, "Button"),
        href: str(p.href, "#"),
        bg: str(p.bg, ""),
        radius: clamp(num(p.radius, 8), 0, 28),
        align: p.align === "left" || p.align === "right" ? p.align : "center",
      }
    case "divider":
      return { color: str(p.color, ""), thickness: clamp(num(p.thickness, 1), 1, 8) }
    case "spacer":
      return { height: clamp(num(p.height, 24), 4, 160) }
    case "social": {
      const links = Array.isArray(p.links) ? p.links : []
      return {
        links: links
          .map((l) => rec(l))
          .map((l) => ({ network: (SOCIAL_NETWORKS as readonly string[]).includes(str(l.network, "")) ? (l.network as SocialNetwork) : "instagram", href: str(l.href, "") }))
          .filter((l) => l.href.trim().length > 0)
          .filter((l, i, all) => all.findIndex((x) => x.network === l.network) === i),
      }
    }
    case "columns":
      return { left: str(p.left, ""), right: str(p.right, "") }
    case "html":
      return { code: str(p.code, "") }
    default:
      return rec(p)
  }
}

export function normalizeBlock(raw: unknown): EmailBlock {
  const r = rec(raw)
  const kind = (BLOCK_DEFS.some((d) => d.kind === r.kind) ? r.kind : "text") as BlockKind
  return { id: str(r.id, uid("blk")), kind, props: normalizeBlockProps(kind, r.props) }
}

export function normalizeEmailConfig(raw: unknown): EmailConfig {
  const c = rec(raw)
  return {
    subject: str(c.subject, "Subject line"),
    preheader: str(c.preheader, ""),
    backgroundColor: str(c.backgroundColor, "#f4f4f5"),
    contentBackground: str(c.contentBackground, "#ffffff"),
    fontFamily: str(c.fontFamily, "Inter"),
    textColor: str(c.textColor, "#111827"),
    accentColor: str(c.accentColor, "#8b5cf6"),
    width: clamp(num(c.width, 600), 480, 700),
    blocks: Array.isArray(c.blocks) ? c.blocks.map(normalizeBlock) : [],
  }
}

/** web-safe fallback stack per bundled family (used in inline styles) */
export function fontStack(family: string): string {
  const serif = /^(playfair|merriweather|dancing|caveat)/i.test(family)
  return `"${family.replace(/"/g, "")}", ${serif ? "Georgia, " : ""}Helvetica, Arial, sans-serif`
}
