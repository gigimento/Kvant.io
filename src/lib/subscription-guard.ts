import { createClient as createServerClient } from "@/lib/supabase/server"

export async function checkServerAccess(): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, reason: "unauthorized" }

  // Check for active subscription
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")

  if (subs && subs.length > 0) return { allowed: true }

  // Check trial period
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at")
    .eq("user_id", user.id)
    .single()

  if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
    return { allowed: true }
  }

  return { allowed: false, reason: "subscription_required" }
}
