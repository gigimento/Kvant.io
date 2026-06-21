"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single()
      if (!profile?.onboarding_completed) {
        router.push("/onboarding")
        return
      }
      setReady(true)
    })
  }, [router])

  if (!ready) return null
  return <>{children}</>
}
