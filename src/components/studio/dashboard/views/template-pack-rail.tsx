"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { api } from "@/lib/studio/api-client"
import { TEMPLATE_PACKS, packTemplateMatcher } from "@/lib/design/template-packs"
import type { TemplateRow } from "./templates-card"

/** Rows returned by the list API include the raw tags JSON column. */
type RowWithTags = TemplateRow & { tags?: string }

/**
 * "Paket template" rail — horizontal snap-scroll of curated pack cards with a
 * live per-pack template count computed client-side from the full (unsearched)
 * 500-row list. Shares the gallery's cache key for the initial load
 * (["templates","list",""]) so no extra network round-trip on first visit.
 */
export function TemplatePackRail() {
  const { t, locale } = useI18n()
  const navigate = useAppStore((s) => s.navigate)

  const metaQuery = useQuery({
    queryKey: ["templates", "list", ""],
    queryFn: () =>
      api.get<{ templates: TemplateRow[]; total: number }>("/api/templates?category=all&limit=500"),
    staleTime: 60_000,
  })

  const counts = useMemo(() => {
    const rows = (metaQuery.data?.templates ?? []) as RowWithTags[]
    const map = new Map<string, number>()
    for (const pack of TEMPLATE_PACKS) {
      const matches = packTemplateMatcher(pack)
      map.set(pack.id, rows.filter((row) => matches(row.tags)).length)
    }
    return map
  }, [metaQuery.data])

  return (
    <section className="mt-4" aria-label={t("packs.railTitle")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{t("packs.railTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("packs.railHint")}</p>
      </div>
      <div className="mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TEMPLATE_PACKS.map((pack) => {
          const count = counts.get(pack.id)
          const name = locale === "id" ? pack.nameId : pack.nameEn
          return (
            <button
              key={pack.id}
              onClick={() => navigate({ name: "template-pack", packId: pack.id })}
              aria-label={`${name} — ${count ?? 0} ${t("packs.templates")}`}
              className="group relative flex aspect-[4/3] min-w-[200px] w-[220px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-xl p-4 text-left text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              style={{ backgroundImage: `linear-gradient(135deg, ${pack.gradient[0]} 0%, ${pack.gradient[1]} 100%)` }}
            >
              {pack.featured && (
                <span className="absolute right-3 top-3 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                  {t("packs.featured")}
                </span>
              )}
              <span className="text-3xl drop-shadow-sm" aria-hidden="true">
                {pack.emoji}
              </span>
              <span className="block">
                <span className="block text-sm font-semibold leading-snug drop-shadow-sm">{name}</span>
                <span className="mt-0.5 block text-xs font-medium text-white/85">
                  {count === undefined ? "\u00A0" : `${count} ${t("packs.templates")}`}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
