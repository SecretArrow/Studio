"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { DesignDoc } from "@/lib/design/types"
import { TEMPLATE_LOCALES, isTemplateLocale } from "@/lib/design/i18n/locales"
import { localizeDesignDoc, dictionaryCoverage } from "@/lib/design/i18n/localize"
import { loadTemplateDictionary } from "@/lib/studio/template-i18n"
import { DocPreview } from "@/components/studio/shared/doc-preview"
import {
  ArrowLeft, Check, FileText, Languages, Layers, Loader2, Pencil, Presentation, ShieldCheck, Square,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TemplatePreviewBox } from "./templates-card"

interface TemplateDetailRow {
  id: string
  slug: string
  name: string
  category: string
  type: string
  tags: string
  width: number
  height: number
  contentJson: string
  thumbnail: string | null
  license: string
}

/* ------------------------------- detail view ------------------------------- */

function orientationOf(w: number, h: number): string {
  const r = w / h
  if (r > 1.05) return "Landscape"
  if (r < 0.95) return "Portrait"
  return "Square"
}

const TYPE_ICON: Record<string, ReactNode> = {
  canvas: <Square className="h-4 w-4" />,
  presentation: <Presentation className="h-4 w-4" />,
  whiteboard: <Pencil className="h-4 w-4" />,
  doc: <FileText className="h-4 w-4" />,
}

