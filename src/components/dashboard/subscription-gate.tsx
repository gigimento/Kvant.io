"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader, Lock } from "lucide-react"

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked">("loading")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
      if (subs && subs.length > 0) {
        setStatus("allowed")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at")
        .eq("user_id", user.id)
        .single()
      if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
        setStatus("allowed")
        return
      }

      setStatus("blocked")
    })
  }, [router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  if (status === "blocked") {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Lock className="h-6 w-6 text-accent" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              Your trial has ended. Subscribe to continue using Kvant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/subscriptions")} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
