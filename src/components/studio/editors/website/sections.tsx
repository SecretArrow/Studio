"use client"

/**
 * Website builder — real section renderers.
 * One React component per section kind, rendered identically in the live
 * preview, the exported HTML (via renderToStaticMarkup) and the PNG raster.
 * Styling = theme tokens + the shared `.ws-*` stylesheet from site-css.ts.
 */

import type { CSSProperties, MouseEvent, ReactNode } from "react"
import type { WebsiteSection } from "@/lib/design/types"
import {
  Award, Camera, Check, Clock, Code, Globe, Heart, Mail, MessageSquare, Rocket, Shield, Sparkles, Star, Users, Zap,
} from "lucide-react"
import type { SectionKind, Device, AnySectionProps } from "./model"
import type {
  FaqItem, FeatureItem, FooterLink, GalleryImage, LogoItem, NavLinkItem, PlanItem, StatItem, TestimonialItem,
  SectionPropsMap,
} from "./model"
import { videoEmbedUrl } from "./model"
import type { ThemeTokens } from "./site-css"
import { MdLite } from "./md"

export interface SectionCtx {
  device: Device
  /** resolve an href before render (preview: as-is; export: page/anchor aware) */
  linkHref: (href: string) => string
  /** preview click interceptor — must preventDefault; undefined for export */
  onLinkClick?: (href: string, e: MouseEvent<HTMLAnchorElement>) => void
}

export type Theme = ThemeTokens

const ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles, zap: Zap, shield: Shield, heart: Heart, star: Star, rocket: Rocket, globe: Globe,
  check: Check, clock: Clock, users: Users, mail: Mail, camera: Camera, code: Code, award: Award, message: MessageSquare,
}

export function FeatureIcon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const Cmp = ICONS[name] ?? Sparkles
  return <Cmp size={size} color={color} strokeWidth={2} aria-hidden="true" />
}

function cols(n: number, device: Device, cap = 3): number {
  const total = Math.max(1, Math.min(n, cap))
  if (device !== "desktop") return Math.min(2, total)
  return total
}

function SmartA({ href, ctx, style, className, children, ariaLabel }: {
  href: string
  ctx: SectionCtx
  style?: CSSProperties
  className?: string
  children: ReactNode
  ariaLabel?: string
}) {
  const onLinkClick = ctx.onLinkClick
  return (
    <a
      href={ctx.linkHref(href)}
      className={className}
      style={style}
      aria-label={ariaLabel}
      onClick={onLinkClick ? (e) => onLinkClick(href, e) : undefined}
    >
      {children}
    </a>
  )
}

function Heading({ text, center, style }: { text: string; center?: boolean; style?: CSSProperties }) {
  if (!text) return null
  return (
    <div className={center ? "ws-center" : undefined} style={{ marginBottom: 28, ...style }}>
      {text ? <h2 style={{ marginBottom: 0 }}>{text}</h2> : null}
    </div>
  )
}

function Avatar({ url, name, size = 46 }: { url: string; name: string; size?: number }) {
  if (url) {
    return <img src={url} alt={name ? `Photo of ${name}` : "Customer avatar"} width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
  }
  const initial = (name.trim()[0] ?? "?").toUpperCase()
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: "50%", background: "var(--ws-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.44 }}
    >
      {initial}
    </div>
  )
}

/** semantic anchor ids used by nav links in the exported site */
export const SECTION_ANCHORS: Partial<Record<SectionKind, string>> = {
  nav: "nav", hero: "hero", features: "features", gallery: "gallery", video: "video", testimonials: "testimonials",
  pricing: "pricing", faq: "faq", cta: "cta", contact: "contact",
}

export function anchorFor(kind: SectionKind): string | undefined {
  return SECTION_ANCHORS[kind]
}

/* ---------------- section renderers ---------------- */

type RenderFn = (p: AnySectionProps, _t: Theme, ctx: SectionCtx) => ReactNode

const renderNav: RenderFn = (pRaw, _t, ctx) => {
  const { brand, links } = pRaw as SectionPropsMap["nav"]
  const brandScale = ctx.device === "mobile" ? 19 : 22
  return (
    <header className="ws-nav" style={{ padding: "18px 20px" }}>
      <SmartA href="/" ctx={ctx} style={{ fontFamily: "var(--ws-heading), Georgia, serif", fontWeight: 800, fontSize: brandScale, color: "var(--ws-text)", textDecoration: "none" }}>
        {brand || "My Site"}
      </SmartA>
      <nav className="ws-nav-links" aria-label="Main navigation">
        {links.map((l: NavLinkItem, i: number) => (
          <SmartA key={i} href={l.href || "#"} ctx={ctx}>{l.label}</SmartA>
        ))}
      </nav>
    </header>
  )
}

