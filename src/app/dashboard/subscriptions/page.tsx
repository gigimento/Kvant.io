"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader, X } from "lucide-react"
import { ALL_FEATURES, getPriceForSelection } from "@/lib/features"
import { cn } from "@/lib/utils"

const ALL_SLUGS = ALL_FEATURES.map((f) => f.slug)

export default function SubscriptionsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subs, setSubs] = useState<any[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [userFeatures, setUserFeatures] = useState<string[]>(ALL_SLUGS)
  const [selected, setSelected] = useState<string[]>([])
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)

      const [subRes, histRes, profileRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", user.id),
        supabase.from("billing_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_features").eq("user_id", user.id).single(),
      ])

      setSubs(subRes.data || [])
      setBilling(histRes.data || [])

      const saved = profileRes.data?.user_features
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setUserFeatures(saved)
        setSelected(saved.filter((s: string) => ALL_SLUGS.includes(s)))
      } else {
        setSelected(ALL_SLUGS)
      }

      setLoading(false)
    })
  }, [router])

  function toggleFeature(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  async function handleCheckout() {
    if (selected.length === 0) return
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: selected, plan }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err) {
      console.error("Checkout failed", err)
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="skeleton-text" />
          <div className="skeleton-text-short" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
        <div className="skeleton-card" />
      </div>
    )
  }

  const activeSub = subs.find((s) => s.status === "active")
  const count = selected.length
  const { price: total } = getPriceForSelection(count, plan)
  const yearlyTotal = count === 0 ? 0 : total * 10

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Choose the tools you need</p>
      </div>

      {activeSub && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">Kvant Plan</CardTitle>
                <CardDescription>
                  {activeSub.plan === "yearly" ? "Yearly billing" : "Monthly billing"} &middot;{" "}
                  Renews {new Date(activeSub.current_period_end).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </CardDescription>
              </div>
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                Active
              </span>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Build Your Plan</CardTitle>
              <CardDescription>Select the tools you need. Pick any combination.</CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
              <button
                onClick={() => setPlan("monthly")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  plan === "monthly" ? "bg-accent text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setPlan("yearly")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  plan === "yearly" ? "bg-accent text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                Yearly
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ALL_FEATURES.map((feature, i) => {
              const Icon = feature.icon
              const isSelected = selected.includes(feature.slug)
              return (
                <button
                  key={feature.slug}
                  onClick={() => toggleFeature(feature.slug)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all reveal",
                    isSelected
                      ? "border-accent bg-accent/5"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  {isSelected && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                      <Check className="h-3 w-3 text-white animate-scale-check" />
                    </span>
                  )}
                  <Icon className={cn("h-5 w-5", isSelected ? "text-accent" : "text-muted-foreground")} />
                  <div>
                    <div className="text-sm font-medium">{feature.name}</div>
                    <div className="text-xs text-muted-foreground">{feature.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/30 reveal" style={{ transitionDelay: "120ms" }}>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                {count === 0 ? "No tools selected" : `${count} tool${count !== 1 ? "s" : ""} selected`}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {count === 0 ? "$0" : plan === "monthly" ? `$${total}` : `$${yearlyTotal}`}
                </span>
                <span className="text-muted-foreground">
                  /{plan === "monthly" ? "mo" : "yr"}
                </span>
              </div>
            </div>
            <Button
              size="lg"
              disabled={selected.length === 0 || checkoutLoading || !!activeSub}
              onClick={handleCheckout}
            >
              {checkoutLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : activeSub ? (
                "Current Plan"
              ) : (
                `Subscribe — ${plan === "monthly" ? `$${total}/mo` : `$${yearlyTotal}/yr`}`
              )}
            </Button>
          </div>

          {count > 0 && plan === "yearly" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Save {(1 - yearlyTotal / (total * 12)) * 100 > 0
                ? `${Math.round((1 - yearlyTotal / (total * 12)) * 100)}%`
                : ""} with yearly billing (2 months free)
            </p>
          )}
        </CardContent>
      </Card>

      <div className="reveal" style={{ transitionDelay: "180ms" }}>
        <h2 className="text-lg font-semibold mb-4">Billing History</h2>
        {billing.length === 0 ? (
          <p className="text-sm text-muted-foreground">No billing history yet.</p>
        ) : (
          <div className="space-y-2">
            {billing.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3 text-sm">
                <div>
                  <span className="capitalize font-medium">{item.product}</span>
                  <span className="text-muted-foreground ml-2">
                    {item.plan === "yearly" ? "Yearly" : "Monthly"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span>${item.amount} {item.currency}</span>
                  <span className={item.status === "completed" ? "text-green-400" : "text-yellow-400"}>
                    {item.status}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
