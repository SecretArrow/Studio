"use client"

/**
 * Client-side loader for template-text dictionaries.
 * Dictionaries (~157KB JSON per locale) live in /i18n/templates/{locale}.json
 * and are immutable, so they are fetched once per locale and cached in memory
 * for the lifetime of the tab.
 */

import { isTemplateLocale } from "@/lib/design/i18n/locales"

export type TemplateDictionary = Record<string, string>

const dictCache = new Map<string, Promise<TemplateDictionary | null>>()

let manifestPromise: Promise<TemplateLocaleManifest | null> | null = null

export interface TemplateLocaleManifest {
  version: number
  locales: { code: string; en: string; native: string; dir: "ltr" | "rtl" }[]
}

/**
 * Load a template dictionary for a locale. Resolves null on any failure
 * (invalid locale, network error, malformed JSON) — callers treat null as
 * "translation unavailable".
 */
export function loadTemplateDictionary(locale: string): Promise<TemplateDictionary | null> {
  if (!isTemplateLocale(locale)) return Promise.resolve(null)
  const cached = dictCache.get(locale)
  if (cached) return cached
  const p = fetch(`/i18n/templates/${locale}.json`)
    .then(async (res) => {
      if (!res.ok) return null
      const data = (await res.json()) as unknown
      if (!data || typeof data !== "object" || Array.isArray(data)) return null
      return data as TemplateDictionary
    })
    .catch(() => null)
  dictCache.set(locale, p)
  return p
}

/**
 * Fetch the generated manifest (public/i18n/templates/index.json). Prefer the
 * static TEMPLATE_LOCALES import for selectors — this exists for callers that
 * want the served manifest metadata instead.
 */
export function loadTemplateLocaleManifest(): Promise<TemplateLocaleManifest | null> {
  if (!manifestPromise) {
    manifestPromise = fetch("/i18n/templates/index.json")
      .then(async (res) => {
        if (!res.ok) return null
        const data = (await res.json()) as TemplateLocaleManifest | null
        if (!data || !Array.isArray(data.locales)) return null
        return data
      })
      .catch(() => null)
  }
  return manifestPromise
}
