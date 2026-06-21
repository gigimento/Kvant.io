import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paddle } from "@/lib/paddle/client"

export async function POST(request: Request) {
  try {
    const { priceId, plan } = await request.json()
    if (!priceId || !plan) {
      return NextResponse.json({ error: "priceId and plan required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transaction = await paddle.createTransaction(
      [{ priceId, quantity: 1 }],
      user.email
    )

    const checkoutUrl = transaction.data?.urls?.checkout
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
    }

    return NextResponse.json({
      checkoutUrl,
      transactionId: transaction.data.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
