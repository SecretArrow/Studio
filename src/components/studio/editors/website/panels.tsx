"use client"

/**
 * Website builder — theme / SEO / custom-CSS editor and the honest
 * "Publish" panel (no fake published state; points to Export + self-hosting).
 */

import { FONT_LIBRARY } from "@/lib/design/presets"
import { AlertTriangle, Download, FileJson, Info, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field } from "./props-editor"
import type { WebsiteConfig } from "@/lib/design/types"

export function ColorField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={label}
          className="h-8 w-9 cursor-pointer rounded border border-border bg-card p-0.5"
        />
        <Input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="h-8 font-mono text-xs" aria-label={`${label} hex`} />
      </div>
    </div>
  )
}

export function FontSelect({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FONT_LIBRARY.map((f) => (
            <SelectItem key={f.family} value={f.family} className="text-xs" style={{ fontFamily: f.family }}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ThemeEditor({ config, onPatch, canEdit }: {
  config: WebsiteConfig
  onPatch: (patch: Partial<WebsiteConfig>) => void
  canEdit: boolean
}) {
  const t = config.theme
  const patchTheme = (p: Partial<WebsiteConfig["theme"]>) => onPatch({ theme: { ...t, ...p } })
  const patchSeo = (p: Partial<WebsiteConfig["seo"]>) => onPatch({ seo: { ...config.seo, ...p } })
  const dis = !canEdit

  return (
    <div className="space-y-5 p-3">
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Colors</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField disabled={dis} label="Primary" value={t.primary} onChange={(v) => patchTheme({ primary: v })} />
          <ColorField disabled={dis} label="Accent" value={t.accent} onChange={(v) => patchTheme({ accent: v })} />
          <ColorField disabled={dis} label="Background" value={t.background} onChange={(v) => patchTheme({ background: v })} />
          <ColorField disabled={dis} label="Text" value={t.text} onChange={(v) => patchTheme({ text: v })} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Typography & shape</h3>
        <FontSelect disabled={dis} label="Heading font" value={t.headingFont} onChange={(v) => patchTheme({ headingFont: v })} />
        <FontSelect disabled={dis} label="Body font" value={t.bodyFont} onChange={(v) => patchTheme({ bodyFont: v })} />
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Corner radius — {t.radius}px</Label>
          <Slider value={[t.radius]} min={0} max={32} step={1} disabled={dis} onValueChange={([r]) => patchTheme({ radius: r })} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">SEO</h3>
        <Field label="Site name"><Input disabled={dis} value={config.siteName} onChange={(e) => onPatch({ siteName: e.target.value })} className="h-8 text-xs" /></Field>
        <Field label="Page title"><Input disabled={dis} value={config.seo.title} onChange={(e) => patchSeo({ title: e.target.value })} className="h-8 text-xs" /></Field>
        <Field label="Meta description">
          <Textarea disabled={dis} rows={3} value={config.seo.description} onChange={(e) => patchSeo({ description: e.target.value })} className="text-xs" />
        </Field>
        <Field label="Favicon URL (optional)"><Input disabled={dis} value={config.seo.favicon ?? ""} onChange={(e) => patchSeo({ favicon: e.target.value || undefined })} className="h-8 text-xs" placeholder="https://…/favicon.png" /></Field>
        <Field label="Social image URL (optional)"><Input disabled={dis} value={config.seo.socialImage ?? ""} onChange={(e) => patchSeo({ socialImage: e.target.value || undefined })} className="h-8 text-xs" placeholder="https://…/og.png" /></Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Custom CSS</h3>
        <Field hint="Appended to the site stylesheet in preview and exports. Sanitized: “</style” and “javascript:” sequences are stripped.">
          <Textarea
            disabled={dis}
            rows={6}
            value={config.customCss ?? ""}
            onChange={(e) => onPatch({ customCss: e.target.value })}
            className="font-mono text-xs"
            placeholder={".ws-card { border-width: 2px; }"}
          />
        </Field>
      </section>
    </div>
  )
}

export function PublishPanel({ onZip, onPng, onJson, busy }: {
  onZip: () => void
  onPng: () => void
  onJson: () => void
  busy: boolean
}) {
  return (
    <div className="space-y-4 p-3">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-xs font-semibold">Hosting is not included in this free build</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Studio has no publishing backend, so there is nothing to “go live” here — and we won&apos;t pretend
            otherwise. Instead, export a real site and host it anywhere you like:
          </p>
        </div>
      </div>

      <ol className="ml-4 list-decimal space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <li>Export the ZIP below — it contains index.html, one .html per extra page and deployment notes.</li>
        <li>Drag the folder into Netlify / Cloudflare Pages, push it to GitHub Pages, or copy it to your own server.</li>
        <li>Step-by-step self-hosting instructions live in <code>docs/DEPLOYMENT.md</code> in the Studio repository.</li>
      </ol>

      <div className="space-y-2">
        <Button className="w-full" disabled={busy} onClick={onZip}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export site ZIP (recommended)
        </Button>
        <Button variant="outline" className="w-full" disabled={busy} onClick={onPng}>
          <Download className="mr-2 h-4 w-4" /> PNG snapshot (current page)
        </Button>
        <Button variant="outline" className="w-full" disabled={busy} onClick={onJson}>
          <FileJson className="mr-2 h-4 w-4" /> Project JSON (re-importable)
        </Button>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          PNG is rendered via SVG rasterization in your browser. If it fails (e.g. cross-origin images), the
          HTML/ZIP export always contains the complete site.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border p-3 text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed">
          The exported site is fully static: semantic sections, responsive CSS, your theme and custom CSS inlined.
          Forms use <code>mailto:</code> links; connect a form service when self-hosting for real submissions.
        </p>
      </div>
    </div>
  )
}
