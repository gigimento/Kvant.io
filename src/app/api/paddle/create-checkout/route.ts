import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paddle } from "@/lib/paddle/client"
import { getPriceForSelection } from "@/lib/features"

export async function POST(request: Request) {
  try {
    const { features, plan } = await request.json()
    if (!features || !Array.isArray(features) || features.length === 0 || !plan) {
      return NextResponse.json({ error: "features (array) and plan required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { priceId } = getPriceForSelection(features.length, plan)

    const transaction = await paddle.createTransaction(
      [{ priceId, quantity: 1 }],
      user.email,
      { user_id: user.id, features: features.join(",") }
    )

    const checkoutUrl = transaction.data?.urls?.checkout
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
    }

    // Save features immediately so the user gets access even before webhook fires
    await supabase
      .from("profiles")
      .update({ user_features: features })
      .eq("user_id", user.id)

    return NextResponse.json({
      checkoutUrl,
      transactionId: transaction.data.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
