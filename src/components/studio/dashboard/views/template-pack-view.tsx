"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { api } from "@/lib/studio/api-client"
import { packById } from "@/lib/design/template-packs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, PackageOpen, RotateCcw } from "lucide-react"
import { TemplateCard, TemplateCardSkeleton, type TemplateRow } from "./templates-card"

/**
 * Curated template pack detail — banner + grid of matching templates.
 * Data comes from the public templates API with the `tag` filter
 * (`/api/templates?tag=<pack.tags>&limit=500`).
 */
export function TemplatePackView({ packId }: { packId: string }) {
  const { t, locale } = useI18n()
  const navigate = useAppStore((s) => s.navigate)
  const pack = useMemo(() => packById(packId), [packId])

  const query = useQuery({
    queryKey: ["templates", "pack", packId],
    enabled: !!pack,
    queryFn: () =>
      api.get<{ templates: TemplateRow[]; total: number }>(
        `/api/templates?tag=${encodeURIComponent(pack!.tags.join(","))}&limit=500`,
      ),
  })

  const backToTemplates = () => navigate({ name: "templates" })

  if (!pack) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold">{t("pack.notFound")}</h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{t("pack.notFoundDesc")}</p>
          <Button variant="outline" className="mt-6 min-h-[44px]" onClick={backToTemplates}>
            <ArrowLeft className="h-4 w-4" /> {t("pack.back")}
          </Button>
        </div>
      </div>
    )
  }

  const name = locale === "id" ? pack.nameId : pack.nameEn
  const description = locale === "id" ? pack.descId : pack.descEn
  const total = query.data?.total ?? 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="min-h-[36px] -ml-2" onClick={backToTemplates}>
          <ArrowLeft className="h-4 w-4" /> {t("pack.back")}
        </Button>
      </div>

      <header
        className="relative overflow-hidden rounded-2xl p-6 text-white md:p-8"
        style={{ backgroundImage: `linear-gradient(135deg, ${pack.gradient[0]} 0%, ${pack.gradient[1]} 100%)` }}
      >
        <div className="flex items-start gap-4 md:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 text-3xl backdrop-blur-sm md:h-16 md:w-16 md:text-4xl" aria-hidden="true">
            {pack.emoji}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">{name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/90">{description}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-white/80" aria-live="polite">
              {query.isLoading ? (
                <Loader2 className="inline h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  {total} {t("packs.templates")}
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {query.isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">{t("pack.loadError")}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => query.refetch()}>
            <RotateCcw className="h-4 w-4" /> {t("pack.retry")}
          </Button>
        </div>
      ) : total === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-12 text-center">
          <PackageOpen className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">{t("pack.empty")}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {query.data!.templates.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} />
          ))}
        </div>
      )}
    </div>
  )
}
