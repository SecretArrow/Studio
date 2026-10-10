"use client"

/**
 * Website builder — export pipeline.
 * - buildSiteHtml: one self-contained index.html (all pages stacked, anchor nav)
 * - buildSiteZip:  index.html + one file per extra page + assets/NOTES.txt
 * - rasterizeElement: DOM → SVG foreignObject → canvas PNG (shared with the
 *   email designer). Throws an honest error when the browser blocks it.
 */

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import JSZip from "jszip"
import type { WebsiteConfig, WebsiteSection } from "@/lib/design/types"
import type { SectionCtx } from "./sections"
import { SectionBody, anchorFor } from "./sections"
import { buildSiteCss } from "./site-css"
import { pageSlug } from "./model"

/* ---------------- shared helpers ---------------- */

export function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

interface RenderCtxOpts {
  device?: SectionCtx["device"]
  /** how "#/path" links resolve: stacked anchors (single file) or sibling files (zip) */
  pageLinks?: "anchors" | "files"
  currentPagePath?: string
}

function exportCtx(config: WebsiteConfig, opts: RenderCtxOpts): SectionCtx {
  const device = opts.device ?? "desktop"
  const byPath = new Map(config.pages.map((p) => [p.path, p]))
  return {
    device,
    linkHref: (href: string) => {
      if (href.startsWith("#/")) {
        const path = href.slice(1) || "/"
        const page = byPath.get(path)
        if (!page) return href
        if (opts.pageLinks === "files") return `./${pageSlug(page.path)}.html`
        return `#page-${pageSlug(page.path)}`
      }
      return href
    },
  }
}

function StaticPage({ config, page, ctx, anchorIds }: { config: WebsiteConfig; page: WebsiteConfig["pages"][number]; ctx: SectionCtx; anchorIds: boolean }) {
  const usedAnchors = new Set<string>()
  return (
    <div className="ws-root" style={{ minHeight: 200 }}>
      {page.sections.map((sec, i) => {
        const anchor = anchorIds ? anchorFor(sec.kind) : undefined
        const id = anchor && !usedAnchors.has(anchor) ? anchor : undefined
        if (anchor) usedAnchors.add(anchor)
        return (
          <section key={sec.id} id={id} className="ws-section" data-section={sec.kind} style={i === 0 ? { paddingTop: 24 } : undefined}>
            <div className="ws-container">
              <SectionBody kind={sec.kind} props={sec.props} theme={config.theme} ctx={ctx} />
            </div>
          </section>
        )
      })}
    </div>
  )
}

function pageMarkup(config: WebsiteConfig, page: WebsiteConfig["pages"][number], opts: RenderCtxOpts): string {
  return renderToStaticMarkup(createElement(StaticPage, { config, page, ctx: exportCtx(config, opts), anchorIds: true }))
}

function htmlDocument(config: WebsiteConfig, bodyHtml: string): string {
  const seo = config.seo
  const favicon = seo.favicon ? `\n  <link rel="icon" href="${htmlEscape(seo.favicon)}">` : ""
  const ogImage = seo.socialImage ? `\n  <meta property="og:image" content="${htmlEscape(seo.socialImage)}">` : ""
  const css = buildSiteCss(config.theme, config.customCss ?? "")
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(seo.title || config.siteName)}</title>
  <meta name="description" content="${htmlEscape(seo.description)}">${favicon}${ogImage}
  <style>
${css}
  </style>
</head>
<body id="top">
${bodyHtml}
</body>
</html>
`
}

/* ---------------- exports ---------------- */

/** Single self-contained file: every page stacked, nav uses #page-<slug> anchors. */
export function buildSiteHtml(config: WebsiteConfig): string {
  const body = config.pages
    .map((page, i) => {
      const inner = pageMarkup(config, page, { pageLinks: "anchors" })
      const divider = i === 0 ? "" : `<hr class="ws-divider" style="margin:0">`
      return `${divider}\n<div id="page-${pageSlug(page.path)}" data-page-name="${htmlEscape(page.name)}">\n${inner}\n</div>`
    })
    .join("\n")
  return htmlDocument(config, body)
}

export function deploymentNotes(config: WebsiteConfig): string {
  return `Studio — exported site notes
=============================

Generated: ${new Date().toISOString()}
Site: ${config.siteName}
Pages: ${config.pages.map((p) => `${p.name} (${p.path} -> ${pageSlug(p.path)}.html)`).join(", ")}

What this archive is
--------------------
A fully static site: plain HTML + CSS, no build step, no backend, no tracking.
It was exported from Studio (the free build). Studio itself does NOT host
sites — there is no publishing backend in this build, so "Publish" in the
editor explains how to self-host instead of pretending to deploy.

