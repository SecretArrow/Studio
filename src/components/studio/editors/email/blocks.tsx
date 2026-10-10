"use client"

/**
 * Email designer — email-safe block renderers.
 * Everything is table-based with inline styles only (no flex/grid, no classes
 * except the mobile-stacking `.em-col` hook), so the live preview, the copied
 * HTML and the exported file are pixel-identical.
 */

import type { MouseEvent } from "react"
import type { EmailBlock, EmailConfig } from "@/lib/design/types"
import { MdLite } from "../website/md"
import type { BlockPropsMap } from "./model"
import { fontStack } from "./model"

/** Strip script-execution vectors from user "html" blocks (same spirit as api-utils sanitizeSvg). */
export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|form|meta|link)[^>]*>(?:[\s\S]*?<\/\1>)?/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"')
    .replace(/javascript\s*:/gi, "")
}

export interface EmailCtx {
  mode: "preview" | "export"
  /** preview click interceptor; undefined in export */
  onLinkClick?: (href: string, e: MouseEvent<HTMLAnchorElement>) => void
}

function Link({ href, ctx, style, children }: { href: string; ctx: EmailCtx; style?: React.CSSProperties; children: React.ReactNode }) {
  const onLinkClick = ctx.onLinkClick
  return (
    <a href={href} style={style} onClick={onLinkClick ? (e) => onLinkClick(href, e) : undefined} target={!href.startsWith("#") && !href.startsWith("mailto:") ? "_blank" : undefined} rel="noreferrer noopener">
      {children}
    </a>
  )
}

