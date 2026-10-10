"use client"

import { useMemo, useState } from "react"
import {
  FolderKanban,
  Home,
  Layers3,
  LayoutTemplate,
  MoreHorizontal,
  Palette,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useAppStore, type AppView } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

/**
 * Mobile bottom navigation (Android/iOS dashboard shell).
 *
 * Rendered as the LAST flex child of the Dashboard root column — never
 * `position: fixed`, so it can never cover content (the row above is
 * `min-h-0 flex-1` and shrinks instead). Hidden on md+ where the desktop
 * sidebar rail takes over.
 */

export type MobileNavView =
  | "home"
  | "templates"
  | "projects"
  | "brand"
  | "bulk"
  | "trash"
  | "settings"
  | "admin"

export interface MobileNavModel {
  /** Slots shown directly in the bottom bar (between them sits the New design action). */
  primary: MobileNavView[]
  /** Secondary destinations inside the "More" sheet, in display order. */
  more: MobileNavView[]
}

/** Pure nav model — unit-tested in tests/unit/mobile-nav.test.ts. */
export function mobileNavModel(isAdmin: boolean): MobileNavModel {
  return {
    primary: ["home", "templates", "projects"],
    more: isAdmin
      ? ["brand", "bulk", "trash", "settings", "admin"]
      : ["brand", "bulk", "trash", "settings"],
  }
}

/** True when the given store view name should highlight the `id` slot. */
export function isNavActive(currentViewName: string, id: MobileNavView): boolean {
  if (currentViewName === id) return true
  // Template detail pages and seasonal packs belong to the Templates slot.
  return id === "templates" && (currentViewName === "templates-detail" || currentViewName === "template-pack")
}

function toAppView(id: MobileNavView): AppView {
  switch (id) {
    case "home":
      return { name: "home" }
    case "templates":
      return { name: "templates" }
    case "projects":
      return { name: "projects" }
    case "brand":
      return { name: "brand" }
    case "bulk":
      return { name: "bulk" }
    case "trash":
      return { name: "trash" }
    case "settings":
      return { name: "settings" }
    case "admin":
      return { name: "admin" }
  }
}

const ICONS: Record<MobileNavView, React.ComponentType<{ className?: string }>> = {
  home: Home,
  templates: LayoutTemplate,
  projects: FolderKanban,
  brand: Palette,
  bulk: Layers3,
  trash: Trash2,
  settings: Settings,
  admin: ShieldCheck,
}

export function MobileNav({ onNew }: { onNew: () => void }) {
  const { t } = useI18n()
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const [moreOpen, setMoreOpen] = useState(false)

  const model = useMemo(() => mobileNavModel(user?.role === "admin"), [user])
  const labels = useMemo<Record<MobileNavView, string>>(
    () => ({
      home: t("nav.home"),
      templates: t("nav.templates"),
      projects: t("nav.projects"),
      brand: t("nav.brand"),
      bulk: t("nav.bulk"),
      trash: t("nav.trash"),
      settings: t("nav.settings"),
      admin: t("nav.admin"),
    }),
    [t],
  )

  const renderSlot = (id: MobileNavView) => {
    const Icon = ICONS[id]
    const active = isNavActive(view.name, id)
    return (
      <button
        key={id}
        type="button"
        onClick={() => navigate(toAppView(id))}
        aria-label={labels[id]}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        <span className="max-w-full truncate">{labels[id]}</span>
      </button>
    )
  }

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="z-30 flex h-16 shrink-0 items-stretch gap-1 border-t bg-card px-2 pt-1 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {model.primary.slice(0, 2).map(renderSlot)}

        {/* Center accent action — same dialog the header/sidebar buttons open */}
        <button
          type="button"
          onClick={onNew}
          aria-label={t("nav.newDesign")}
          className="flex min-h-[44px] flex-1 flex-col items-center justify-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
        </button>

        {model.primary.slice(2).map(renderSlot)}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label={t("nav.more")}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          <span className="max-w-full truncate">{t("nav.more")}</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
        >
          <SheetHeader className="pb-1">
            <SheetTitle>{t("nav.more")}</SheetTitle>
            <SheetDescription>{t("nav.moreSubtitle")}</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2">
            {model.more.map((id) => {
              const Icon = ICONS[id]
              const active = isNavActive(view.name, id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    navigate(toAppView(id))
                    setMoreOpen(false)
                  }}
                  aria-label={labels[id]}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent",
                    active ? "border-primary/40 text-primary" : "text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{labels[id]}</span>
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
