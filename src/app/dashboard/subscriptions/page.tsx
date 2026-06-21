"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader, ExternalLink } from "lucide-react"

const PRICE_IDS: Record<string, string> = {
  monthly: "pri_01kvkva7hbtmngwv59d2hsr1yn",
  yearly: "pri_01kvkva7qmnz1d3fhd4gtznxsr",
}

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$29",
    features: ["Narrative Reports", "Brand Radar", "Up to 5 reports/mo", "Up to 3 brand monitors", "Email support"],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$290",
    period: "/year",
    badge: "Save 17%",
    features: ["Narrative Reports", "Brand Radar", "Up to 5 reports/mo", "Up to 3 brand monitors", "Email support", "Priority support"],
  },
]

export default function SubscriptionsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subs, setSubs] = useState<any[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
      setSubs(subscriptions || [])

      const { data: history } = await supabase
        .from("billing_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setBilling(history || [])

      setLoading(false)
    })
  }, [router])

  async function handleCheckout(planId: string) {
    const priceId = PRICE_IDS[planId]
    if (!priceId) return

    setCheckoutLoading(planId)
    try {
      const res = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, plan: planId }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err) {
      console.error("Checkout failed", err)
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  const activeSub = subs.find((s) => s.status === "active")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Manage your plan and billing</p>
      </div>

      {activeSub ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">{activeSub.product} Plan</CardTitle>
                <CardDescription>
                  {activeSub.plan === "yearly" ? "Yearly billing" : "Monthly billing"} &middot;{" "}
                  {new Date(activeSub.current_period_end).toLocaleDateString("en-US", {
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No active subscription</CardTitle>
            <CardDescription>Choose a plan below to get started</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.badge ? "border-accent/50" : ""}>
            <CardHeader>
              {plan.badge && (
                <span className="mb-2 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent w-fit">
                  {plan.badge}
                </span>
              )}
              <CardTitle className="text-2xl">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">{plan.period || "/mo"}</span>
              </CardTitle>
              <CardDescription>{plan.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
              <Button
                className="w-full mt-4"
                onClick={() => handleCheckout(plan.id)}
                disabled={checkoutLoading === plan.id || !!activeSub}
              >
                {checkoutLoading === plan.id ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : activeSub ? (
                  "Current Plan"
                ) : (
                  "Subscribe"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
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
