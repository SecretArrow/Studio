"use client"

import { FONT_LIBRARY } from "@/lib/design/presets"

/** Curated pairing suggestions — every bundled family appears exactly once as a heading or body font. */
const PAIRINGS: { heading: string; body: string; vibe: string }[] = [
  { heading: "Playfair Display", body: "Inter", vibe: "Editorial, weddings, fashion" },
  { heading: "Bebas Neue", body: "Poppins", vibe: "Sales, events, YouTube thumbnails" },
  { heading: "Poppins", body: "Merriweather", vibe: "Decks, reports, newsletters" },
  { heading: "Dancing Script", body: "Playfair Display", vibe: "Invitations, certificates" },
  { heading: "Oswald", body: "JetBrains Mono", vibe: "Fitness, tech, posters" },
  { heading: "Permanent Marker", body: "Caveat", vibe: "Stickers, kids, casual promos" },
]

const SAMPLE = "The quick brown fox jumps over the lazy dog"

/** Which bundled family pairs well with the given one (for the per-font hint). */
function partnerFor(family: string): string {
  const hit = PAIRINGS.find((p) => p.heading === family || p.body === family)
  if (!hit) return "Inter"
  return hit.heading === family ? hit.body : hit.heading
}

export function FontsView() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="fonts-library-title">
        <h2 id="fonts-library-title" className="text-lg font-semibold">
          Font library
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Ten open-license families are bundled with Studio and available in every editor — no uploads, no font fallbacks. All are
          free for personal and commercial use (SIL Open Font License or equivalent).
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FONT_LIBRARY.map((f) => (
            <article key={f.family} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-5xl leading-none" style={{ fontFamily: f.family }} aria-hidden="true">
                  Aa
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{f.weights.length} weights</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{f.label}</h3>
              <p className="mt-2 line-clamp-2 text-base leading-snug text-foreground/80" style={{ fontFamily: f.family }}>
                {SAMPLE}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Pairs well with <span className="font-medium text-foreground">{partnerFor(f.family)}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="fonts-pairing-title">
        <h2 id="fonts-pairing-title" className="text-lg font-semibold">
          Pairing suggestions
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Tested combinations from the template library — a characterful heading font over a quiet body font keeps layouts readable.
        </p>
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {PAIRINGS.map((p) => (
            <li key={`${p.heading}-${p.body}`} className="flex items-center gap-4 rounded-xl border bg-card p-5">
              <span className="flex shrink-0 items-center gap-1 text-2xl leading-none" aria-hidden="true">
                <span className="rounded-lg bg-primary/10 px-2 py-1" style={{ fontFamily: p.heading }}>
                  Aa
                </span>
                <span className="text-muted-foreground">+</span>
                <span className="rounded-lg bg-accent px-2 py-1" style={{ fontFamily: p.body }}>
                  Aa
                </span>
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {p.heading} <span className="font-normal text-muted-foreground">+ {p.body}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Good for: {p.vibe}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
