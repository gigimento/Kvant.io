import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paddle } from "@/lib/paddle/client"
import { getPriceForTier, getFeaturesByTier, ALL_FEATURES, type TierSlug } from "@/lib/features"

export async function POST(request: Request) {
  try {
    const { tier, plan, features } = await request.json()
    if (!tier || !["starter", "pro", "agency"].includes(tier) || !plan) {
      return NextResponse.json({ error: "tier (starter|pro|agency) and plan required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { priceId } = getPriceForTier(tier as TierSlug, plan)

    const transaction = await paddle.createTransaction(
      [{ priceId, quantity: 1 }],
      user.email,
      { user_id: user.id, tier }
    )

    const checkoutUrl = transaction.data?.urls?.checkout
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
    }

    // Save features immediately so the user gets access even before webhook fires
    const tierFeatures = getFeaturesByTier(tier as TierSlug).map((f) => f.slug)
    await supabase
      .from("profiles")
      .update({ user_features: features || tierFeatures })
      .eq("user_id", user.id)

    return NextResponse.json({
      checkoutUrl,
      transactionId: transaction.data.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
