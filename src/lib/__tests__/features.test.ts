import { describe, it, expect } from "vitest"
import { ALL_FEATURES, TIER_INFO, TIER_PRICES, getFeatureBySlug, getFeaturesByTier, getPriceForTier } from "../features"

describe("features", () => {
  it("has 17 features", () => {
    expect(ALL_FEATURES.length).toBe(17)
  })

  it("every feature has required fields", () => {
    for (const f of ALL_FEATURES) {
      expect(f.slug).toBeTruthy()
      expect(f.name).toBeTruthy()
      expect(f.description).toBeTruthy()
      expect(f.icon).toBeTruthy()
      expect(["starter", "pro", "agency"]).toContain(f.tier)
    }
  })

  it("starter has 6 features", () => {
    expect(getFeaturesByTier("starter").length).toBe(6)
  })

  it("pro has 6 features", () => {
    expect(getFeaturesByTier("pro").length).toBe(6)
  })

  it("agency has 5 features", () => {
    expect(getFeaturesByTier("agency").length).toBe(5)
  })

  it("starter slugs are correct", () => {
    const slugs = getFeaturesByTier("starter").map((f) => f.slug)
    expect(slugs).toEqual(["reports", "seo", "competitive", "analytics", "content-briefs", "content-calendar"])
  })

  it("pro slugs are correct", () => {
    const slugs = getFeaturesByTier("pro").map((f) => f.slug)
    expect(slugs).toEqual(["keyword-rankings", "invoices", "proposals", "branding", "scheduled-reports", "backlinks"])
  })

  it("agency slugs are correct", () => {
    const slugs = getFeaturesByTier("agency").map((f) => f.slug)
    expect(slugs).toEqual(["citation-audit", "aeo", "agentic", "client-portal", "referrals"])
  })

  it("getFeatureBySlug returns correct feature", () => {
    const f = getFeatureBySlug("reports")
    expect(f?.name).toBe("Narrative Reports")
  })

  it("getFeatureBySlug returns undefined for unknown slug", () => {
    expect(getFeatureBySlug("nonexistent")).toBeUndefined()
  })

  it("TIER_INFO has correct prices", () => {
    expect(TIER_INFO.starter.price).toBe(19)
    expect(TIER_INFO.pro.price).toBe(49)
    expect(TIER_INFO.agency.price).toBe(99)
  })

  it("getPriceForTier returns correct price IDs", () => {
    const monthly = getPriceForTier("starter", "monthly")
    expect(monthly.priceId).toBeTruthy()
    expect(monthly.price).toBe(19)

    const yearly = getPriceForTier("starter", "yearly")
    expect(yearly.priceId).toBeTruthy()
    expect(yearly.price).toBe(19)
  })

  it("all TIER_PRICES have both monthly and yearly price IDs", () => {
    for (const prices of Object.values(TIER_PRICES)) {
      expect(prices.monthly).toBeTruthy()
      expect(prices.yearly).toBeTruthy()
      expect(prices.price).toBeGreaterThan(0)
    }
  })

  it("no duplicate slugs", () => {
    const slugs = ALL_FEATURES.map((f) => f.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
