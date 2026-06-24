import { FileText, Search, BarChart3, FileEdit, Calendar, Receipt, Presentation, Palette, ScanLine, Globe, Zap, Gift, TrendingUp, Users, Mail } from "lucide-react"

export interface Feature {
  slug: string
  name: string
  description: string
  icon: any
}

export const ALL_FEATURES: Feature[] = [
  { slug: "reports", name: "Narrative Reports", description: "AI-generated client reports with analytics data", icon: FileText },
  { slug: "seo", name: "Brand Radar", description: "Monitor brand mentions & share of voice", icon: Search },
  { slug: "competitive", name: "Competitive Dashboard", description: "Track competitors and market positioning", icon: BarChart3 },
  { slug: "content-briefs", name: "Content Briefs", description: "Generate SEO-optimized content briefs", icon: FileEdit },
  { slug: "content-calendar", name: "Content Calendar", description: "Plan and schedule content publishing", icon: Calendar },
  { slug: "invoices", name: "Invoices", description: "Create and manage client invoices", icon: Receipt },
  { slug: "proposals", name: "Proposals", description: "AI-powered proposal generation", icon: Presentation },
  { slug: "branding", name: "Branding", description: "Custom brand colors and settings", icon: Palette },
  { slug: "citation-audit", name: "AI Citation Audit", description: "Track brand visibility across ChatGPT, Claude, Gemini & Perplexity", icon: ScanLine },
  { slug: "aeo", name: "AEO Foundations", description: "Optimize for AI crawlers & answer engines", icon: Globe },
  { slug: "agentic", name: "Agentic Readiness", description: "Enable AI agents to complete tasks on your site", icon: Zap },
  { slug: "analytics", name: "Analytics Hub", description: "Unified GA4, Meta Ads & Google Ads dashboard", icon: TrendingUp },
  { slug: "client-portal", name: "Client Portal", description: "White-label share dashboard for clients", icon: Users },
  { slug: "scheduled-reports", name: "Scheduled Reports", description: "Automated email delivery of reports", icon: Mail },
  { slug: "referrals", name: "Referrals", description: "Referral program & share-to-earn", icon: Gift },
]

export function getFeatureBySlug(slug: string): Feature | undefined {
  return ALL_FEATURES.find((f) => f.slug === slug)
}

export function getTierForCount(count: number): number {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

export const TIER_PRICES: Record<string, { monthly: string; yearly: string; price: number }> = {
  "1": { monthly: "pri_01kvn3dpsztmk4k53qenq9der3", yearly: "pri_01kvn3dq038s3hdfckkv1b8dhj", price: 9 },
  "2": { monthly: "pri_01kvn3dq5wrn1jv6r1q69xqz6a", yearly: "pri_01kvn3dqbsvd8xyv941y2yhr2f", price: 15 },
  "3": { monthly: "pri_01kvn3dqhgp6xttjr76nkjk7p9", yearly: "pri_01kvn3dqq66t0akr7gvs14bawj", price: 22 },
  "4": { monthly: "pri_01kvkva7hbtmngwv59d2hsr1yn", yearly: "pri_01kvkva7qmnz1d3fhd4gtznxsr", price: 29 },
}

export function getPriceForSelection(featureCount: number, plan: "monthly" | "yearly"): { priceId: string; price: number } {
  const tier = getTierForCount(featureCount)
  const tierData = TIER_PRICES[String(tier)]
  return { priceId: tierData[plan], price: tierData.price }
}
