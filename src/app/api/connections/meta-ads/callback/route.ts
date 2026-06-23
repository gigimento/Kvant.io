import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const APP_ID = process.env.META_APP_ID
const APP_SECRET = process.env.META_APP_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/meta-ads/callback`

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard/connections?error=meta_denied`)
  }

  if (!APP_ID || !APP_SECRET) {
    return NextResponse.redirect(`${origin}/dashboard/connections?error=not_configured`)
  }

  // Exchange code for short-lived token
  const tokenResponse = await fetch(
    "https://graph.facebook.com/v22.0/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    }
  )

  const tokens = await tokenResponse.json()
  if (!tokenResponse.ok) {
    const fbError = tokens?.error?.message || "Unknown Facebook error"
    return NextResponse.redirect(`${origin}/dashboard/connections?error=token_exchange&error_desc=${encodeURIComponent(fbError)}`)
  }

  // Exchange for long-lived token
  const longTokenResponse = await fetch(
    "https://graph.facebook.com/v22.0/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: tokens.access_token,
      }),
    }
  )

  const longTokens = await longTokenResponse.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  await supabase.from("data_connections").insert({
    user_id: user.id,
    provider: "meta_ads",
    access_token: longTokens.access_token || tokens.access_token,
    provider_account_name: "Meta Ads",
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return NextResponse.redirect(`${origin}/dashboard/connections?success=meta`)
}
