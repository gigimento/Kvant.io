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
    maxClients: number | "unlimited"
    scanFrequency: "weekly" | "daily"
    geoBriefs: boolean
    whiteLabel: boolean
    apiAccess: boolean
}> = {
    starter: {
        maxClients: 5,
        scanFrequency: "weekly",
        geoBriefs: false,
        whiteLabel: false,
        apiAccess: false,
    },
    pro: {
        maxClients: 20,
        scanFrequency: "daily",
        geoBriefs: true,
        whiteLabel: true,
        apiAccess: false,
    },
    agency: {
        maxClients: "unlimited",
        scanFrequency: "daily",
        geoBriefs: true,
        whiteLabel: true,
        apiAccess: true,
    },
}

export const TIER_PRICES: Record<TierSlug, { monthly: string; yearly: string; price: number; name: string }> = {
    starter: {
        monthly: "pri_01kwgcq6m01cvxmza1y4b5e1rm",
        yearly: "pri_01kwgcq6tg7y9jk8fv81q58kmm",
        price: 29,
        name: "Starter",
    },
    pro: {
        monthly: "pri_01kwgcq70h57v4xd8101ywy9cc",
        yearly: "pri_01kwgcq76scde823dkcffewmg2",
        price: 79,
        name: "Pro",
    },
    agency: {
        monthly: "pri_01kwgcq7db642qd6vnpqrs5tkt",
        yearly: "pri_01kwgcq7k316qa31zv9cd5gcxt",
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
