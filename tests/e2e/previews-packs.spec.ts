import { test, expect } from "@playwright/test"

/**
 * Wave 8 E2E: real template previews in the gallery + curated template packs.
 * Requires the dev server (playwright.config webServer boots it).
 */

async function enterApp(page: import("@playwright/test").Page) {
  await page.goto("/")
  await page.getByRole("button", { name: "Continue as guest" }).click()
}

test.describe("template previews & packs", () => {
  test("gallery cards render real design previews", async ({ page }) => {
    await enterApp(page)
    await page.goto("/#/templates")
    // Gradient placeholders render instantly; real DocPreview mounts when a card
    // nears the viewport (role="img" aria-label="Preview of …").
    const preview = page.locator('[aria-label^="Preview of"]').first()
    await expect(preview).toBeVisible({ timeout: 30_000 })
    // At least a couple of real previews after scrolling
    await page.mouse.wheel(0, 2000)
    await page.waitForTimeout(1200)
    await page.mouse.wheel(0, 2000)
    await page.waitForTimeout(1500)
    const count = await page.locator('[aria-label^="Preview of"]').count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test("gallery shows the template packs rail and navigates to a pack", async ({ page }) => {
    await enterApp(page)
    await page.goto("/#/templates")
    const railTitle = page.getByText("Template packs", { exact: false }).first()
    await expect(railTitle).toBeVisible({ timeout: 20_000 })
    // Open the Lebaran pack from the rail (pack cards are buttons with aria-labels)
    await page.getByRole("button", { name: /Lebaran & Ramadan/ }).first().click()
    await expect(page.locator("text=Lebaran").first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[aria-label^="Preview of"], .group').first()).toBeVisible({ timeout: 30_000 })
  })

  test("pack deep link renders the pack page", async ({ page }) => {
    await enterApp(page)
    await page.goto("/#/packs/pengajian")
    await expect(page.getByText("Pengajian", { exact: false }).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('[aria-label^="Preview of"]').first()).toBeVisible({ timeout: 30_000 })
    // Back button returns to the gallery
    await page.getByRole("button", { name: "All templates" }).click()
    await expect(page).toHaveURL(/#\/templates/)
  })

  test("home shows the seasonal packs spotlight", async ({ page }) => {
    await enterApp(page)
    await expect(page.getByText("Seasonal packs", { exact: false }).first()).toBeVisible({ timeout: 20_000 })
  })

  test("unknown pack id shows a friendly not-found", async ({ page }) => {
    await enterApp(page)
    await page.goto("/#/packs/does-not-exist")
    await expect(page.getByText("Pack not found").first()).toBeVisible({ timeout: 20_000 })
  })
})
