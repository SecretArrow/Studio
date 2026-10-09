"use client"

/**
* Video editor — properties panel.
* Three tabs: selected clip properties (speed/volume/fades/transitions),
* text & sticker overlays, and the subtitle list with SRT import/export.
*/

import { useState } from "react"
import type { ReactNode } from "react"
import type { VideoClip, VideoConfig } from "@/lib/design/types"
import { SPEEDS, STICKERS, fmtClock } from "./model"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Captions, Download, FileUp, Plus, Smile, Sticker, Trash2, Type as TypeIcon, Upload, Link2 } from "lucide-react"

interface PropertiesPanelProps {
  config: VideoConfig
  selected: VideoClip | null
  canEdit: boolean
  playheadMs: number
  onPatchClip: (id: string, patch: Partial<VideoClip>, coalesceKey?: string) => void
  onAddText: () => void
  onAddSticker: (char: string) => void
  onAddSubtitle: () => void
  onPatchSubtitle: (index: number, patch: Partial<{ start: number; end: number; text: string }>) => void
  onDeleteSubtitle: (index: number) => void
  onImportSrt: (text: string) => void
  onDownloadSrt: () => void
  isDead: (clipId: string) => boolean
  onRelink: (clipId: string) => void
  onDeleteClip: (id: string) => void
}

