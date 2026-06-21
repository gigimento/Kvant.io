import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    // Verify webhook signature
    const signature = request.headers.get("paddle-signature")
    if (WEBHOOK_SECRET) {
      const expected = await verifyPaddleSignature(rawBody, signature || "", WEBHOOK_SECRET)
      if (!expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event_type

    const supabase = await createClient()

    async function handleTransaction(tx: any) {
      const email = tx.customer?.email
      if (!email) return

      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find((u: any) => u.email === email)
      if (!user) return

      const items = tx.items || []
      const priceId = items[0]?.price?.id || ""
      const plan = priceId.includes("yearly") ? "yearly" : "monthly"

      // Upsert subscription — match on paddle_subscription_id to handle renewals
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          paddle_subscription_id: tx.subscription_id?.toString(),
          product: "combined",
          status: "active",
          plan,
          current_period_start: tx.billing_period?.starts_at || new Date().toISOString(),
          current_period_end: tx.billing_period?.ends_at || new Date().toISOString(),
        }, { onConflict: "paddle_subscription_id" })

      // Avoid duplicate billing history rows
      const { data: existing } = await supabase
        .from("billing_history")
        .select("id")
        .eq("paddle_transaction_id", tx.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from("billing_history").insert({
          user_id: user.id,
          paddle_transaction_id: tx.id,
          product: "combined",
          plan,
          amount: tx.details?.totals?.grand_total
            ? parseFloat(tx.details.totals.grand_total) / 100
            : 0,
          currency: tx.currency_code || "USD",
          status: "completed",
          period_start: tx.billing_period?.starts_at,
          period_end: tx.billing_period?.ends_at,
        })
      }
    }

    switch (eventType) {
      case "transaction.completed":
      case "transaction.paid": {
        await handleTransaction(event.data)
        break
      }

      case "transaction.canceled":
      case "transaction.refunded": {
        const tx = event.data
        if (tx.subscription_id) {
          await supabase
            .from("subscriptions")
            .update({ status: tx.status === "refunded" ? "expired" : "cancelled" })
            .eq("paddle_subscription_id", tx.subscription_id.toString())
        }
        break
      }

      case "subscription.canceled": {
        const sub = event.data
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("paddle_subscription_id", sub.id.toString())
        break
      }

      case "subscription.updated": {
        const sub = event.data
        const status = sub.status === "active" ? "active"
          : sub.status === "canceled" ? "cancelled"
          : sub.status === "past_due" ? "past_due"
          : sub.status

        await supabase
          .from("subscriptions")
          .update({
            status,
            current_period_end: sub.current_billing_period?.ends_at,
          })
          .eq("paddle_subscription_id", sub.id.toString())
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Paddle webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function verifyPaddleSignature(
  body: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const crypto = await import("crypto")
    const parts = signatureHeader.split(";")
    const ts = parts.find((p) => p.startsWith("ts="))?.slice(3)
    const sig = parts.find((p) => p.startsWith("sig="))?.slice(4)
    if (!ts || !sig) return false
    const signedContent = `${ts}:${body}`
    const expected = crypto.default
      .createHmac("sha256", secret)
      .update(signedContent)
      .digest("hex")
    return expected === sig
  } catch {
    return false
  }
}
