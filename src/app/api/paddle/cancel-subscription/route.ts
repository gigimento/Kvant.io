import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paddle } from "@/lib/paddle/client"

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (!sub?.paddle_subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 })
    }

    await paddle.cancelSubscription(sub.paddle_subscription_id)

    await supabase
      .from("subscriptions")
      .update({ status: "canceling" })
      .eq("paddle_subscription_id", sub.paddle_subscription_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
