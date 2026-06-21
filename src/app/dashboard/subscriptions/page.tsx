"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Loader, ExternalLink } from "lucide-react"

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

      {/* Current plan */}
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
          <CardContent>
            <Button variant="outline" asChild>
              <a href="#" className="gap-2">
                Manage on Paddle <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No active subscription</CardTitle>
            <CardDescription>Choose a plan below to get started</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Pricing */}
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
              <Button className="w-full mt-4" disabled={!activeSub}>
                {activeSub ? "Current Plan" : "Coming soon"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Billing history */}
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
