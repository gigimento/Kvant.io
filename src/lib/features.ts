import { FileText, Search, BarChart3, FileEdit, Calendar, Receipt, Presentation, Palette, ScanLine, Globe, Zap, Gift, TrendingUp, Users, Mail, Link2, SearchCode } from "lucide-react"

export type TierSlug = "starter" | "pro" | "agency"

export interface Feature {
  slug: string
  name: string
  description: string
  icon: any
  tier: TierSlug
}

export const TIER_INFO: Record<TierSlug, { name: string; price: number; label: string }> = {
  starter: { name: "Starter", price: 19, label: "For solo operators" },
  pro: { name: "Pro", price: 49, label: "For growing agencies" },
  agency: { name: "Agency", price: 99, label: "For established teams" },
}

export const ALL_FEATURES: Feature[] = [
  { slug: "reports", name: "Narrative Reports", description: "AI-generated client reports with analytics data", icon: FileText, tier: "starter" },
  { slug: "seo", name: "Brand Radar", description: "Monitor brand mentions & share of voice", icon: Search, tier: "starter" },
  { slug: "competitive", name: "Competitive Dashboard", description: "Track competitors and market positioning", icon: BarChart3, tier: "starter" },
  { slug: "analytics", name: "Analytics Hub", description: "Unified GA4, Meta Ads & Google Ads dashboard", icon: TrendingUp, tier: "starter" },
  { slug: "content-briefs", name: "Content Briefs", description: "Generate SEO-optimized content briefs", icon: FileEdit, tier: "starter" },
  { slug: "content-calendar", name: "Content Calendar", description: "Plan and schedule content publishing", icon: Calendar, tier: "starter" },
  { slug: "keyword-rankings", name: "Rank Tracker", description: "Track keyword positions in Google SERP", icon: SearchCode, tier: "pro" },
  { slug: "invoices", name: "Invoices", description: "Create and manage client invoices", icon: Receipt, tier: "pro" },
  { slug: "proposals", name: "Proposals", description: "AI-powered proposal generation", icon: Presentation, tier: "pro" },
  { slug: "branding", name: "Branding", description: "Custom brand colors and settings", icon: Palette, tier: "pro" },
  { slug: "scheduled-reports", name: "Scheduled Reports", description: "Automated email delivery of reports", icon: Mail, tier: "pro" },
  { slug: "backlinks", name: "Backlink Monitor", description: "Track referring domains and link quality", icon: Link2, tier: "pro" },
  { slug: "citation-audit", name: "AI Citation Audit", description: "Track brand visibility across ChatGPT, Claude, Gemini & Perplexity", icon: ScanLine, tier: "agency" },
  { slug: "aeo", name: "AEO Foundations", description: "Optimize for AI crawlers & answer engines", icon: Globe, tier: "agency" },
  { slug: "agentic", name: "Agentic Readiness", description: "Enable AI agents to complete tasks on your site", icon: Zap, tier: "agency" },
  { slug: "client-portal", name: "Client Portal", description: "White-label share dashboard for clients", icon: Users, tier: "agency" },
  { slug: "referrals", name: "Referrals", description: "Referral program & share-to-earn", icon: Gift, tier: "agency" },
]

export function getFeatureBySlug(slug: string): Feature | undefined {
  return ALL_FEATURES.find((f) => f.slug === slug)
}

export const TIER_PRICES: Record<TierSlug, { monthly: string; yearly: string; price: number; name: string }> = {
  starter: { monthly: "pri_01kvy9pwaf66by4qgjkx8g7kwc", yearly: "pri_01kvy9pwhcaqv3hw9htb1atdjy", price: 19, name: "Starter" },
  pro: { monthly: "pri_01kvy9pwq6qvyjjx07xqc3nefz", yearly: "pri_01kvy9pwx26yavq3g8par41qv7", price: 49, name: "Pro" },
  agency: { monthly: "pri_01kvy9px2m86yd5avmf1brqqfr", yearly: "pri_01kvy9px8b727m5apentsh6n89", price: 99, name: "Agency" },
}

export function getFeaturesByTier(tier: TierSlug): Feature[] {
  return ALL_FEATURES.filter((f) => f.tier === tier)
}

export function getPriceForTier(tier: TierSlug, plan: "monthly" | "yearly"): { priceId: string; price: number } {
  const data = TIER_PRICES[tier]
  return { priceId: data[plan], price: data.price }
}

export function getRecommendedTier(count: number): TierSlug {
  if (count <= 6) return "starter"
  if (count <= 12) return "pro"
  return "agency"
}

export function getTierCount(tier: TierSlug): number {
  return ALL_FEATURES.filter((f) => f.tier === tier).length
}
