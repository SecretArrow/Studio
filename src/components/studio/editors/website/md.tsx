"use client"

/**
 * Markdown-lite inline renderer shared by the website richText section and
 * the email text/heading blocks. Supported: paragraphs (blank-line separated),
 * **bold**, *italic* and [label](url) links. Deliberately NOT a full markdown
 * engine — no headers, no raw HTML (keeps preview == export and stays safe).
 */

import type { CSSProperties, ReactNode } from "react"

const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/g

export function mdInline(text: string, opts?: { linkColor?: string; linkStyle?: CSSProperties }): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    if (t.startsWith("**")) {
      out.push(<strong key={k(key++)}>{t.slice(2, -2)}</strong>)
    } else if (t.startsWith("*")) {
      out.push(<em key={k(key++)}>{t.slice(1, -1)}</em>)
    } else {
      const link = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(t)
      if (link) {
        const [, label, href] = link
        const external = !href.startsWith("#") && !href.startsWith("/")
        out.push(
          <a
            key={k(key++)}
            href={href}
            style={opts?.linkColor ? { color: opts.linkColor, ...(opts.linkStyle ?? {}) } : opts?.linkStyle}
            {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
          >
            {label}
          </a>,
        )
      } else {
        out.push(t)
      }
    }
    last = m.index + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function k(i: number): string {
  return `md${i}`
}

export function MdLite({
  text,
  paragraphStyle,
  linkOpts,
}: {
  text: string
  paragraphStyle?: CSSProperties
  linkOpts?: { linkColor?: string; linkStyle?: CSSProperties }
}) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0)
  if (paragraphs.length === 0) return null
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} style={paragraphStyle}>
          {mdInline(p.replace(/\n/g, " "), linkOpts)}
        </p>
      ))}
    </>
  )
}
