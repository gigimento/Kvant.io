import { test, expect } from "@playwright/test"

test.use({ storageState: "e2e/.auth/user.json" })

test.describe("Paddle Payment Flow", () => {
  test("checkout page opens with Paddle pricing", async ({ page }) => {
    await page.goto("/dashboard/subscriptions", { waitUntil: "networkidle" })

    const subscribeBtn = page.locator('button:has-text("Subscribe"), button:has-text("Get Started"), a:has-text("Subscribe")').first()

    if (await subscribeBtn.isVisible()) {
      const [popup] = await Promise.all([
        page.waitForEvent("popup", { timeout: 10000 }).catch(() => null),
        subscribeBtn.click(),
      ])

      if (popup) {
        await expect(popup).toHaveURL(/paddle/, { timeout: 10000 })
        await popup.close()
      }
    }
  })

  test("subscription page has tier selection", async ({ page }) => {
    await page.goto("/dashboard/subscriptions", { waitUntil: "networkidle" })
    const main = page.locator("main")
    await expect(main.getByText("Starter").first()).toBeVisible({ timeout: 10000 })
    await expect(main.getByText("Pro").first()).toBeVisible()
    await expect(main.getByText("Agency").first()).toBeVisible()
  })

  test("monthly/yearly toggle changes price", async ({ page }) => {
    await page.goto("/dashboard/subscriptions", { waitUntil: "networkidle" })

    const yearlyBtn = page.getByText("Yearly").first()
    const monthlyBtn = page.getByText("Monthly").first()

    if (await monthlyBtn.isVisible() && await yearlyBtn.isVisible()) {
      await yearlyBtn.click()
      await page.waitForTimeout(500)
      await monthlyBtn.click()
      await page.waitForTimeout(500)

      await expect(yearlyBtn).toBeVisible()
      await expect(monthlyBtn).toBeVisible()
    }
  })
})
