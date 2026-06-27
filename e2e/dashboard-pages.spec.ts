import { test, expect } from "@playwright/test"

test.use({ storageState: "e2e/.auth/user.json" })

const DASHBOARD_PAGES = [
  { path: "/dashboard", name: "Dashboard Home" },
  { path: "/dashboard/reports", name: "Narrative Reports" },
  { path: "/dashboard/seo", name: "Brand Radar" },
  { path: "/dashboard/competitive", name: "Competitive Dashboard" },
  { path: "/dashboard/content-briefs", name: "Content Briefs" },
  { path: "/dashboard/content-calendar", name: "Content Calendar" },
  { path: "/dashboard/invoices", name: "Invoices" },
  { path: "/dashboard/proposals", name: "Proposals" },
  { path: "/dashboard/settings/branding", name: "Branding" },
  { path: "/dashboard/analytics", name: "Analytics Hub" },
  { path: "/dashboard/keyword-rankings", name: "Rank Tracker" },
  { path: "/dashboard/scheduled-reports", name: "Scheduled Reports" },
  { path: "/dashboard/backlinks", name: "Backlink Monitor" },
  { path: "/dashboard/citation-audit", name: "AI Citation Audit" },
  { path: "/dashboard/aeo", name: "AEO Foundations" },
  { path: "/dashboard/agentic", name: "Agentic Readiness" },
  { path: "/dashboard/client-portal", name: "Client Portal" },
  { path: "/dashboard/referrals", name: "Referrals" },
  { path: "/dashboard/subscriptions", name: "Subscriptions" },
  { path: "/dashboard/settings", name: "Settings" },
  { path: "/dashboard/connections", name: "Connections" },
  { path: "/dashboard/seo-audit", name: "SEO Audit" },
]

for (const pageInfo of DASHBOARD_PAGES) {
  test(`Page loads: ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
    test.setTimeout(60000)
    const response = await page.goto(pageInfo.path, { waitUntil: "networkidle", timeout: 55000 })
    expect(response?.status()).toBe(200)

    const bodyText = await page.locator("body").innerText()
    expect(bodyText.length).toBeGreaterThan(10)

    await expect(page.locator("body")).not.toContainText("Not Found")
    await expect(page.locator("body")).not.toContainText("Application error")
    await expect(page.locator("body")).not.toContainText("Internal Server Error")
  })
}

test("Dashboard sidebar navigation works", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "networkidle" })
  // Desktop sidebar is the 2nd aside (hidden md:flex), mobile is the 1st (md:hidden)
  const desktopNav = page.locator("aside").nth(1).locator("nav")
  await expect(desktopNav).toBeVisible({ timeout: 10000 })
})

test("Dashboard home shows stats cards", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "networkidle" })
  const statsCount = await page.locator('[class*="card"], [class*="Card"]').count()
  expect(statsCount).toBeGreaterThanOrEqual(1)
})

test("Subscription page shows pricing tiers", async ({ page }) => {
  await page.goto("/dashboard/subscriptions", { waitUntil: "networkidle" })
  // Scope to main content to avoid matching sidebar links (e.g. "Pro" in "Proposals")
  const main = page.locator("main")
  await expect(main.getByText("Starter").first()).toBeVisible({ timeout: 10000 })
  await expect(main.getByText("Pro").first()).toBeVisible()
  await expect(main.getByText("Agency").first()).toBeVisible()
})
