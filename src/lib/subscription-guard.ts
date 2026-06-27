import { createClient as createServerClient } from "@/lib/supabase/server"
import { ALL_FEATURES, type TierSlug } from "@/lib/features"

export async function checkServerAccess(feature?: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { allowed: false, reason: "not_authenticated" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at, user_features")
    .eq("id", user.id)
    .single()

  if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
    return { allowed: true }
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  if (!subscription) {
    return { allowed: false, reason: "Your trial has ended. Please subscribe to continue." }
  }

  if (!feature) {
    return { allowed: true }
  }

  const featureDef = ALL_FEATURES.find((f) => f.slug === feature)
  if (!featureDef) {
    return { allowed: false, reason: "Feature not found" }
  }

  const tier = subscription.plan as TierSlug
  const accessibleTiers: Set<TierSlug> =
    tier === "agency" ? new Set(["starter", "pro", "agency"])
    : tier === "pro" ? new Set(["starter", "pro"])
    : new Set(["starter"])

  if (!accessibleTiers.has(featureDef.tier)) {
    return { allowed: false, reason: "feature_not_available" }
  }

  return { allowed: true }
}
