"use client"

/**
 * Email designer — export HTML builder.
 * The document mirrors the live preview 1:1 (same React tree via
 * renderToStaticMarkup): doctype, preheader hidden div, tables, inline styles.
 */

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { EmailConfig } from "@/lib/design/types"
import { EmailPreview } from "./blocks"
import type { EmailCtx } from "./blocks"

export function buildEmailHtml(config: EmailConfig): string {
  const ctx: EmailCtx = { mode: "export" }
  const body = renderToStaticMarkup(createElement(EmailPreview, { config, ctx }))
  const preheader = config.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${config.backgroundColor};">${escapeHtml(config.preheader)}</div>\n    `
    : ""
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(config.subject)}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background: ${config.backgroundColor}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    a { text-decoration: underline; }
    @media only screen and (max-width: 620px) {
      .em-col { display: block !important; width: 100% !important; max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
      .em-col + .em-col { margin-top: 14px; }
    }
  </style>
</head>
<body style="margin:0; padding:0; word-spacing:normal; background:${config.backgroundColor};">
    ${preheader}${body}
</body>
</html>
`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
