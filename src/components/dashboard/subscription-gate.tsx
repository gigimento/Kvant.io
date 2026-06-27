"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function SubscriptionGate({ children, feature }: { children: React.ReactNode; feature?: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked">("loading")

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus("blocked")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at")
        .eq("id", user.id)
        .single()

      if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
        setStatus("allowed")
        return
      }

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle()

      if (!subscription) {
        setStatus("blocked")
        return
      }

      if (!feature) {
        setStatus("allowed")
        return
      }

      const { data: features } = await supabase
        .from("profiles")
        .select("user_features")
        .eq("id", user.id)
        .single()

      const accessible = features?.user_features?.includes(feature)
      setStatus(accessible ? "allowed" : "blocked")
    }

    check()
  }, [feature, router])

  if (status === "loading") return null

  if (status === "blocked") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-[#E19C63]/20 bg-[#27262E] p-8 text-center">
        <h3 className="text-lg font-semibold text-white">Upgrade to Access</h3>
        <p className="text-sm text-[#8BA5BE]">
          This feature requires an active subscription.
        </p>
        <a
          href="/dashboard/subscriptions"
          className="rounded-md bg-[#E19C63] px-4 py-2 text-sm font-medium text-[#27262E] hover:bg-[#E19C63]/90"
        >
          View Plans
        </a>
      </div>
    )
  }

  return <>{children}</>
}
