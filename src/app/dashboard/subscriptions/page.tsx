"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Check, Loader, ArrowRight, Minus, Plus } from "lucide-react"
import {
  TIER_INFO,
  TIER_PRICES,
  ALL_FEATURES,
  getRecommendedTier,
  getTierCount,
  type TierSlug,
} from "@/lib/features"

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
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(ALL_FEATURES.map((f) => f.slug))

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

  function toggleFeature(slug: string) {
    setSelectedFeatures((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  function selectAll() {
    setSelectedFeatures(ALL_FEATURES.map((f) => f.slug))
  }

  function deselectAll() {
    setSelectedFeatures([])
  }

  const selectedCount = selectedFeatures.length
  const recommendedTier = getRecommendedTier(selectedCount)
  const tierFeaturesCount = getTierCount(recommendedTier)
  const price = TIER_PRICES[recommendedTier]
  const amount = plan === "monthly" ? price.price : price.price * 10

  async function handleCheckout(tier: TierSlug) {
    setCheckoutLoading(tier)
    setCheckoutError("")
    try {
      const res = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, plan, features: selectedFeatures }),
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
          <p className="text-muted-foreground">Pick your tools, pay only for what you need</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tool selector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your tools ({selectedCount}/{ALL_FEATURES.length})</h2>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-muted-foreground hover:text-white transition-colors">Select All</button>
              <button onClick={deselectAll} className="text-xs text-muted-foreground hover:text-white transition-colors">Clear</button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ALL_FEATURES.map((f) => {
              const Icon = f.icon
              const selected = selectedFeatures.includes(f.slug)
              return (
                <button
                  key={f.slug}
                  onClick={() => toggleFeature(f.slug)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    selected
                      ? "border-accent/50 bg-accent/5"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    selected ? "bg-accent border-accent text-white" : "border-white/20"
                  )}>
                    {selected ? <Check className="h-3 w-3" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent shrink-0" />
                      <span className="text-sm font-medium">{f.name}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Summary card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tools selected</span>
                  <span className="font-medium">{selectedCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recommended plan</span>
                  <Badge variant="secondary">{TIER_INFO[recommendedTier].name}</Badge>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold">${amount}</span>
                    <span className="text-sm text-muted-foreground">/{plan === "monthly" ? "mo" : "yr"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {TIER_INFO[recommendedTier].label} &middot; up to {tierFeaturesCount} tools
                  </p>
                </div>
                {selectedCount > 0 && !activeSub && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={checkoutLoading === recommendedTier}
                      onClick={() => handleCheckout(recommendedTier)}
                    >
                      {checkoutLoading === recommendedTier ? <Loader className="h-4 w-4 animate-spin" /> : `Subscribe to ${TIER_INFO[recommendedTier].name}`}
                      {!checkoutLoading && <ArrowRight className="ml-1 h-4 w-4" />}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">14-day free trial &middot; No credit card required</p>
                  </>
                )}
                {selectedCount === 0 && (
                  <p className="text-xs text-center text-muted-foreground">Select at least one tool to continue</p>
                )}
              </CardContent>
            </Card>

            {/* Quick tier links */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">Or choose a plan directly:</p>
              <div className="grid grid-cols-3 gap-2">
                {(["starter", "pro", "agency"] as TierSlug[]).map((tier) => {
                  const info = TIER_INFO[tier]
                  const p = TIER_PRICES[tier]
                  const a = plan === "monthly" ? p.price : p.price * 10
                  const isActive = activeSub && userTier === tier
                  return (
                    <button
                      key={tier}
                      onClick={() => !isActive && handleCheckout(tier)}
                      disabled={isActive || checkoutLoading === tier}
                      className={cn(
                        "rounded-lg border p-3 text-center transition-all text-sm",
                        isActive ? "border-accent/50 bg-accent/5" : "border-white/5 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="font-medium">{info.name}</div>
                      <div className="text-lg font-bold">${a}</div>
                      <div className="text-xs text-muted-foreground">/{plan === "monthly" ? "mo" : "yr"}</div>
                      {isActive && <div className="text-xs text-accent mt-1">Current</div>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {checkoutError && <p className="text-center text-sm text-red-400">{checkoutError}</p>}

      {/* All features reference */}
      <Card>
        <CardHeader>
          <CardTitle>All Features</CardTitle>
          <CardDescription>What each plan includes</CardDescription>
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
                {ALL_FEATURES.map((f) => (
                  <tr key={f.slug} className="border-b border-white/5">
                    <td className="py-3 pr-4">{f.name}</td>
                    {(["starter", "pro", "agency"] as TierSlug[]).map((t) => {
                      const featureTierIndex = ["starter", "pro", "agency"].indexOf(f.tier)
                      const tierIndex = ["starter", "pro", "agency"].indexOf(t)
                      return (
                        <td key={t} className="text-center py-3 px-4">
                          {featureTierIndex <= tierIndex ? <Check className="mx-auto h-4 w-4 text-accent" /> : <span className="text-muted-foreground/30">&mdash;</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
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