function BlockRow({ block, config, ctx }: { block: EmailBlock; config: EmailConfig; ctx: EmailCtx }) {
  const fam = fontStack(config.fontFamily)
  const textColor = config.textColor
  const accent = config.accentColor
  const sidePad = 32

  switch (block.kind) {
    case "heading": {
      const p = block.props as BlockPropsMap["heading"]
      return (
        <tr>
          <td style={{ padding: `20px ${sidePad}px 4px`, textAlign: p.align }}>
            <div style={{ fontFamily: fam, fontSize: p.size, fontWeight: 700, lineHeight: 1.25, color: p.color || textColor, margin: 0 }}>{p.text}</div>
          </td>
        </tr>
      )
    }
    case "text": {
      const p = block.props as BlockPropsMap["text"]
      return (
        <tr>
          <td style={{ padding: `8px ${sidePad}px`, textAlign: p.align }}>
            <div style={{ fontFamily: fam, fontSize: 15, lineHeight: 1.65, color: textColor }}>
              <MdLite
                text={p.content}
                paragraphStyle={{ margin: "0 0 12px", textAlign: p.align }}
                linkOpts={{ linkColor: accent }}
              />
            </div>
          </td>
        </tr>
      )
    }
    case "image": {
      const p = block.props as BlockPropsMap["image"]
      const img = p.src ? (
        <img src={p.src} alt={p.alt || ""} width={config.width} style={{ width: `${p.width}%`, maxWidth: "100%", height: "auto", display: "block", margin: "0 auto", borderRadius: 4, border: "0" }} />
      ) : (
        <div style={{ width: "100%", padding: "28px 0", textAlign: "center", background: "#f3f4f6", color: "#9ca3af", fontFamily: fam, fontSize: 12, borderRadius: 4 }}>Image block — add an image URL</div>
      )
      return (
        <tr>
          <td style={{ padding: "12px 32px" }}>
            {p.href ? <Link href={p.href} ctx={ctx}>{img}</Link> : img}
          </td>
        </tr>
      )
    }
    case "button": {
      const p = block.props as BlockPropsMap["button"]
      const bg = p.bg || accent
      return (
        <tr>
          <td align={p.align} style={{ padding: "14px 32px" }}>
            <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ background: bg, borderRadius: p.radius }} align="center">
                    <Link
                      href={p.href || "#"}
                      ctx={ctx}
                      style={{ display: "inline-block", padding: "12px 28px", fontFamily: fam, fontSize: 15, fontWeight: 700, color: "#ffffff", textDecoration: "none", borderRadius: p.radius }}
                    >
                      {p.text}
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      )
    }
    case "divider": {
      const p = block.props as BlockPropsMap["divider"]
      return (
        <tr>
          <td style={{ padding: "10px 32px" }}>
            <div style={{ borderTop: `${p.thickness}px solid ${p.color || "#e5e7eb"}`, fontSize: 0, lineHeight: 0 }}>&nbsp;</div>
          </td>
        </tr>
      )
    }
    case "spacer": {
      const p = block.props as BlockPropsMap["spacer"]
      return (
        <tr>
          <td style={{ height: p.height, lineHeight: `${p.height}px`, fontSize: 0 }}>&nbsp;</td>
        </tr>
      )
    }
    case "social": {
      const p = block.props as BlockPropsMap["social"]
      const label = (n: string) => n.charAt(0).toUpperCase() + n.slice(1)
      return (
        <tr>
          <td align="center" style={{ padding: "14px 32px" }}>
            {p.links.length === 0 ? (
              <span style={{ fontFamily: fam, fontSize: 12, color: "#9ca3af" }}>Social block — add links in the block settings</span>
            ) : (
              p.links.map((l, i) => (
                <Link
                  key={i}
                  href={l.href}
                  ctx={ctx}
                  style={{
                    display: "inline-block", margin: "3px 4px", padding: "7px 14px", background: accent, color: "#ffffff",
                    borderRadius: 15, fontFamily: fam, fontSize: 12, fontWeight: 600, textDecoration: "none",
                  }}
                >
                  {label(l.network)}
                </Link>
              ))
            )}
          </td>
        </tr>
      )
    }
    case "columns": {
      const p = block.props as BlockPropsMap["columns"]
      const cell = (content: string): React.ReactNode => (
        <div style={{ fontFamily: fam, fontSize: 14, lineHeight: 1.6, color: textColor }}>
          <MdLite text={content} paragraphStyle={{ margin: "0 0 10px" }} linkOpts={{ linkColor: accent }} />
        </div>
      )
      return (
        <tr>
          <td style={{ padding: "10px 32px" }}>
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td className="em-col" width="50%" valign="top" style={{ paddingRight: 12 }}>{cell(p.left)}</td>
                  <td className="em-col" width="50%" valign="top" style={{ paddingLeft: 12 }}>{cell(p.right)}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      )
    }
    case "html": {
      const p = block.props as BlockPropsMap["html"]
      return (
        <tr>
          <td style={{ padding: "10px 32px", fontFamily: fam, fontSize: 14, lineHeight: 1.6, color: textColor }}>
            {p.code.trim() ? <div dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(p.code) }} /> : <span style={{ color: "#9ca3af", fontSize: 12 }}>HTML block — paste code in the block settings</span>}
          </td>
        </tr>
      )
    }
    default:
      return null
  }
}

/** The complete email body — used verbatim for preview, copy-HTML and export. */
export function EmailPreview({ config, ctx }: { config: EmailConfig; ctx: EmailCtx }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ background: config.backgroundColor, borderCollapse: "collapse" }}>
      <tbody>
        <tr>
          <td align="center" style={{ padding: "28px 12px" }}>
            <table
              role="presentation"
              width={config.width}
              cellPadding={0}
              cellSpacing={0}
              border={0}
              style={{ width: "100%", maxWidth: `${config.width}px`, background: config.contentBackground, borderCollapse: "collapse", borderRadius: 10, overflow: "hidden" }}
            >
              <tbody>
                {config.blocks.length === 0 ? (
                  <tr>
                    <td style={{ padding: "48px 32px", textAlign: "center", color: "#9ca3af", fontFamily: fontStack(config.fontFamily), fontSize: 13 }}>
                      Empty email — add blocks from the Blocks panel.
                    </td>
                  </tr>
                ) : (
                  config.blocks.map((b) => <BlockRow key={b.id} block={b} config={config} ctx={ctx} />)
                )}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
