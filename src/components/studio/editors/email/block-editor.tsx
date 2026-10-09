"use client"

/**
 * Email designer — per-block editors (right panel) + email settings panel.
 * Includes a tiny markdown-lite toolbar (bold / italic / link) for text content.
 */

import { useRef } from "react"
import type { EmailBlock, EmailConfig } from "@/lib/design/types"
import { Bold, Italic, Link2, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Field } from "../website/props-editor"
import { ColorField } from "../website/panels"
import { FONT_LIBRARY } from "@/lib/design/presets"
import { SOCIAL_NETWORKS } from "./model"
import type { BlockPropsMap, SocialLink, SocialNetwork } from "./model"

/* ---------------- markdown-lite toolbar ---------------- */

function MdToolbar({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const wrap = (before: string, after: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const selected = value.slice(start, end) || "text"
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }
  return (
    <div className="mb-1.5 flex gap-1">
      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" disabled={disabled} aria-label="Bold" onClick={() => wrap("**", "**")}><Bold className="h-3 w-3" /></Button>
      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" disabled={disabled} aria-label="Italic" onClick={() => wrap("*", "*")}><Italic className="h-3 w-3" /></Button>
      <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" disabled={disabled} aria-label="Link" onClick={() => wrap("[", "](https://)")}><Link2 className="h-3 w-3" /></Button>
      <span className="ml-1 self-center text-[10px] text-muted-foreground">markdown-lite</span>
    </div>
  )
}

function MdArea({ value, onChange, rows = 6, disabled }: { value: string; onChange: (v: string) => void; rows?: number; disabled?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  return (
    <div>
      <MdToolbar value={value} onChange={onChange} disabled={disabled} />
      <Textarea ref={ref} value={value} rows={rows} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="text-xs" />
    </div>
  )
}

/* ---------------- per-kind block editors ---------------- */

function AlignSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="left" className="text-xs">Left</SelectItem>
        <SelectItem value="center" className="text-xs">Center</SelectItem>
        <SelectItem value="right" className="text-xs">Right</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function BlockEditor({ block, onPatch, config, canEdit }: {
  block: EmailBlock
  onPatch: (patch: Record<string, unknown>) => void
  config: EmailConfig
  canEdit: boolean
}) {
  const dis = !canEdit
  const p = block.props as Record<string, unknown>
  const str = (k: string, fb = "") => (typeof p[k] === "string" ? (p[k] as string) : fb)
  const set = (k: string) => (v: string) => onPatch({ [k]: v })
  const nb = (k: string, fb: number) => (typeof p[k] === "number" ? (p[k] as number) : fb)

  switch (block.kind) {
    case "heading":
      return (
        <>
          <Field label="Text"><Input value={str("text")} disabled={dis} onChange={(e) => set("text")(e.target.value)} className="h-8 text-xs" /></Field>
          <Field label={`Size — ${nb("size", 26)}px`}>
            <Slider value={[nb("size", 26)]} min={12} max={56} step={1} disabled={dis} onValueChange={([v]) => onPatch({ size: v })} />
          </Field>
          <Field label="Alignment"><AlignSelect disabled={dis} value={str("align", "left")} onChange={set("align")} /></Field>
          <ColorField label="Color (empty = body color)" value={str("color")} onChange={set("color")} disabled={dis} />
        </>
      )
    case "text":
      return (
        <>
          <Field label="Content"><MdArea value={str("content")} disabled={dis} onChange={set("content")} rows={8} /></Field>
          <Field label="Alignment"><AlignSelect disabled={dis} value={str("align", "left")} onChange={set("align")} /></Field>
          <p className="text-[10px] text-muted-foreground">**bold**, *italic*, [label](https://url) — rendered inline, exported as email-safe HTML.</p>
        </>
      )
    case "image":
      return (
        <>
          <Field label="Image URL"><Input value={str("src")} placeholder="https://…" disabled={dis} onChange={(e) => set("src")(e.target.value)} className="h-8 text-xs" /></Field>
          <Field label="Alt text"><Input value={str("alt")} disabled={dis} onChange={(e) => set("alt")(e.target.value)} className="h-8 text-xs" /></Field>
          <Field label="Link (optional)"><Input value={str("href")} disabled={dis} onChange={(e) => set("href")(e.target.value)} className="h-8 text-xs" /></Field>
          <Field label={`Width — ${nb("width", 100)}%`}>
            <Slider value={[nb("width", 100)]} min={20} max={100} step={5} disabled={dis} onValueChange={([v]) => onPatch({ width: v })} />
          </Field>
        </>
      )
    case "button":
      return (
        <>
          <Field label="Label"><Input value={str("text")} disabled={dis} onChange={(e) => set("text")(e.target.value)} className="h-8 text-xs" /></Field>
          <Field label="Link"><Input value={str("href")} disabled={dis} onChange={(e) => set("href")(e.target.value)} className="h-8 text-xs" /></Field>
          <ColorField label="Background (empty = accent)" value={str("bg")} onChange={set("bg")} disabled={dis} />
          <Field label={`Corner radius — ${nb("radius", 8)}px`}>
            <Slider value={[nb("radius", 8)]} min={0} max={28} step={1} disabled={dis} onValueChange={([v]) => onPatch({ radius: v })} />
          </Field>
          <Field label="Alignment"><AlignSelect disabled={dis} value={str("align", "center")} onChange={set("align")} /></Field>
        </>
      )
    case "divider":
      return (
        <>
          <ColorField label="Color (empty = default grey)" value={str("color")} onChange={set("color")} disabled={dis} />
          <Field label={`Thickness — ${nb("thickness", 1)}px`}>
            <Slider value={[nb("thickness", 1)]} min={1} max={8} step={1} disabled={dis} onValueChange={([v]) => onPatch({ thickness: v })} />
          </Field>
        </>
      )
    case "spacer":
      return (
        <Field label={`Height — ${nb("height", 24)}px`}>
          <Slider value={[nb("height", 24)]} min={4} max={160} step={4} disabled={dis} onValueChange={([v]) => onPatch({ height: v })} />
        </Field>
      )
    case "social": {
      const links = (Array.isArray(p.links) ? p.links : []) as SocialLink[]
      const has = (n: SocialNetwork) => links.some((l) => l.network === n)
      const toggle = (n: SocialNetwork, on: boolean) => {
        const next = on
          ? [...links, { network: n, href: `https://${n === "x" ? "x" : n}.com/yourhandle` }]
          : links.filter((l) => l.network !== n)
        onPatch({ links: next })
      }
      const setHref = (n: SocialNetwork, href: string) => {
        onPatch({ links: links.map((l) => (l.network === n ? { ...l, href } : l)) })
      }
      return (
        <Field label="Networks & links" hint="Rendered as tappable pill links — the most reliable pattern across email clients (SVG logos get blocked).">
          <div className="space-y-2">
            {SOCIAL_NETWORKS.map((n) => (
              <div key={n} className="rounded-lg border p-2">
                <label className="flex items-center justify-between text-xs font-medium">
                  {n === "x" ? "X / Twitter" : n.charAt(0).toUpperCase() + n.slice(1)}
                  <input type="checkbox" checked={has(n)} disabled={dis} onChange={(e) => toggle(n, e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" aria-label={`Include ${n}`} />
                </label>
                {has(n) && (
                  <Input
                    value={links.find((l) => l.network === n)?.href ?? ""}
                    disabled={dis}
                    placeholder="https://…"
                    onChange={(e) => setHref(n, e.target.value)}
                    className="mt-1.5 h-8 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </Field>
      )
    }
    case "columns":
      return (
        <>
          <Field label="Left column"><MdArea value={str("left")} disabled={dis} onChange={set("left")} rows={5} /></Field>
          <Field label="Right column"><MdArea value={str("right")} disabled={dis} onChange={set("right")} rows={5} /></Field>
          <p className="text-[10px] text-muted-foreground">Columns stack vertically on narrow screens in supporting clients.</p>
        </>
      )
    case "html":
      return (
        <Field label="Raw HTML" hint="Sanitized on render & export: <script>, <style>, iframes, on*= handlers and javascript: URLs are stripped.">
          <Textarea value={str("code")} rows={8} disabled={dis} onChange={(e) => set("code")(e.target.value)} className="font-mono text-xs" placeholder="<p>Hello <strong>world</strong></p>" />
        </Field>
      )
    default:
      return <p className="text-xs text-muted-foreground">No settings for this block.</p>
  }
}

/* ---------------- settings panel ---------------- */

export function EmailSettings({ config, onPatch, canEdit }: {
  config: EmailConfig
  onPatch: (patch: Partial<EmailConfig>) => void
  canEdit: boolean
}) {
  const dis = !canEdit
  return (
    <div className="space-y-4 p-3">
      <Field label="Subject line"><Input disabled={dis} value={config.subject} onChange={(e) => onPatch({ subject: e.target.value })} className="h-8 text-xs" /></Field>
      <Field label="Preheader" hint="Hidden preview text shown after the subject in most inboxes.">
        <Input disabled={dis} value={config.preheader} onChange={(e) => onPatch({ preheader: e.target.value })} className="h-8 text-xs" />
      </Field>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Colors</h3>
        <ColorField disabled={dis} label="Page background" value={config.backgroundColor} onChange={(v) => onPatch({ backgroundColor: v })} />
        <ColorField disabled={dis} label="Card background" value={config.contentBackground} onChange={(v) => onPatch({ contentBackground: v })} />
        <ColorField disabled={dis} label="Text" value={config.textColor} onChange={(v) => onPatch({ textColor: v })} />
        <ColorField disabled={dis} label="Accent (links/buttons)" value={config.accentColor} onChange={(v) => onPatch({ accentColor: v })} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Typography & layout</h3>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Font</Label>
          <Select disabled={dis} value={config.fontFamily} onValueChange={(v) => onPatch({ fontFamily: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_LIBRARY.map((f) => (
                <SelectItem key={f.family} value={f.family} className="text-xs">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">Exported with web-safe fallbacks — if a subscriber&apos;s client blocks web fonts, Helvetica/Arial takes over.</p>
        </div>
        <Field label={`Card width — ${config.width}px`}>
          <Slider value={[config.width]} min={480} max={700} step={10} disabled={dis} onValueChange={([w]) => onPatch({ width: w })} />
        </Field>
      </section>
    </div>
  )
}

/* ---------------- palette button ---------------- */

export function PaletteButton({ label, hint, icon: Icon, disabled, onClick }: {
  label: string
  hint: string
  icon: typeof Plus
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
        "hover:border-primary/50 hover:bg-accent disabled:opacity-50",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-xs font-medium">{label}</span>
        <span className="block truncate text-[10px] text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}

export function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button variant="outline" size="sm" className="h-8 flex-1 text-xs text-destructive" onClick={onClick}>
      <Trash2 className="h-3.5 w-3.5" /> {label}
    </Button>
  )
}
