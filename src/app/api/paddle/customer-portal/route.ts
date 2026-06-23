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

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (!subs?.paddle_subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 })
    }

    const sub = await paddle.getSubscription(subs.paddle_subscription_id)
    const customerId = sub.data?.customer_id
    if (!customerId) {
      return NextResponse.json({ error: "No customer found" }, { status: 404 })
    }

    const portal = await paddle.createCustomerPortal(customerId)
    const portalUrl = portal.data?.url

    if (!portalUrl) {
      return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
    }

    return NextResponse.json({ portalUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