const renderHero: RenderFn = (pRaw, _t, ctx) => {
  const { title, subtitle, imageUrl, ctaText, ctaHref, align } = pRaw as SectionPropsMap["hero"]
  const twoCol = Boolean(imageUrl) && ctx.device !== "mobile"
  const center = align === "center"
  return (
    <div className={center ? "ws-center" : undefined}>
      <div className="ws-grid" style={{ ["--ws-cols" as string]: twoCol ? 2 : 1, alignItems: "center", gap: 40 }}>
        <div>
          <h1>{title}</h1>
          {subtitle ? <p style={{ fontSize: 18, opacity: 0.82, maxWidth: 560, marginLeft: center && !twoCol ? "auto" : undefined, marginRight: center && !twoCol ? "auto" : undefined }}>{subtitle}</p> : null}
          {ctaText ? (
            <p style={{ marginBottom: 0, marginTop: 26 }}>
              <SmartA href={ctaHref || "#"} ctx={ctx} className="ws-btn">{ctaText}</SmartA>
            </p>
          ) : null}
        </div>
        {imageUrl ? <img className="ws-media" src={imageUrl} alt={title || "Hero image"} style={{ maxHeight: 420 }} /> : null}
      </div>
    </div>
  )
}

const renderFeatures: RenderFn = (pRaw, _t, ctx) => {
  const { title, items } = pRaw as SectionPropsMap["features"]
  return (
    <>
      <Heading text={title} center />
      <div className="ws-grid" style={{ ["--ws-cols" as string]: cols(items.length, ctx.device) }}>
        {items.map((f: FeatureItem, i: number) => (
          <div key={i} className="ws-card">
            <div style={{ width: 44, height: 44, borderRadius: "calc(var(--ws-radius) * 0.8)", background: "var(--ws-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <FeatureIcon name={f.icon} />
            </div>
            <h3>{f.title}</h3>
            {f.text ? <p style={{ marginBottom: 0, opacity: 0.8 }}>{f.text}</p> : null}
          </div>
        ))}
      </div>
    </>
  )
}

const renderGallery: RenderFn = (pRaw, _t, ctx) => {
  const { title, images } = pRaw as SectionPropsMap["gallery"]
  const n = ctx.device === "mobile" ? 2 : cols(images.length, ctx.device, 3)
  return (
    <>
      <Heading text={title} center />
      <div className="ws-grid" style={{ ["--ws-cols" as string]: n }}>
        {images.map((g: GalleryImage, i: number) => (
          g.src ? (
            <img key={i} className="ws-media" src={g.src} alt={g.alt || `Gallery image ${i + 1}`} style={{ width: "100%", height: ctx.device === "mobile" ? 160 : 220 }} />
          ) : (
            <div key={i} aria-hidden="true" className="ws-card" style={{ height: ctx.device === "mobile" ? 160 : 220, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.55 }}>No image</div>
          )
        ))}
      </div>
    </>
  )
}

const renderVideo: RenderFn = (pRaw, _t, ctx) => {
  const { url, title, caption } = pRaw as SectionPropsMap["video"]
  const embed = videoEmbedUrl(url)
  return (
    <>
      <Heading text={title} center />
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: "var(--ws-radius)", overflow: "hidden", background: "#0f0f13" }}>
          {embed ? (
            <iframe
              src={embed}
              title={title || "Embedded video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", opacity: 0.7 }}>Add a video URL in the section settings</div>
          )}
        </div>
        {caption ? <p className="ws-center ws-muted" style={{ marginTop: 12, marginBottom: 0 }}>{caption}</p> : null}
      </div>
    </>
  )
}

