export type TierSlug = "starter" | "pro" | "agency"

export interface Feature {
    slug: string
    name: string
    description: string
    icon: any
    tier: TierSlug
}

export const TIER_INFO: Record<TierSlug, { name: string; price: number; label: string }> = {
    starter: {
        name: "Starter",
        price: 29,
        label: "For solo operators",
    },
    pro: {
        name: "Pro",
        price: 79,
        label: "For growing agencies",
    },
    agency: {
        name: "Agency",
        price: 149,
        label: "For established teams",
    },
}

export const ALL_FEATURES: Feature[] = [
    {
        slug: "brand-radar",
        name: "Brand Radar",
        description: "Monitor how AI models talk about your clients' brands",
        icon: null,
        tier: "starter",
    },
    {
        slug: "geo-briefs",
        name: "GEO Briefs",
        description: "Actionable plans to improve AI visibility",
        icon: null,
        tier: "pro",
    },
    {
        slug: "pdf-audit",
        name: "PDF Audit",
        description: "Generate client-ready AI visibility audit reports",
        icon: null,
        tier: "starter",
    },
]

export const TIER_LIMITS: Record<TierSlug, {
    clients: number | "unlimited"
    scanFrequency: "weekly" | "daily"
    geoBriefs: boolean
    whiteLabel: boolean
    apiAccess: boolean
}> = {
    starter: {
        clients: 5,
        scanFrequency: "weekly",
        geoBriefs: false,
        whiteLabel: false,
        apiAccess: false,
    },
    pro: {
        clients: 20,
        scanFrequency: "daily",
        geoBriefs: true,
        whiteLabel: true,
        apiAccess: false,
    },
    agency: {
        clients: "unlimited",
        scanFrequency: "daily",
        geoBriefs: true,
        whiteLabel: true,
        apiAccess: true,
    },
}

export const TIER_PRICES: Record<TierSlug, { monthly: string; yearly: string; price: number; name: string }> = {
    starter: {
        monthly: "pri_01kvy9pwaf66by4qgjkx8g7kwc",
        yearly: "pri_01kvy9pwhcaqv3hw9htb1atdjy",
        price: 29,
        name: "Starter",
    },
    pro: {
        monthly: "pri_01kvy9pwq6qvyjjx07xqc3nefz",
        yearly: "pri_01kvy9pwx26yavq3g8par41qv7",
        price: 79,
        name: "Pro",
    },
    agency: {
        monthly: "pri_01kvy9px2m86yd5avmf1brqqfr",
        yearly: "pri_01kvy9px8b727m5apentsh6n89",
        price: 149,
        name: "Agency",
    },
}

export function getFeaturesByTier(tier: TierSlug): Feature[] {
    return ALL_FEATURES.filter((f) => f.tier === tier)
}

export function getPriceForTier(tier: TierSlug, plan: "monthly" | "yearly"): { priceId: string; price: number } {
    const data = TIER_PRICES[tier]
    return { priceId: data[plan], price: data.price }
}

export function getFeatureBySlug(slug: string): Feature | undefined {
    return ALL_FEATURES.find((f) => f.slug === slug)
}

export function getRecommendedTier(clientCount: number): TierSlug {
    if (clientCount <= 5) return "starter"
    if (clientCount <= 20) return "pro"
    return "agency"
}

export function getTierCount(tier: TierSlug): number {
    return ALL_FEATURES.filter((f) => f.tier === tier).length
}
