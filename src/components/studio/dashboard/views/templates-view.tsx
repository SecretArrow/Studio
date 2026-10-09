"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { api } from "@/lib/studio/api-client"
import { TEMPLATE_CATEGORIES } from "@/lib/design/presets"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { TemplateCard } from "./templates-card"

export function TemplatesView({ search }: { search: string }) {
  const { t } = useI18n()
  const [category, setCategory] = useState("all")
  const [localSearch, setLocalSearch] = useState(search)

  const query = useQuery({
    queryKey: ["templates", "list", category, localSearch],
    queryFn: () =>
      api.get<{ templates: Parameters<typeof TemplateCard>[0]["template"][] }>(
        `/api/templates?category=${category}&limit=120${localSearch ? `&q=${encodeURIComponent(localSearch)}` : ""}`,
      ),
  })

  const templates = query.data?.templates ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-xl font-bold">{t("nav.templates")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        100% original, editable templates — every element is a real object, never a flattened image.
      </p>

      <div className="sticky top-0 z-10 -mx-4 mt-4 space-y-3 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search templates…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
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
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No templates match your search.</div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {templates.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} />
          ))}
        </div>
      )}
    </div>
  )
}
