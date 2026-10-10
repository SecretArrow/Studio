import { test, expect, type Page } from "@playwright/test"

/**
 * Template-text localization e2e (chromium only).
 * Tolerant by design: it asserts the language selector exists, choosing
 * Español surfaces a coverage status AND actually re-renders preview text
 * (computed dynamically from the public dictionary — no hard-coded ids or
 * strings), and that "Use this template" still works (guest flow shows the
 * sign-in prompt).
 */

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium project only")
})

interface ResumeRow {
  id: string
  name: string
}

/** Walk a DesignDoc JSON for its translatable strings (text/sticky/table cells). */
function docStrings(doc: { pages?: { elements?: Record<string, unknown>[] }[] }): string[] {
  const out = new Set<string>()
  for (const page of doc.pages ?? []) {
    for (const el of page.elements ?? []) {
      if ((el.type === "text" || el.type === "sticky") && typeof el.text === "string") {
        const s = el.text.trim()
        if (s) out.add(s)
      } else if (el.type === "table" && Array.isArray(el.rows)) {
        for (const row of el.rows as unknown[][]) {
          for (const cell of row) {
            if (typeof cell === "string" && cell.trim()) out.add(cell.trim())
          }
        }
      }
    }
  }
  return Array.from(out)
}

async function pickLocalizedCase(page: Page): Promise<{ id: string; name: string; translated: string }> {
  const list = await page.request.get("/api/templates?q=resume&limit=500")
  expect(list.ok()).toBeTruthy()
  const body = (await list.json()) as { templates?: ResumeRow[] }
  expect(body.templates?.length, "at least one resume template seeded").toBeTruthy()

  const dictRes = await page.request.get("/i18n/templates/es.json")
  expect(dictRes.ok()).toBeTruthy()
  const dict = (await dictRes.json()) as Record<string, string>

  for (const tpl of body.templates!) {
    const detail = await page.request.get(`/api/templates/${tpl.id}`)
    if (!detail.ok()) continue
    const tplBody = (await detail.json()) as { template?: { contentJson?: string } }
    if (!tplBody.template?.contentJson) continue
    let doc: { pages?: { elements?: Record<string, unknown>[] }[] }
    try {
      doc = JSON.parse(tplBody.template.contentJson)
    } catch {
      continue
    }
    const translated = docStrings(doc).find((s) => dict[s] && dict[s] !== s && dict[s].length >= 4)
    if (translated) return { id: tpl.id, name: tpl.name, translated: dict[translated]! }
  }
  throw new Error("no resume template with a Spanish-translatable string found")
}

test.describe("template text localization", () => {
  test("language selector, localized preview and use flow still work", async ({ page }) => {
    const testCase = await pickLocalizedCase(page)

    await page.goto("/")
    await page.getByRole("button", { name: "Continue as guest" }).click()
    await page.goto(`/#/templates/${testCase.id}`)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 })

    const selector = page.getByRole("combobox", { name: "Template language" })
    await expect(selector).toBeVisible()

    // Default shows the original preview; choosing Español loads its dictionary.
    await selector.click()
    await page.getByRole("option", { name: /Español/ }).click()

    const status = page.getByRole("status")
    await expect(status).toBeVisible({ timeout: 15_000 })
    await expect(status).toContainText(/translated|Diterjemahkan/)

    // The preview actually re-renders with the localized string.
    await expect(page.getByText(testCase.translated).first()).toBeVisible({ timeout: 15_000 })

    // Switch back to the original — the status disappears again.
    await selector.click()
    await page.getByRole("option", { name: "Original" }).click()
    await expect(status).toHaveCount(0)

    // Guest use-flow is unaffected: the sign-in prompt appears as before.
    await page.getByRole("button", { name: "Use this template" }).click()
    await expect(page.getByText("Sign in to use this template")).toBeVisible({ timeout: 15_000 })
  })
})
