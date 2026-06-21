import { createClient as createServerClient } from "@/lib/supabase/server"

export async function checkServerAccess(feature?: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, reason: "unauthorized" }

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")

  if (subs && subs.length > 0) {
    if (feature) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_features")
        .eq("user_id", user.id)
        .single()

      const features = profile?.user_features
      if (features && Array.isArray(features) && features.length > 0 && !features.includes(feature)) {
        return { allowed: false, reason: "feature_not_available" }
      }
    }
    return { allowed: true }
  }

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