export function TemplateDetail({ templateId }: { templateId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const { toast } = useToast()
  const { t } = useI18n()
  const qc = useQueryClient()
  const [authPrompt, setAuthPrompt] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pageIdx, setPageIdx] = useState(0)
  const [langSel, setLangSel] = useState<string>("original")

  const query = useQuery({
    queryKey: ["templates", "detail", templateId],
    queryFn: () => api.get<{ template: TemplateDetailRow }>(`/api/templates/${templateId}`),
  })

  const tpl = query.data?.template
  const doc = useMemo<DesignDoc | null>(() => {
    if (!tpl) return null
    try {
      return JSON.parse(tpl.contentJson) as DesignDoc
    } catch {
      return null
    }
  }, [tpl])

  /* --- template-text localization (client preview) --- */
  const dictQuery = useQuery({
    queryKey: ["templates", "dict", langSel],
    queryFn: () => loadTemplateDictionary(langSel),
    enabled: isTemplateLocale(langSel),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
  const dict = dictQuery.data ?? null
  const dictFailed =
    isTemplateLocale(langSel) && ((dictQuery.isSuccess && dict === null) || dictQuery.isError)
  // Failed loads fall back to the original text — reflected in the selector value.
  const displaySel = dictFailed ? "original" : langSel
  const displayDoc = useMemo<DesignDoc | null>(
    () => (doc && dict ? localizeDesignDoc(doc, dict) : doc),
    [doc, dict],
  )
  const coverage = useMemo(() => (doc && dict ? dictionaryCoverage(doc, dict) : null), [doc, dict])
  const coveragePct =
    coverage === null ? null : coverage.total === 0 ? 100 : Math.round((coverage.covered / coverage.total) * 100)

  const tags = useMemo<string[]>(() => {
    try {
      return tpl ? (JSON.parse(tpl.tags) as string[]) : []
    } catch {
      return []
    }
  }, [tpl])

  function backToTemplates() {
    navigate({ name: "templates" })
  }

  async function useTemplate() {
    if (!user) {
      setAuthPrompt(true)
      return
    }
    setBusy(true)
    try {
      // Send the locale only when its dictionary actually loaded — the server
      // falls back to the profile locale (or the original text) otherwise.
      const res = await api.post<{ project: { id: string }; localizedTo?: string | null }>(
        `/api/templates/${templateId}/use`,
        dict && isTemplateLocale(langSel) ? { locale: langSel } : undefined,
      )
      await qc.invalidateQueries({ queryKey: ["projects"] })
      navigate({ name: "editor", projectId: res.project.id })
    } catch {
      toast({ title: "Could not use template", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <Button variant="ghost" size="sm" className="min-h-[36px] -ml-2" onClick={backToTemplates}>
        <ArrowLeft className="h-4 w-4" /> All templates
      </Button>

      {query.isLoading ? (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      ) : query.isError || !tpl ? (
        <div className="mt-6 rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm font-medium">Template not found.</p>
          <p className="mt-1 text-sm text-muted-foreground">It may have been removed from the library.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={backToTemplates}>
            <ArrowLeft className="h-4 w-4" /> Back to templates
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Preview column */}
          <div className="min-w-0">
            <div className="max-w-3xl">
              {displayDoc ? <DocPreview doc={displayDoc} pageIndex={pageIdx} /> : tpl.thumbnail ? (
                <img src={tpl.thumbnail} alt={tpl.name} className="w-full rounded-lg border" />
              ) : (
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border">
                  <TemplatePreviewBox template={tpl} />
                </div>
              )}
            </div>
            {displayDoc && displayDoc.pages.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3" role="tablist" aria-label="Template pages">
                {displayDoc.pages.map((p, i) => (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={pageIdx === i}
                    onClick={() => setPageIdx(i)}
                    className={cn(
                      "w-28 overflow-hidden rounded-md border-2 bg-card transition-colors",
                      pageIdx === i ? "border-primary" : "border-transparent hover:border-muted-foreground/40",
                    )}
                    aria-label={`Show page ${i + 1}: ${p.name}`}
                  >
                    <div className="[&>div>div]:rounded-none [&>div>div]:border-0 [&>div>div]:shadow-none">
                      <DocPreview doc={displayDoc} pageIndex={i} />
                    </div>
                    <p className="truncate px-1.5 py-1 text-[11px] text-muted-foreground">
                      {i + 1}. {p.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">{tpl.category}</Badge>
                <Badge variant="outline" className="gap-1">
                  {TYPE_ICON[tpl.type] ?? <Square className="h-4 w-4" />}
                  <span className="capitalize">{tpl.type}</span>
                </Badge>
                {displayDoc && displayDoc.pages.length > 1 && (
                  <Badge variant="outline" className="gap-1">
                    <Layers className="h-4 w-4" /> {displayDoc.pages.length} pages
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight">{tpl.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {tpl.width} × {tpl.height} px · {orientationOf(tpl.width, tpl.height)}
              </p>
            </div>

            <Separator />

            <div className="rounded-lg border bg-card p-4">
              <label
                htmlFor="tpl-lang-trigger"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                <Languages className="h-3.5 w-3.5" /> {t("tplLang.label")}
              </label>
              <Select value={displaySel} onValueChange={setLangSel}>
                <SelectTrigger id="tpl-lang-trigger" className="mt-2 w-full" aria-label={t("tplLang.label")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="original">{t("tplLang.original")}</SelectItem>
                  {TEMPLATE_LOCALES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.native} ({l.en}){l.dir === "rtl" ? ` (${t("tplLang.rtl")})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dictFailed ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("tplLang.unavailable")}</p>
              ) : isTemplateLocale(langSel) && dictQuery.isPending ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> {t("common.loading")}
                </p>
              ) : coveragePct !== null ? (
                <p role="status" className={cn("mt-2 text-xs leading-relaxed", coveragePct === 100 ? "text-primary" : "text-muted-foreground")}>
                  {coveragePct === 100 ? t("tplLang.fully") : `${coveragePct}${t("tplLang.covered")}`}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="flex items-start gap-2 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold">CC0</span> — free for personal and commercial use, no attribution required.
                </span>
              </p>
            </div>

            <Button className="w-full min-h-[44px] text-base" onClick={useTemplate} disabled={busy}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Pencil className="h-5 w-5" />}
              Use this template
            </Button>
            <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
              Opens as a fully editable copy in your workspace — every text, shape, color, table and chart stays a real object you
              can change. Nothing is flattened.
            </p>

            {tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary" /> Original artwork created for Studio — no stock or brand assets.
            </div>
          </aside>
        </div>
      )}

      <Dialog open={authPrompt} onOpenChange={setAuthPrompt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in to use this template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Templates are free for everyone. A free account keeps your customized copy in the cloud.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAuthPrompt(false); navigate({ name: "auth" }) }}>Sign in / Register</Button>
            <Button variant="ghost" onClick={() => setAuthPrompt(false)}>Not now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
