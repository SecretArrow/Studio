import { test, expect, type Page } from "@playwright/test"

/**
 * Mobile bottom navigation e2e (Pixel 7 "mobile" project) + one desktop guard.
 *
 * The bottom nav replaces the retired mobile sidebar drawer (which had no
 * re-open affordance once closed — deep links to templates/brand/settings
 * stranded the user). These tests pin:
 *  - the nav is visible on every dashboard view, including cold deep-link
 *    loads (the stranded-user regression),
 *  - primary slots navigate, the More sheet exposes secondary destinations,
 *  - desktop keeps the sidebar and never renders the bottom nav.
 */

const MOBILE_NAV = "Mobile navigation"

function bottomNav(page: Page) {
  return page.getByRole("navigation", { name: MOBILE_NAV })
}

/** Fresh context always boots to the auth gate; continue as guest to browse. */
async function continueAsGuest(page: Page) {
  const guest = page.getByRole("button", { name: "Continue as guest" })
  await expect(guest).toBeVisible({ timeout: 20_000 })
  await guest.click()
}

test.describe("mobile bottom nav", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile project only")
  })

  test("guest lands on home and the bottom nav is visible", async ({ page }) => {
    await page.goto("/")
    await continueAsGuest(page)
    await expect(bottomNav(page)).toBeVisible({ timeout: 20_000 })
  })

  test("tapping Templates opens the gallery", async ({ page }) => {
    await page.goto("/")
    await continueAsGuest(page)
    await expect(bottomNav(page)).toBeVisible({ timeout: 20_000 })
    await bottomNav(page).getByRole("button", { name: "Templates" }).click()
    await expect(page.getByRole("heading", { level: 1, name: /Templates|Templat/ })).toBeVisible({
      timeout: 20_000,
    })
    await expect(bottomNav(page)).toBeVisible()
  })

  test("More sheet exposes Settings and navigates to it", async ({ page }) => {
    await page.goto("/")
    await continueAsGuest(page)
    await expect(bottomNav(page)).toBeVisible({ timeout: 20_000 })

    await bottomNav(page).getByRole("button", { name: "More" }).click()
    const sheet = page.getByRole("dialog")
    await expect(sheet).toBeVisible({ timeout: 10_000 })

    await sheet.getByRole("button", { name: "Settings" }).click()
    await expect(page.getByRole("heading", { level: 1, name: /Settings|Pengaturan/ })).toBeVisible({
      timeout: 20_000,
    })
    // The sheet closes itself after navigating.
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(bottomNav(page)).toBeVisible()
  })

  test("cold deep-link to a template detail still shows the bottom nav", async ({ page }) => {
    // Regression: a user opening a shared template URL directly on a phone
    // (auth gate → guest → detail view) must never be stranded without nav.
    const list = await page.request.get("/api/templates?limit=5")
    expect(list.ok()).toBeTruthy()
    const body = (await list.json()) as { templates?: { id: string }[] }
    expect(body.templates?.length, "at least one seeded template").toBeTruthy()
    const templateId = body.templates![0]!.id

    await page.goto(`/#/templates/${templateId}`)
    await continueAsGuest(page)

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 })
    await expect(bottomNav(page)).toBeVisible({ timeout: 20_000 })
  })
})

test.describe("desktop dashboard keeps the sidebar, not the bottom nav", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "chromium project only")
  })

  test("sidebar navigation visible and mobile nav absent", async ({ page }) => {
    await page.goto("/")
    await continueAsGuest(page)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 })

    // Bottom nav is display:none on md+ → excluded from the accessibility tree.
    await expect(bottomNav(page)).toHaveCount(0)
    // The desktop sidebar rail (collapsed or expanded) is still the only nav.
    await expect(page.getByRole("navigation").first()).toBeVisible({ timeout: 20_000 })
  })
})