How to put it online (self-hosting)
-----------------------------------
1. Unzip this archive. index.html is your landing page; every additional
   page is its own .html file next to it.
2. Upload the folder to any static host, e.g.:
   - GitHub Pages (push the folder to a repo, enable Pages)
   - Netlify / Cloudflare Pages (drag & drop the folder)
   - Your own server: copy into your web root (nginx/apache), or see
     docs/DEPLOYMENT.md in the Studio repository for a worked example.
3. Forms are static: the contact section uses a mailto: link. For real form
   submissions connect a form service or a small backend when self-hosting.

Re-editing
----------
assets/project.json is the editable Studio project (DesignDoc JSON). Import
it via Studio to keep editing, or re-export after changes.
`
}

export async function buildSiteZip(config: WebsiteConfig): Promise<Blob> {
  const zip = new JSZip()
  const landing = config.pages[0]
  zip.file("index.html", htmlDocument(config, pageMarkup(config, landing, { pageLinks: "files", currentPagePath: landing.path })))
  const usedSlugs = new Set([pageSlug(landing.path)])
  for (const page of config.pages.slice(1)) {
    let slug = pageSlug(page.path)
    let n = 2
    while (usedSlugs.has(slug)) slug = `${pageSlug(page.path)}-${n++}`
    usedSlugs.add(slug)
    zip.file(`${slug}.html`, htmlDocument(config, pageMarkup(config, page, { pageLinks: "files", currentPagePath: page.path })))
  }
  const assets = zip.folder("assets")
  if (assets) {
    assets.file("NOTES.txt", deploymentNotes(config))
    assets.file("project.json", JSON.stringify(config, null, 2))
  }
  return zip.generateAsync({ type: "blob" })
}

/* ---------------- PNG raster (SVG foreignObject → canvas) ---------------- */

export interface RasterOptions {
  /** css injected into the rasterized document (so classes resolve) */
  css?: string
  /** output pixel width; height follows the element aspect */
  targetWidth?: number
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/**
 * Rasterize a DOM element to a PNG data URL. Images are inlined best-effort
 * (same-origin / CORS-enabled only); iframes become placeholders. If the
 * browser refuses (tainted canvas, huge element, missing APIs) this THROWS —
 * callers must surface an honest error instead of a fake image.
 */
export async function rasterizeElement(el: HTMLElement, opts: RasterOptions = {}): Promise<string> {
  const rectW = Math.max(1, Math.ceil(el.offsetWidth || el.getBoundingClientRect().width))
  const rectH = Math.max(1, Math.ceil(el.offsetHeight || el.getBoundingClientRect().height))
  if (rectW * rectH > 30_000_000) {
    throw new Error("This page is too large to rasterize as PNG. Use the HTML/ZIP export instead.")
  }

  const clone = el.cloneNode(true) as HTMLElement
  // iframes never rasterize inside an SVG image context — replace with placeholders
  clone.querySelectorAll("iframe").forEach((f) => {
    const ph = document.createElement("div")
    ph.setAttribute("style", "width:100%;height:100%;background:#14141a;color:#9ca3af;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:14px;")
    ph.textContent = "Video"
    f.replaceWith(ph)
  })
  // show collapsed <details> content
  clone.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""))
  // remove editor chrome (selection toolbars etc.) and interactive leftovers
  clone.querySelectorAll("[data-chrome],script").forEach((n) => n.remove())

  const imgs = Array.from(clone.querySelectorAll("img"))
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") ?? ""
      if (!src || src.startsWith("data:")) return
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 4000)
        const res = await fetch(src, { signal: ctrl.signal, mode: "cors", credentials: "omit" })
        clearTimeout(timer)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => resolve(String(r.result))
          r.onerror = () => reject(new Error("read failed"))
          r.readAsDataURL(blob)
        })
        img.setAttribute("src", dataUrl)
      } catch {
        img.remove() // honest: cross-origin images simply do not appear in the raster
      }
    }),
  )

  const style = document.createElement("style")
  style.textContent = opts.css ?? ""
  const wrapper = document.createElement("div")
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")
  wrapper.appendChild(style)
  wrapper.appendChild(clone)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rectW}" height="${rectH}"><foreignObject x="0" y="0" width="100%" height="100%">${new XMLSerializer().serializeToString(wrapper)}</foreignObject></svg>`
  const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("svg load failed"))
      img.src = blobUrl
    })
    const scale = clamp((opts.targetWidth ?? rectW * 1.5) / rectW, 0.2, 3)
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(rectW * scale)
    canvas.height = Math.round(rectH * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas 2d unavailable")
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0, rectW, rectH)
    return canvas.toDataURL("image/png")
  } catch {
    throw new Error("PNG rasterization is not available for this content in your browser (usually cross-origin media). Use the HTML/ZIP export instead — it is complete and faithful.")
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}
