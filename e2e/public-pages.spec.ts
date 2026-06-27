import { test, expect } from "@playwright/test"

test.describe("Public Pages", () => {
  test("Landing page loads", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "networkidle" })
    expect(response?.status()).toBe(200)
    await expect(page.locator("body")).not.toContainText("Not Found")
  })

  test("Landing page shows pricing tiers", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" })
    const body = await page.locator("body").innerText()
    expect(body).toContain("Starter")
    expect(body).toContain("Pro")
    expect(body).toContain("Agency")
  })

  test("Login page loads", async ({ page }) => {
    const response = await page.goto("/login", { waitUntil: "networkidle" })
    expect(response?.status()).toBe(200)
  })

  test("Register page loads", async ({ page }) => {
    const response = await page.goto("/register", { waitUntil: "networkidle" })
    expect(response?.status()).toBe(200)
  })

  test("Terms page loads", async ({ page }) => {
    const response = await page.goto("/terms", { waitUntil: "networkidle" })
    expect(response?.status()).toBe(200)
  })

  test("Privacy page loads", async ({ page }) => {
    const response = await page.goto("/privacy", { waitUntil: "networkidle" })
    expect(response?.status()).toBe(200)
  })

  test("Refund page loads", async ({ page }) => {
    const response = await page.goto("/refund", { waitUntil: "networkidle" })
    expect(response?.status()).toBe(200)
  })

  test("Login form has email and password fields", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" })
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })
})
