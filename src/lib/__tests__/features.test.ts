import { describe, it, expect } from "vitest"
import { ALL_FEATURES, TIER_INFO, TIER_PRICES, TIER_LIMITS, getFeatureBySlug, getFeaturesByTier, getPriceForTier, getRecommendedTier, getTierCount } from "../features"

describe("features", () => {
    it("has 3 features", () => {
        expect(ALL_FEATURES.length).toBe(3)
    })

    it("every feature has required fields", () => {
        for (const f of ALL_FEATURES) {
            expect(f.slug).toBeTruthy()
            expect(f.name).toBeTruthy()
            expect(f.description).toBeTruthy()
            expect(["starter", "pro", "agency"]).toContain(f.tier)
        }
    })

    it("starter has 2 features", () => {
        expect(getFeaturesByTier("starter").length).toBe(2)
    })

    it("pro has 1 feature", () => {
        expect(getFeaturesByTier("pro").length).toBe(1)
    })

    it("agency has 0 features (all tiered features are starter/pro)", () => {
        expect(getFeaturesByTier("agency").length).toBe(0)
    })

    it("starter slugs are correct", () => {
        const slugs = getFeaturesByTier("starter").map((f) => f.slug)
        expect(slugs).toEqual(["brand-radar", "pdf-audit"])
    })

    it("pro slugs are correct", () => {
        const slugs = getFeaturesByTier("pro").map((f) => f.slug)
        expect(slugs).toEqual(["geo-briefs"])
    })

    it("getFeatureBySlug returns correct feature", () => {
        const f = getFeatureBySlug("brand-radar")
        expect(f?.name).toBe("Brand Radar")
    })

    it("getFeatureBySlug returns undefined for unknown slug", () => {
        expect(getFeatureBySlug("nonexistent")).toBeUndefined()
    })

    it("TIER_INFO has correct prices", () => {
        expect(TIER_INFO.starter.price).toBe(29)
        expect(TIER_INFO.pro.price).toBe(79)
        expect(TIER_INFO.agency.price).toBe(149)
    })

    it("getPriceForTier returns correct price IDs", () => {
        const monthly = getPriceForTier("starter", "monthly")
        expect(monthly.priceId).toBeTruthy()
        expect(monthly.price).toBe(29)

        const yearly = getPriceForTier("starter", "yearly")
        expect(yearly.priceId).toBeTruthy()
        expect(yearly.price).toBe(29)
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

    it("TIER_LIMITS has all tiers", () => {
        expect(TIER_LIMITS.starter).toBeDefined()
        expect(TIER_LIMITS.pro).toBeDefined()
        expect(TIER_LIMITS.agency).toBeDefined()
    })

    it("TIER_LIMITS has correct client limits", () => {
        expect(TIER_LIMITS.starter.clients).toBe(5)
        expect(TIER_LIMITS.pro.clients).toBe(20)
        expect(TIER_LIMITS.agency.clients).toBe("unlimited")
    })

    it("getRecommendedTier returns correct tier", () => {
        expect(getRecommendedTier(3)).toBe("starter")
        expect(getRecommendedTier(5)).toBe("starter")
        expect(getRecommendedTier(10)).toBe("pro")
        expect(getRecommendedTier(20)).toBe("pro")
        expect(getRecommendedTier(25)).toBe("agency")
    })

    it("getTierCount returns correct counts", () => {
        expect(getTierCount("starter")).toBe(2)
        expect(getTierCount("pro")).toBe(1)
        expect(getTierCount("agency")).toBe(0)
    })
})
