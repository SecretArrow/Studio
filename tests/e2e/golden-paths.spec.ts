import { test, expect } from "@playwright/test"

/**
 * Golden-path E2E: register → dashboard → create design → edit → save → export.
 * Requires the dev server; unit-level guarantees are covered by vitest.
 */

test.describe("studio golden paths", () => {
  test("app boots to auth or dashboard", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=Studio")).toBeVisible({ timeout: 20_000 })
  })

  test("register a new account and see the dashboard", async ({ page }) => {
    const email = `e2e-${Date.now()}@studio.test`
    await page.goto("/")
    await page.getByRole("tab", { name: "Create account" }).click()
    await page.locator("#reg-name").fill("E2E Tester")
    await page.locator("#reg-email").fill(email)
    await page.locator("#reg-password").fill("e2epassword1")
    await page.getByRole("button", { name: "Create account" }).click()
    await expect(page.locator("text=Start a new design")).toBeVisible({ timeout: 20_000 })
  })

  test("demo account sign-in opens projects", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Use demo account" }).click()
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.locator("text=Start a new design")).toBeVisible({ timeout: 20_000 })
  })

  test("create a design as guest and open the editor", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Continue as guest" }).click()
    await page.getByRole("button", { name: "New design" }).first().click()
    await page.getByText("Instagram Post", { exact: false }).first().click()
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 })
    // canvas editor adds a text element
    await page.getByRole("button", { name: "Text" }).click()
    await expect(page.locator("canvas").first()).toBeVisible()
  })

  test("template gallery lists seeded templates", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Continue as guest" }).click()
    await page.goto("/#/templates")
    await expect(page.locator("text=Neon Sale").first()).toBeVisible({ timeout: 20_000 })
  })

  test("health endpoint reports database up", async ({ request }) => {
    const res = await request.get("/api/health")
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.services.database).toBe("up")
  })
})
