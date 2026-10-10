"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { api } from "@/lib/studio/api-client"
import { TEMPLATE_CATEGORIES } from "@/lib/design/presets"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Search, Loader2, RotateCcw, Square, RectangleHorizontal, RectangleVertical, Type } from "lucide-react"
import { TemplateCard, TemplateCardSkeleton, type TemplateRow } from "./templates-card"
import { FontsView } from "./fonts-view"

type Orientation = "all" | "portrait" | "landscape" | "square"
type SortKey = "featured" | "newest" | "az"

const ORIENTATIONS: { id: Orientation; label: string; icon: ReactNode }[] = [
  { id: "all", label: "All", icon: <Square className="h-3.5 w-3.5" /> },
  { id: "portrait", label: "Portrait", icon: <RectangleVertical className="h-3.5 w-3.5" /> },
  { id: "landscape", label: "Landscape", icon: <RectangleHorizontal className="h-3.5 w-3.5" /> },
  { id: "square", label: "Square", icon: <Square className="h-3.5 w-3.5 rotate-45" /> },
]

function matchesOrientation(t: TemplateRow, o: Orientation): boolean {
  if (o === "all") return true
  const r = t.width / t.height
  if (o === "landscape") return r > 1.05
  if (o === "portrait") return r < 0.95
  return r >= 0.95 && r <= 1.05
}

export function TemplatesView({ search }: { search: string }) {
  const { t } = useI18n()
  const [category, setCategory] = useState("all")
  const [orientation, setOrientation] = useState<Orientation>("all")
  const [sort, setSort] = useState<SortKey>("featured")
  const [localSearch, setLocalSearch] = useState(search)
  const [visibleCount, setVisibleCount] = useState(60)

  const query = useQuery({
    queryKey: ["templates", "list", localSearch],
    queryFn: () =>
      api.get<{ templates: TemplateRow[]; total: number }>(
        `/api/templates?category=all&limit=500${localSearch ? `&q=${encodeURIComponent(localSearch)}` : ""}`,
      ),
  })

  const templates = useMemo(() => {
    const list = (query.data?.templates ?? []).filter((tpl) => matchesOrientation(tpl, orientation))
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === "featured") list.sort((a, b) => Number(b.featured) - Number(a.featured))
    // "newest" keeps the server order (createdAt desc, featured boosted)
    return list
  }, [query.data, orientation, sort])

  const categoryCount = useMemo(() => {
    if (category === "all") return templates.length
    return templates.filter((tpl) => tpl.category === category).length
  }, [templates, category])

  const visible = useMemo(
    () => (category === "all" ? templates : templates.filter((tpl) => tpl.category === category)),
    [templates, category],
  )

  const hasActiveFilters = category !== "all" || orientation !== "all" || localSearch !== ""
  function resetFilters() {
    setCategory("all")
    setOrientation("all")
    setLocalSearch("")
  }

  // reset incremental rendering whenever filters change
  function changeFilter(apply: () => void) {
    apply()
    setVisibleCount(60)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-xl font-bold">{t("nav.templates")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        100% original, editable templates — every element is a real object, never a flattened image.
      </p>

      <Tabs defaultValue="templates" className="mt-4">
        <TabsList className="h-10">
          <TabsTrigger value="templates" className="min-h-[36px] gap-2 px-4">
            <LayoutTemplateIcon /> Templates
          </TabsTrigger>
          <TabsTrigger value="fonts" className="min-h-[36px] gap-2 px-4">
            <Type className="h-4 w-4" /> Fonts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-0">
          <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-background px-4 py-3 md:-mx-6 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={localSearch} onChange={(e) => changeFilter(() => setLocalSearch(e.target.value))} placeholder="Search templates…" className="pl-9" aria-label="Search templates" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border p-0.5" role="group" aria-label="Filter by orientation">
                  {ORIENTATIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => changeFilter(() => setOrientation(o.id))}
                      title={o.label}
                      aria-pressed={orientation === o.id}
                      className={`flex min-h-[36px] items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                        orientation === o.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {o.icon}
                      <span className="hidden md:inline">{o.label}</span>
                    </button>
                  ))}
                </div>
                <Select value={sort} onValueChange={(v) => changeFilter(() => setSort(v as SortKey))}>
                  <SelectTrigger className="w-[150px]" aria-label="Sort templates">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured first</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="az">A–Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => changeFilter(() => setCategory(c.id))}
                  className={`min-h-[36px] rounded-full border px-4 text-sm transition-colors ${
                    category === c.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {query.isLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <TemplateCardSkeleton key={i} />
              ))}
            </div>
          ) : query.isError ? (
            <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">Templates could not be loaded. Check your connection and try again.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => query.refetch()}>
                <RotateCcw className="h-4 w-4" /> Retry
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed p-12 text-center">
              <p className="text-sm font-medium">No templates match your filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different category, orientation or search term.</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" /> Reset filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
                {categoryCount} template{categoryCount === 1 ? "" : "s"}
                {category !== "all" && ` in ${TEMPLATE_CATEGORIES.find((c) => c.id === category)?.label}`}
                {orientation !== "all" && ` · ${ORIENTATIONS.find((o) => o.id === orientation)?.label}`}
                {query.isFetching && <Loader2 className="ml-2 inline h-3 w-3 animate-spin align-[-2px]" />}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visible.slice(0, visibleCount).map((tpl) => (
                  <TemplateCard key={tpl.id} template={tpl} />
                ))}
              </div>
              {visible.length > visibleCount && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" size="lg" className="min-h-[44px] px-8" onClick={() => setVisibleCount((c) => c + 60)}>
                    Load more templates ({visible.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
              {visible.length <= visibleCount && visible.length > 60 && (
                <p className="mt-8 text-center text-xs text-muted-foreground">That&apos;s every template — more are added regularly.</p>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="fonts" className="mt-6">
          <FontsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LayoutTemplateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  )
}
