import { test as setup } from "@playwright/test"

setup("authenticate", async ({ page }) => {
  const email = "igor.ilic@outlook.com"
  const password = "n9VEdwe8w3r82SW"

  await page.goto("/login")
  await page.waitForLoadState("networkidle")

  if (page.url().includes("/dashboard")) {
    await page.context().storageState({ path: "e2e/.auth/user.json" })
    return
  }

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  await page.waitForURL(/\/dashboard/, { timeout: 15000 })

  await page.context().storageState({ path: "e2e/.auth/user.json" })
})