const renderTestimonials: RenderFn = (pRaw, _t, ctx) => {
  const { title, items } = pRaw as SectionPropsMap["testimonials"]
  return (
    <>
      <Heading text={title} center />
      <div className="ws-grid" style={{ ["--ws-cols" as string]: cols(items.length, ctx.device) }}>
        {items.map((tm: TestimonialItem, i: number) => (
          <figure key={i} className="ws-card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <blockquote style={{ margin: 0, fontSize: 16, lineHeight: 1.55, fontStyle: "italic" }}>“{tm.quote}”</blockquote>
            <figcaption style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
              <Avatar url={tm.avatarUrl} name={tm.author} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{tm.author}</div>
                {tm.role ? <div style={{ fontSize: 13, opacity: 0.7 }}>{tm.role}</div> : null}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  )
}

const renderPricing: RenderFn = (pRaw, _t, ctx) => {
  const { title, subtitle, plans } = pRaw as SectionPropsMap["pricing"]
  return (
    <>
      <Heading text={title} center />
      {subtitle ? <p className="ws-center ws-muted" style={{ marginTop: -18, marginBottom: 28 }}>{subtitle}</p> : null}
      <div className="ws-grid" style={{ ["--ws-cols" as string]: cols(plans.length, ctx.device), alignItems: "stretch" }}>
        {plans.map((plan: PlanItem, i: number) => (
          <div
            key={i}
            className="ws-card"
            style={{ display: "flex", flexDirection: "column", ...(plan.highlighted ? { boxShadow: "0 0 0 3px var(--ws-primary)" } : {}) }}
          >
            {plan.highlighted ? <span className="ws-kicker" style={{ marginBottom: 6 }}>Most popular</span> : null}
            <h3 style={{ marginBottom: 2 }}>{plan.name}</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 14 }}>
              <span style={{ fontSize: 34, fontWeight: 800, fontFamily: "var(--ws-heading), Georgia, serif" }}>{plan.price}</span>
              <span style={{ opacity: 0.6, fontSize: 14 }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle: "none", margin: "0 0 20px", padding: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
              {plan.features.map((f, fi) => (
                <li key={fi} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--ws-primary)", flexShrink: 0, display: "inline-flex", marginTop: 2 }}><Check size={15} aria-hidden="true" /></span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p style={{ marginTop: "auto", marginBottom: 0 }}>
              <SmartA href="#cta" ctx={ctx} className={plan.highlighted ? "ws-btn" : "ws-btn ws-btn--ghost"} style={{ width: "100%", textAlign: "center", boxSizing: "border-box" }}>
                {plan.highlighted ? `Choose ${plan.name}` : "Get started"}
              </SmartA>
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

const renderFaq: RenderFn = (pRaw, _t, ctx) => {
  const { title, items } = pRaw as SectionPropsMap["faq"]
  void ctx
  return (
    <>
      <Heading text={title} center />
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((f: FaqItem, i: number) => (
          <details key={i} className="ws-card" style={{ padding: 0 }}>
            <summary style={{ cursor: "pointer", padding: "16px 20px", fontWeight: 700, fontSize: 15 }}>{f.q}</summary>
            <div style={{ padding: "0 20px 16px", opacity: 0.85, fontSize: 15, lineHeight: 1.6 }}>{f.a}</div>
          </details>
        ))}
      </div>
    </>
  )
}

const renderCta: RenderFn = (pRaw, _t, ctx) => {
  const { title, text, button } = pRaw as SectionPropsMap["cta"]
  return (
    <div className="ws-center" style={{ background: "var(--ws-primary)", color: "#fff", borderRadius: "var(--ws-radius)", padding: "46px 28px" }}>
      <h2 style={{ color: "#fff" }}>{title}</h2>
      {text ? <p style={{ color: "rgba(255,255,255,0.88)", maxWidth: 560, margin: "0 auto 22px" }}>{text}</p> : null}
      {button ? (
        <SmartA href="#top" ctx={ctx} className="ws-btn" style={{ background: "#fff", color: "var(--ws-primary)", fontWeight: 700 }}>{button}</SmartA>
      ) : null}
    </div>
  )
}

const renderContact: RenderFn = (pRaw, _t, ctx) => {
  const { title, emailNote, fields } = pRaw as SectionPropsMap["contact"]
  const mailto = /[\w.+-]+@[\w-]+\.[\w.]+/.exec(emailNote)?.[0]
  const fieldStyle: CSSProperties = {
    width: "100%", border: "1px solid rgba(127,127,127,0.35)", borderRadius: "var(--ws-radius)",
    padding: "10px 12px", font: "inherit", background: "transparent", color: "var(--ws-text)",
  }
  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }} className="ws-center">
      <Heading text={title} center />
      {emailNote ? <MdLite text={emailNote} /> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20, textAlign: "left" }}>
        {fields.map((label, i) => (
          i === fields.length - 1 && /message|comment|question/i.test(label) ? (
            <textarea key={i} readOnly aria-label={label} placeholder={label} rows={4} style={{ ...fieldStyle, resize: "vertical" }} />
          ) : (
            <input key={i} readOnly aria-label={label} placeholder={label} style={fieldStyle} />
          )
        ))}
      </div>
      {mailto ? (
        <p style={{ marginBottom: 0, marginTop: 18 }}>
          <SmartA href={`mailto:${mailto}`} ctx={ctx} className="ws-btn">Send message</SmartA>
        </p>
      ) : null}
    </div>
  )
}

const renderFooter: RenderFn = (pRaw, _t, ctx) => {
  const { text, links } = pRaw as SectionPropsMap["footer"]
  return (
    <div className="ws-center" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {links.map((l: FooterLink, i: number) => (
          <SmartA key={i} href={l.href || "#"} ctx={ctx} style={{ fontSize: 14, opacity: 0.75 }}>{l.label}</SmartA>
        ))}
      </div>
      <p style={{ marginBottom: 0, fontSize: 13, opacity: 0.6 }}>{text}</p>
    </div>
  )
}

const renderRichText: RenderFn = (pRaw, _t, _ctx) => {
  const { title, markdown } = pRaw as SectionPropsMap["richText"]
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {title ? <h2>{title}</h2> : null}
      <MdLite text={markdown} />
    </div>
  )
}

const renderLogos: RenderFn = (pRaw, _t, ctx) => {
  const { title, items } = pRaw as SectionPropsMap["logos"]
  return (
    <>
      {title ? <p className="ws-center ws-muted" style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>{title}</p> : null}
      <div className="ws-grid" style={{ ["--ws-cols" as string]: cols(items.length, ctx.device, 4), alignItems: "center" }}>
        {items.map((l: LogoItem, i: number) => (
          <div key={i} className="ws-center" style={{ padding: "10px 6px", opacity: 0.75 }}>
            {l.imageUrl ? (
              <img src={l.imageUrl} alt={l.name || `Logo ${i + 1}`} style={{ maxHeight: 42, margin: "0 auto", objectFit: "contain" }} />
            ) : (
              <span style={{ fontFamily: "var(--ws-heading), Georgia, serif", fontWeight: 800, fontSize: 20 }}>{l.name}</span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

const renderStats: RenderFn = (pRaw, _t, ctx) => {
  const { items } = pRaw as SectionPropsMap["stats"]
  return (
    <div className="ws-grid" style={{ ["--ws-cols" as string]: cols(items.length, ctx.device, 4), textAlign: "center" }}>
      {items.map((s: StatItem, i: number) => (
        <div key={i}>
          <div style={{ fontSize: ctx.device === "mobile" ? 30 : 40, fontWeight: 800, fontFamily: "var(--ws-heading), Georgia, serif", color: "var(--ws-primary)", lineHeight: 1.1 }}>{s.value}</div>
          <div style={{ fontSize: 13, opacity: 0.72, marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

const RENDERERS: Record<SectionKind, RenderFn> = {
  nav: renderNav,
  hero: renderHero,
  features: renderFeatures,
  gallery: renderGallery,
  video: renderVideo,
  testimonials: renderTestimonials,
  pricing: renderPricing,
  faq: renderFaq,
  cta: renderCta,
  contact: renderContact,
  footer: renderFooter,
  richText: renderRichText,
  logos: renderLogos,
  stats: renderStats,
}

/** Render one section body (no outer <section> wrapper — that is added by the canvas). */
export function SectionBody({ kind, props, theme, ctx }: {
  kind: SectionKind
  props: Record<string, unknown>
  theme: Theme
  ctx: SectionCtx
}) {
  const fn = RENDERERS[kind]
  if (!fn) return <p style={{ opacity: 0.6 }}>Unknown section type: {kind}</p>
  return fn(props as AnySectionProps, theme, ctx)
}

export function sectionLabel(sec: WebsiteSection): string {
  const p = sec.props as Record<string, unknown>
  const title = typeof p.title === "string" ? p.title : ""
  return title.length > 24 ? `${title.slice(0, 24)}…` : title
}
