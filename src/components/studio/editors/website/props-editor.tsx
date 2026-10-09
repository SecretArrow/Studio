"use client"

/**
 * Website builder — per-section property editors (right panel).
 * Typed forms per section kind + a generic repeatable item list.
 */

import type { ReactNode } from "react"
import type { WebsiteSection } from "@/lib/design/types"
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { FEATURE_ICONS } from "./model"
import type { SectionKind, SectionPropsMap } from "./model"
import { sectionDef } from "./model"
import { FeatureIcon } from "./sections"

/* ---------------- small field helpers ---------------- */

export function Field({ label, children, hint }: { label?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      {label ? <Label className="text-xs font-medium text-muted-foreground">{label}</Label> : null}
      {children}
      {hint ? <p className="text-[10px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return <Input value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
}

function MultiLine({ value, onChange, rows = 3, placeholder, mono, disabled }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; mono?: boolean; disabled?: boolean }) {
  return <Textarea value={value} rows={rows} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cn("text-xs", mono && "font-mono")} />
}

function EnumSelect({ value, options, onChange, disabled }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
    </Select>
  )
}

/* ---------------- generic item list ---------------- */

export function ItemList<T>({ items, onChange, make, render, addLabel, emptyHint, canEdit }: {
  items: T[]
  onChange: (items: T[]) => void
  make: () => T
  render: (item: T, patch: (p: Partial<T>) => void, index: number) => ReactNode
  addLabel: string
  emptyHint?: string
  canEdit: boolean
}) {
  const move = (i: number, delta: number) => {
    const next = [...items]
    const j = i + delta
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {items.length === 0 && emptyHint ? <p className="rounded-md border border-dashed p-3 text-center text-[11px] text-muted-foreground">{emptyHint}</p> : null}
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border bg-background/50 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Item {i + 1}</span>
            {canEdit && (
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Duplicate" onClick={() => onChange([...items.slice(0, i + 1), { ...item }, ...items.slice(i + 1)])}><Copy className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" aria-label="Remove" onClick={() => onChange(items.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            )}
          </div>
          {render(item, (p) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it))), i)}
        </div>
      ))}
      {canEdit && (
        <Button variant="outline" size="sm" className="h-8 w-full text-xs" onClick={() => onChange([...items, make()])}>
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </Button>
      )}
    </div>
  )
}

/* ---------------- dispatcher ---------------- */

