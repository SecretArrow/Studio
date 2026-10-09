"use client"

/**
 * Website builder — theme CSS generation + tiny client-side CSS sanitizer.
 * The same stylesheet text is used by the live preview (injected <style>),
 * the exported HTML and the SVG-foreignObject rasterizer, so all three
 * stay visually identical.
 */

import type { WebsiteConfig } from "@/lib/design/types"

/**
 * Strip sequences that could break out of a <style> context or execute:
 * - "</style" closes the tag early
 * - "javascript:" urls
 * - "<script" / "</script" (belt & braces)
 */
export function sanitizeCss(css: string): string {
  return css
    .replace(/<\/?\s*style/gi, "")
    .replace(/<\s*\/?\s*script/gi, "")
    .replace(/javascript\s*:/gi, "")
}

export interface ThemeTokens {
  primary: string
  accent: string
  background: string
  text: string
  headingFont: string
  bodyFont: string
  radius: number
}

export function themeTokens(theme: WebsiteConfig["theme"]): ThemeTokens {
  return theme
}

const BASE_CSS = `
.ws-root, .ws-root * { box-sizing: border-box; }
.ws-root { background: var(--ws-bg); color: var(--ws-text); font-family: var(--ws-body), ui-sans-serif, system-ui, sans-serif; }
.ws-root h1, .ws-root h2, .ws-root h3, .ws-root h4 { font-family: var(--ws-heading), Georgia, serif; line-height: 1.15; margin: 0 0 0.45em; font-weight: 800; color: inherit; }
.ws-root h1 { font-size: clamp(30px, 5vw, 52px); letter-spacing: -0.02em; }
.ws-root h2 { font-size: clamp(24px, 3.4vw, 36px); letter-spacing: -0.015em; }
.ws-root h3 { font-size: 19px; }
.ws-root p { line-height: 1.65; margin: 0 0 1em; font-size: 16px; }
.ws-root a { color: var(--ws-primary); }
.ws-root img { max-width: 100%; display: block; }
.ws-section { padding: 64px 20px; position: relative; }
.ws-container { max-width: 1120px; margin: 0 auto; }
.ws-center { text-align: center; }
.ws-kicker { display: inline-block; letter-spacing: 0.14em; text-transform: uppercase; font-size: 12px; font-weight: 700; color: var(--ws-primary); margin-bottom: 10px; }
.ws-grid { display: grid; gap: 22px; grid-template-columns: repeat(var(--ws-cols, 3), minmax(0, 1fr)); }
.ws-card { background: rgba(127,127,127,0.08); background: color-mix(in srgb, var(--ws-text) 5%, transparent); border: 1px solid rgba(127,127,127,0.22); border: 1px solid color-mix(in srgb, var(--ws-text) 12%, transparent); border-radius: var(--ws-radius); padding: 24px; }
.ws-btn { display: inline-block; background: var(--ws-primary); color: #fff; padding: 12px 26px; border-radius: var(--ws-radius); text-decoration: none; border: none; font: inherit; font-weight: 600; cursor: pointer; }
.ws-btn--ghost { background: transparent; color: var(--ws-primary); box-shadow: inset 0 0 0 2px var(--ws-primary); }
.ws-nav { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; background: var(--ws-bg); }
.ws-nav-links { display: flex; gap: 18px; flex-wrap: wrap; margin-left: auto; }
.ws-nav-links a { color: var(--ws-text); text-decoration: none; font-weight: 500; font-size: 15px; }
.ws-nav-links a:hover { color: var(--ws-primary); }
.ws-media { width: 100%; border-radius: var(--ws-radius); object-fit: cover; }
.ws-muted { opacity: 0.72; }
.ws-divider { border: 0; border-top: 1px solid rgba(127,127,127,0.25); border-top-color: color-mix(in srgb, var(--ws-text) 14%, transparent); margin: 0; }
@media (max-width: 760px) {
  .ws-grid { grid-template-columns: 1fr !important; }
  .ws-section { padding: 44px 16px; }
  .ws-nav-links { margin-left: 0; }
}
`

/** Full stylesheet for preview / export / raster. `scope` is only used to prefix custom css notes. */
export function buildSiteCss(theme: ThemeTokens, customCss: string, opts?: { withMediaQueries?: boolean }): string {
  const vars = `:root {
  --ws-primary: ${theme.primary};
  --ws-accent: ${theme.accent};
  --ws-bg: ${theme.background};
  --ws-text: ${theme.text};
  --ws-radius: ${Math.round(theme.radius)}px;
  --ws-heading: "${theme.headingFont.replace(/"/g, "")}";
  --ws-body: "${theme.bodyFont.replace(/"/g, "")}";
}`
  const media = opts?.withMediaQueries === false ? "" : BASE_CSS
  const custom = customCss.trim() ? `\n/* custom css (sanitized) */\n${sanitizeCss(customCss)}` : ""
  return `${vars}\n${media}${custom}\n`
}
