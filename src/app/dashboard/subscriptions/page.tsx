"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Check, Loader, ArrowRight, Shield, Zap, Building2 } from "lucide-react"
import {
  TIER_INFO,
  TIER_PRICES,
  TIER_LIMITS,
  type TierSlug,
} from "@/lib/features"

const TIER_ICONS: Record<TierSlug, any> = {
  starter: Shield,
  pro: Zap,
  agency: Building2,
}

const TIER_FEATURES: Record<TierSlug, string[]> = {
  starter: [
    "5 clients",
    "Weekly brand scans",
    "PDF audit reports",
    "Brand Radar + PDF Audit",
  ],
  pro: [
    "20 clients",
    "Daily brand scans",
    "GEO briefs",
    "White-label reports",
    "All Starter features",
  ],
  agency: [
    "Unlimited clients",
    "API access",
    "Priority support",
    "All Pro features",
  ],
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subs, setSubs] = useState<any[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<TierSlug | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)

      const [subRes, histRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", user.id),
        supabase.from("billing_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ])

      setSubs(subRes.data || [])
      setBilling(histRes.data || [])
      setLoading(false)
    })
  }, [router])

  async function handleCheckout(tier: TierSlug) {
    setCheckoutLoading(tier)
    setCheckoutError("")
    try {
      const res = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, plan }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setCheckoutError(data.error || "Failed to create checkout")
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Network error")
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div><div className="skeleton-text" /><div className="skeleton-text-short" /></div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      </div>
    )
  }

  const activeSub = subs.find((s) => s.status === "active")
  const userTier = activeSub?.custom_data?.tier as TierSlug | undefined

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Choose the plan that fits your agency</p>
        </div>
        {activeSub && (
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">Active</span>
        )}
      </div>

      {activeSub && (
        <Card className="border-green-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">Your Plan — {TIER_INFO[userTier || "starter"]?.name || "Active"}</CardTitle>
                <CardDescription>
                  {activeSub.plan === "yearly" ? "Yearly billing" : "Monthly billing"} &middot;{" "}
                  Renews {new Date(activeSub.current_period_end).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" disabled={portalLoading} onClick={async () => {
                setPortalLoading(true)
                try {
                  const res = await fetch("/api/paddle/customer-portal", { method: "POST" })
                  const data = await res.json()
                  if (data.portalUrl) window.location.href = data.portalUrl
                } catch {} finally { setPortalLoading(false) }
              }}>
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </Button>
              <Button variant="outline" size="sm" disabled={cancelLoading} className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={async () => {
                if (!confirm("Cancel your subscription?")) return
                setCancelLoading(true)
                try {
                  const res = await fetch("/api/paddle/cancel-subscription", { method: "POST" })
                  if (res.ok) router.refresh()
                } catch {} finally { setCancelLoading(false) }
              }}>
                {cancelLoading ? "Cancelling..." : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan toggle */}
      <div className="flex items-center justify-center gap-1 rounded-lg bg-white/5 p-1 w-fit mx-auto">
        <button onClick={() => setPlan("monthly")} className={cn("rounded-md px-4 py-1.5 text-sm font-medium transition-colors", plan === "monthly" ? "bg-accent text-white" : "text-muted-foreground hover:text-white")}>Monthly</button>
        <button onClick={() => setPlan("yearly")} className={cn("rounded-md px-4 py-1.5 text-sm font-medium transition-colors", plan === "yearly" ? "bg-accent text-white" : "text-muted-foreground hover:text-white")}>Yearly <span className="text-xs text-green-400 ml-1">Save 17%</span></button>
      </div>

      {/* Tier cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {(["starter", "pro", "agency"] as TierSlug[]).map((tier) => {
          const info = TIER_INFO[tier]
          const p = TIER_PRICES[tier]
          const a = plan === "monthly" ? p.price : p.price * 10
          const isActive = activeSub && userTier === tier
          const limits = TIER_LIMITS[tier]
          const Icon = TIER_ICONS[tier]
          const features = TIER_FEATURES[tier]
          const isPopular = tier === "pro"

          return (
            <Card
              key={tier}
              className={cn(
                "relative flex flex-col",
                isPopular && "border-accent/50",
                isActive && "border-green-500/30"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-white">Most Popular</Badge>
                </div>
              )}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-500 text-white">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{info.name}</CardTitle>
                <CardDescription>{info.label}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${a}</span>
                  <span className="text-muted-foreground">/{plan === "monthly" ? "mo" : "yr"}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isActive ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      disabled={checkoutLoading === tier}
                      onClick={() => handleCheckout(tier)}
                    >
                      {checkoutLoading === tier ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {checkoutError && <p className="text-center text-sm text-red-400">{checkoutError}</p>}

      {/* Feature comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Plans</CardTitle>
          <CardDescription>See what's included in each tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pr-4">Feature</th>
                  {(["starter", "pro", "agency"] as TierSlug[]).map((t) => (
                    <th key={t} className="text-center py-3 px-4 w-24">{TIER_INFO[t].name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-3 pr-4">Clients</td>
                  <td className="text-center py-3 px-4">5</td>
                  <td className="text-center py-3 px-4">20</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 pr-4">Scan Frequency</td>
                  <td className="text-center py-3 px-4">Weekly</td>
                  <td className="text-center py-3 px-4">Daily</td>
                  <td className="text-center py-3 px-4">Daily</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 pr-4">Brand Radar</td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 pr-4">PDF Audit</td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 pr-4">GEO Briefs</td>
                  <td className="text-center py-3 px-4"><span className="text-muted-foreground/30">&mdash;</span></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 pr-4">White-Label</td>
                  <td className="text-center py-3 px-4"><span className="text-muted-foreground/30">&mdash;</span></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 pr-4">API Access</td>
                  <td className="text-center py-3 px-4"><span className="text-muted-foreground/30">&mdash;</span></td>
                  <td className="text-center py-3 px-4"><span className="text-muted-foreground/30">&mdash;</span></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Priority Support</td>
                  <td className="text-center py-3 px-4"><span className="text-muted-foreground/30">&mdash;</span></td>
                  <td className="text-center py-3 px-4"><span className="text-muted-foreground/30">&mdash;</span></td>
                  <td className="text-center py-3 px-4"><Check className="mx-auto h-4 w-4 text-accent" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Billing History</h2>
        {billing.length === 0 ? (
          <p className="text-sm text-muted-foreground">No billing history yet.</p>
        ) : (
          <div className="space-y-2">
            {billing.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-white/5 px-4 py-3 text-sm">
                <div>
                  <span className="capitalize font-medium">{item.product}</span>
                  <span className="text-muted-foreground ml-2">{item.plan === "yearly" ? "Yearly" : "Monthly"}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span>${item.amount} {item.currency}</span>
                  <span className={item.status === "completed" ? "text-green-400" : "text-yellow-400"}>{item.status}</span>
                  <span className="text-muted-foreground text-xs">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