export function SectionPropsEditor({ section, onPatch, canEdit }: {
  section: WebsiteSection
  onPatch: (patch: Record<string, unknown>) => void
  canEdit: boolean
}) {
  const kind = section.kind
  const p = section.props as SectionPropsMap[SectionKind]
  const def = sectionDef(kind)
  const set = (key: string) => (v: string) => onPatch({ [key]: v })

  const dis = !canEdit

  switch (kind) {
    case "nav": {
      const props = p as SectionPropsMap["nav"]
      return (
        <>
          <Field label="Brand"><TextInput value={props.brand} onChange={set("brand")} disabled={dis} /></Field>
          <Field label="Menu links">
            <ItemList
              items={props.links}
              canEdit={canEdit}
              addLabel="Add link"
              emptyHint="No links yet."
              make={() => ({ label: "New link", href: "#" })}
              onChange={(links) => onPatch({ links })}
              render={(item, patch) => (
                <div className="grid grid-cols-2 gap-2">
                  <TextInput value={item.label} placeholder="Label" disabled={dis} onChange={(v) => patch({ label: v })} />
                  <TextInput value={item.href} placeholder="#section or #/path" disabled={dis} onChange={(v) => patch({ href: v })} />
                </div>
              )}
            />
          </Field>
          <p className="text-[10px] text-muted-foreground">Tip: links like <code>#features</code> scroll to sections; <code>#/about</code> opens the page with path /about.</p>
        </>
      )
    }

    case "hero": {
      const props = p as SectionPropsMap["hero"]
      return (
        <>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Subtitle"><MultiLine value={props.subtitle} rows={3} disabled={dis} onChange={set("subtitle")} /></Field>
          <Field label="Image URL" hint="Optional. Shown beside the text (stacks on mobile)."><TextInput value={props.imageUrl} disabled={dis} onChange={set("imageUrl")} /></Field>
          <Field label="Button text"><TextInput value={props.ctaText} disabled={dis} onChange={set("ctaText")} /></Field>
          <Field label="Button link"><TextInput value={props.ctaHref} disabled={dis} onChange={set("ctaHref")} /></Field>
          <Field label="Alignment">
            <EnumSelect disabled={dis} value={props.align} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }]} onChange={set("align")} />
          </Field>
        </>
      )
    }

    case "features": {
      const props = p as SectionPropsMap["features"]
      return (
        <>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Feature cards">
            <ItemList
              items={props.items}
              canEdit={canEdit}
              addLabel="Add feature"
              emptyHint="No features yet — add your first card."
              make={() => ({ icon: "sparkles", title: "New feature", text: "" })}
              onChange={(items) => onPatch({ items })}
              render={(item, patch) => (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><FeatureIcon name={item.icon} size={16} /></div>
                    <EnumSelect
                      disabled={dis}
                      value={item.icon}
                      options={FEATURE_ICONS.map((ic) => ({ value: ic, label: ic }))}
                      onChange={(v) => patch({ icon: v })}
                    />
                  </div>
                  <TextInput value={item.title} placeholder="Title" disabled={dis} onChange={(v) => patch({ title: v })} />
                  <MultiLine value={item.text} rows={2} placeholder="Description" disabled={dis} onChange={(v) => patch({ text: v })} />
                </div>
              )}
            />
          </Field>
        </>
      )
    }

    case "gallery": {
      const props = p as SectionPropsMap["gallery"]
      return (
        <>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Images">
            <ItemList
              items={props.images}
              canEdit={canEdit}
              addLabel="Add image"
              emptyHint="No images yet."
              make={() => ({ src: "", alt: "" })}
              onChange={(images) => onPatch({ images })}
              render={(item, patch) => (
                <div className="space-y-2">
                  {item.src ? <img src={item.src} alt={item.alt || "Preview"} className="h-20 w-full rounded-md border object-cover" /> : null}
                  <TextInput value={item.src} placeholder="Image URL" disabled={dis} onChange={(v) => patch({ src: v })} />
                  <TextInput value={item.alt} placeholder="Alt text" disabled={dis} onChange={(v) => patch({ alt: v })} />
                </div>
              )}
            />
          </Field>
        </>
      )
    }

    case "video": {
      const props = p as SectionPropsMap["video"]
      return (
        <>
          <Field label="Video URL" hint="YouTube, Vimeo or any direct https URL."><TextInput value={props.url} disabled={dis} onChange={set("url")} /></Field>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Caption"><TextInput value={props.caption} disabled={dis} onChange={set("caption")} /></Field>
        </>
      )
    }

    case "testimonials": {
      const props = p as SectionPropsMap["testimonials"]
      return (
        <>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Quotes">
            <ItemList
              items={props.items}
              canEdit={canEdit}
              addLabel="Add testimonial"
              emptyHint="No testimonials yet."
              make={() => ({ quote: "", author: "", role: "", avatarUrl: "" })}
              onChange={(items) => onPatch({ items })}
              render={(item, patch) => (
                <div className="space-y-2">
                  <MultiLine value={item.quote} rows={3} placeholder="Quote" disabled={dis} onChange={(v) => patch({ quote: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput value={item.author} placeholder="Author" disabled={dis} onChange={(v) => patch({ author: v })} />
                    <TextInput value={item.role} placeholder="Role, company" disabled={dis} onChange={(v) => patch({ role: v })} />
                  </div>
                  <TextInput value={item.avatarUrl} placeholder="Avatar URL (optional)" disabled={dis} onChange={(v) => patch({ avatarUrl: v })} />
                </div>
              )}
            />
          </Field>
        </>
      )
    }

    case "pricing": {
      const props = p as SectionPropsMap["pricing"]
      return (
        <>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Subtitle"><TextInput value={props.subtitle} disabled={dis} onChange={set("subtitle")} /></Field>
          <Field label="Plans">
            <ItemList
              items={props.plans}
              canEdit={canEdit}
              addLabel="Add plan"
              emptyHint="No plans yet."
              make={() => ({ name: "New plan", price: "$9", period: "/mo", features: ["Feature one"], highlighted: false })}
              onChange={(plans) => onPatch({ plans })}
              render={(item, patch) => (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <TextInput value={item.name} placeholder="Name" disabled={dis} onChange={(v) => patch({ name: v })} />
                    <TextInput value={item.price} placeholder="$0" disabled={dis} onChange={(v) => patch({ price: v })} />
                    <TextInput value={item.period} placeholder="/mo" disabled={dis} onChange={(v) => patch({ period: v })} />
                  </div>
                  <MultiLine value={item.features.join("\n")} rows={3} placeholder={"One feature per line"} disabled={dis} onChange={(v) => patch({ features: v.split("\n") })} />
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox checked={item.highlighted} disabled={dis} onCheckedChange={(v) => patch({ highlighted: v === true })} />
                    Highlight this plan
                  </label>
                </div>
              )}
            />
          </Field>
        </>
      )
    }

    case "faq": {
      const props = p as SectionPropsMap["faq"]
      return (
        <>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Questions">
            <ItemList
              items={props.items}
              canEdit={canEdit}
              addLabel="Add question"
              emptyHint="No questions yet."
              make={() => ({ q: "New question?", a: "" })}
              onChange={(items) => onPatch({ items })}
              render={(item, patch) => (
                <div className="space-y-2">
                  <TextInput value={item.q} placeholder="Question" disabled={dis} onChange={(v) => patch({ q: v })} />
                  <MultiLine value={item.a} rows={3} placeholder="Answer" disabled={dis} onChange={(v) => patch({ a: v })} />
                </div>
              )}
            />
          </Field>
        </>
      )
    }

    case "cta": {
      const props = p as SectionPropsMap["cta"]
      return (
        <>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Text"><MultiLine value={props.text} rows={2} disabled={dis} onChange={set("text")} /></Field>
          <Field label="Button text"><TextInput value={props.button} disabled={dis} onChange={set("button")} /></Field>
          <p className="text-[10px] text-muted-foreground">The button links to the top of the page (#top) in the exported site.</p>
        </>
      )
    }

    case "contact": {
      const props = p as SectionPropsMap["contact"]
      return (
        <>
          <Field label="Title"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Note" hint="Markdown-lite. Include an email address — the button becomes a mailto: link."><MultiLine value={props.emailNote} rows={3} disabled={dis} onChange={set("emailNote")} /></Field>
          <Field label="Form fields (one per line)">
            <MultiLine value={props.fields.join("\n")} rows={4} disabled={dis} onChange={(v) => onPatch({ fields: v.split("\n") })} />
          </Field>
          <p className="text-[10px] text-muted-foreground">Static sites cannot process form posts — the exported form links to your email. Connect a form service when self-hosting.</p>
        </>
      )
    }

    case "footer": {
      const props = p as SectionPropsMap["footer"]
      return (
        <>
          <Field label="Text"><TextInput value={props.text} disabled={dis} onChange={set("text")} /></Field>
          <Field label="Links">
            <ItemList
              items={props.links}
              canEdit={canEdit}
              addLabel="Add link"
              emptyHint="No links yet."
              make={() => ({ label: "Link", href: "#" })}
              onChange={(links) => onPatch({ links })}
              render={(item, patch) => (
                <div className="grid grid-cols-2 gap-2">
                  <TextInput value={item.label} placeholder="Label" disabled={dis} onChange={(v) => patch({ label: v })} />
                  <TextInput value={item.href} placeholder="Href" disabled={dis} onChange={(v) => patch({ href: v })} />
                </div>
              )}
            />
          </Field>
        </>
      )
    }

    case "richText": {
      const props = p as SectionPropsMap["richText"]
      return (
        <>
          <Field label="Title (optional)"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Body" hint="Blank line = new paragraph. **bold**, *italic*, [link](https://…). Raw HTML is not rendered.">
            <MultiLine value={props.markdown} rows={10} disabled={dis} onChange={set("markdown")} />
          </Field>
        </>
      )
    }

    case "logos": {
      const props = p as SectionPropsMap["logos"]
      return (
        <>
          <Field label="Title (optional)"><TextInput value={props.title} disabled={dis} onChange={set("title")} /></Field>
          <Field label="Logos">
            <ItemList
              items={props.items}
              canEdit={canEdit}
              addLabel="Add logo"
              emptyHint="No logos yet."
              make={() => ({ name: "Company", imageUrl: "" })}
              onChange={(items) => onPatch({ items })}
              render={(item, patch) => (
                <div className="space-y-2">
                  <TextInput value={item.name} placeholder="Name (used when no image)" disabled={dis} onChange={(v) => patch({ name: v })} />
                  <TextInput value={item.imageUrl} placeholder="Logo image URL (optional)" disabled={dis} onChange={(v) => patch({ imageUrl: v })} />
                </div>
              )}
            />
          </Field>
        </>
      )
    }

    case "stats": {
      const props = p as SectionPropsMap["stats"]
      return (
        <Field label="Stats">
          <ItemList
            items={props.items}
            canEdit={canEdit}
            addLabel="Add stat"
            emptyHint="No stats yet."
            make={() => ({ value: "100+", label: "Label" })}
            onChange={(items) => onPatch({ items })}
            render={(item, patch) => (
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={item.value} placeholder="Value" disabled={dis} onChange={(v) => patch({ value: v })} />
                <TextInput value={item.label} placeholder="Label" disabled={dis} onChange={(v) => patch({ label: v })} />
              </div>
            )}
          />
        </Field>
      )
    }

    default:
      return <p className="text-xs text-muted-foreground">This section has no editable properties{def ? "" : " (unknown kind)"}.</p>
  }
}