const sec = (ms: number) => Math.round(ms / 100) / 10

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function PropertiesPanel(props: PropertiesPanelProps) {
  const { config, selected, canEdit, playheadMs, onPatchClip, onAddText, onAddSticker, onAddSubtitle, onPatchSubtitle, onDeleteSubtitle, onImportSrt, onDownloadSrt, isDead, onRelink, onDeleteClip } = props
  const [srtText, setSrtText] = useState("")
  const [showSrtImport, setShowSrtImport] = useState(false)

  const textClip = selected && (selected.kind === "text" || selected.kind === "sticker") ? selected : null
  const rawEl = (textClip?.element ?? {}) as Record<string, unknown>
  const patchTextEl = (patch: Record<string, unknown>) => {
    if (!textClip) return
    onPatchClip(textClip.id, { element: { ...rawEl, ...patch } }, `textel:${textClip.id}`)
  }
  const subs = config.subtitles ?? []

  return (
    <Tabs defaultValue="clip" className="flex min-h-0 flex-1 flex-col gap-0">
      <TabsList className="mx-3 mt-3 w-fit shrink-0">
        <TabsTrigger value="clip">Clip</TabsTrigger>
        <TabsTrigger value="text">Text</TabsTrigger>
        <TabsTrigger value="subs">
          Subtitles{subs.length > 0 && <span className="ml-1 rounded bg-primary/15 px-1 text-[10px]">{subs.length}</span>}
        </TabsTrigger>
      </TabsList>

      {/* ---------------- clip properties ---------------- */}
      <TabsContent value="clip" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-3">
            {!selected && (
              <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Select a clip on the timeline to edit its properties.
              </p>
            )}
            {selected && (
              <>
                {isDead(selected.id) && (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs">
                    <span className="text-amber-900 dark:text-amber-200">Media link is broken (new browser session).</span>
                    <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => onRelink(selected.id)}>
                      <Link2 className="h-3 w-3" /> Relink
                    </Button>
                  </div>
                )}
                <Field label="Name">
                  <Input value={selected.name} className="h-8 text-xs" disabled={!canEdit} onChange={(e) => onPatchClip(selected.id, { name: e.target.value }, `name:${selected.id}`)} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Start (s)">
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={sec(selected.start)}
                      disabled={!canEdit}
                      className="h-8 text-xs"
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (Number.isFinite(v) && v >= 0) onPatchClip(selected.id, { start: Math.round(v * 1000) }, `start:${selected.id}`)
                      }}
                    />
                  </Field>
                  <Field label="Duration (s)">
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={sec(selected.duration)}
                      disabled={!canEdit}
                      className="h-8 text-xs"
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (Number.isFinite(v) && v > 0) {
                          const duration = Math.max(100, Math.round(v * 1000))
                          onPatchClip(selected.id, { duration, outPoint: Math.round(selected.inPoint + duration * selected.speed) }, `dur:${selected.id}`)
                        }
                      }}
                    />
                  </Field>
                </div>
                <Field label="Speed">
                  <Select
                    value={String(selected.speed)}
                    disabled={!canEdit}
                    onValueChange={(v) => {
                      const speed = parseFloat(v)
                      onPatchClip(selected.id, { speed, outPoint: Math.round(selected.inPoint + selected.duration * speed) })
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPEEDS.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}×</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {(selected.kind === "video" || selected.kind === "audio") && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Volume</Label>
                      <Switch checked={selected.muted} disabled={!canEdit} onCheckedChange={(v) => onPatchClip(selected.id, { muted: v })} aria-label="Mute clip" />
                    </div>
                    <Slider
                      value={[Math.round(selected.volume * 100)]}
                      min={0}
                      max={100}
                      step={1}
                      disabled={!canEdit || selected.muted}
                      onValueChange={([v]) => onPatchClip(selected.id, { volume: v / 100 }, `vol:${selected.id}`)}
                      aria-label="Clip volume"
                    />
                  </>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Field label={`Fade in · ${fmtClock(selected.fadeIn)}`}>
                    <Slider value={[selected.fadeIn]} min={0} max={3000} step={50} disabled={!canEdit} onValueChange={([v]) => onPatchClip(selected.id, { fadeIn: v }, `fin:${selected.id}`)} aria-label="Fade in" />
                  </Field>
                  <Field label={`Fade out · ${fmtClock(selected.fadeOut)}`}>
                    <Slider value={[selected.fadeOut]} min={0} max={3000} step={50} disabled={!canEdit} onValueChange={([v]) => onPatchClip(selected.id, { fadeOut: v }, `fout:${selected.id}`)} aria-label="Fade out" />
                  </Field>
                </div>

                {selected.kind !== "audio" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Transition in">
                      <Select value={selected.transitionIn ?? "none"} disabled={!canEdit} onValueChange={(v) => onPatchClip(selected.id, { transitionIn: v as VideoClip["transitionIn"] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="fade">Fade</SelectItem>
                          <SelectItem value="slide">Slide</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Transition out">
                      <Select value={selected.transitionOut ?? "none"} disabled={!canEdit} onValueChange={(v) => onPatchClip(selected.id, { transitionOut: v as VideoClip["transitionOut"] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="fade">Fade</SelectItem>
                          <SelectItem value="slide">Slide</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}

                <Button variant="outline" size="sm" className="h-8 w-full gap-1 text-destructive" disabled={!canEdit} onClick={() => onDeleteClip(selected.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete clip
                </Button>
              </>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      {/* ---------------- text & stickers ---------------- */}
      <TabsContent value="text" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-3">
            <Button size="sm" className="h-9 w-full gap-1.5" disabled={!canEdit} onClick={onAddText}>
              <TypeIcon className="h-4 w-4" /> Add text overlay
            </Button>
            {textClip && (
              <div className="space-y-3 rounded-lg border p-2.5">
                <Field label="Text (Enter = new line)">
                  <Textarea
                    value={typeof rawEl.text === "string" ? rawEl.text : ""}
                    className="h-20 text-xs"
                    disabled={!canEdit}
                    onChange={(e) => patchTextEl({ text: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={`Size · ${typeof rawEl.fontSize === "number" ? rawEl.fontSize : ""}`}>
                    <Slider
                      value={[typeof rawEl.fontSize === "number" ? rawEl.fontSize : 64]}
                      min={16}
                      max={Math.round(config.canvas.height * 0.4)}
                      step={2}
                      disabled={!canEdit}
                      onValueChange={([v]) => patchTextEl({ fontSize: v })}
                      aria-label="Text size"
                    />
                  </Field>
                  <Field label="Color">
                    <input
                      type="color"
                      value={typeof rawEl.color === "string" ? rawEl.color : "#ffffff"}
                      disabled={!canEdit}
                      onChange={(e) => patchTextEl({ color: e.target.value })}
                      aria-label="Text color"
                      className="h-8 w-full cursor-pointer rounded border bg-transparent"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Align">
                    <Select value={typeof rawEl.align === "string" ? rawEl.align : "center"} disabled={!canEdit} onValueChange={(v) => patchTextEl({ align: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Weight">
                    <Select value={String(rawEl.fontWeight ?? 700)} disabled={!canEdit} onValueChange={(v) => patchTextEl({ fontWeight: parseInt(v, 10) })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[400, 500, 600, 700, 800].map((w) => (
                          <SelectItem key={w} value={String(w)}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label={`Position X · ${Math.round(typeof rawEl.x === "number" ? rawEl.x : config.canvas.width / 2)}`}>
                  <Slider
                    value={[typeof rawEl.x === "number" ? rawEl.x : config.canvas.width / 2]}
                    min={0}
                    max={config.canvas.width}
                    step={2}
                    disabled={!canEdit}
                    onValueChange={([v]) => patchTextEl({ x: v })}
                    aria-label="Text position X"
                  />
                </Field>
                <Field label={`Position Y · ${Math.round(typeof rawEl.y === "number" ? rawEl.y : config.canvas.height / 2)}`}>
                  <Slider
                    value={[typeof rawEl.y === "number" ? rawEl.y : config.canvas.height / 2]}
                    min={0}
                    max={config.canvas.height}
                    step={2}
                    disabled={!canEdit}
                    onValueChange={([v]) => patchTextEl({ y: v })}
                    aria-label="Text position Y"
                  />
                </Field>
                <p className="text-[10px] text-muted-foreground">Times and fades are in the Clip tab.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <Smile className="h-3.5 w-3.5" /> Stickers
              </p>
              <div className="grid grid-cols-10 gap-1">
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    className="flex h-9 w-9 items-center justify-center rounded-md border bg-background text-lg hover:bg-accent disabled:opacity-40"
                    disabled={!canEdit}
                    onClick={() => onAddSticker(s)}
                    aria-label={`Add sticker ${s}`}
                    title={`Add ${s} sticker`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {!textClip && (
              <p className="text-[11px] text-muted-foreground">Tip: select a text clip to edit it, or add a new overlay above.</p>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      {/* ---------------- subtitles ---------------- */}
      <TabsContent value="subs" className="min-h-0 flex-1">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center gap-1.5 px-3 pb-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" disabled={!canEdit} onClick={onAddSubtitle}>
              <Plus className="h-3.5 w-3.5" /> Add at {fmtClock(playheadMs)}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1" disabled={!canEdit} onClick={() => setShowSrtImport((v) => !v)}>
              <FileUp className="h-3.5 w-3.5" /> SRT
            </Button>
            <Button size="sm" variant="outline" className="ml-auto h-8 gap-1" disabled={!subs.length} onClick={onDownloadSrt}>
              <Download className="h-3.5 w-3.5" /> .srt
            </Button>
          </div>
          {showSrtImport && (
            <div className="mx-3 mb-2 space-y-2 rounded-lg border bg-muted/40 p-2">
              <Label className="text-[11px]">Paste SRT content ({'"'}00:00:01,000 {'-->'} 00:00:04,000{'"'} blocks)</Label>
              <Textarea value={srtText} onChange={(e) => setSrtText(e.target.value)} className="h-24 font-mono text-[11px]" placeholder={"1\n00:00:01,000 --> 00:00:04,000\nHello world"} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!srtText.trim() || !canEdit}
                  onClick={() => {
                    onImportSrt(srtText)
                    setSrtText("")
                    setShowSrtImport(false)
                  }}
                >
                  <Upload className="mr-1 h-3.5 w-3.5" /> Import
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowSrtImport(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
            <div className="space-y-2">
              {subs.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  <Captions className="mx-auto mb-1 h-4 w-4" />
                  No subtitles yet. Add cues manually or import an .srt file.
                </p>
              )}
              {subs.map((sub, i) => (
                <div key={i} className="space-y-1.5 rounded-lg border p-2">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={sec(sub.start)}
                      disabled={!canEdit}
                      className="h-7 text-xs"
                      aria-label={`Subtitle ${i + 1} start seconds`}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (Number.isFinite(v) && v >= 0) onPatchSubtitle(i, { start: Math.round(v * 1000) })
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={sec(sub.end)}
                      disabled={!canEdit}
                      className="h-7 text-xs"
                      aria-label={`Subtitle ${i + 1} end seconds`}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (Number.isFinite(v) && v > 0) onPatchSubtitle(i, { end: Math.round(v * 1000) })
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" disabled={!canEdit} onClick={() => onDeleteSubtitle(i)} aria-label={`Delete subtitle ${i + 1}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={sub.text}
                    className="h-12 text-xs"
                    disabled={!canEdit}
                    aria-label={`Subtitle ${i + 1} text`}
                    onChange={(e) => onPatchSubtitle(i, { text: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t px-3 py-2">
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Sticker className="h-3 w-3" /> Subtitles render at the bottom of the preview and in exports.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
