import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/google-ads/callback`

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard/connections?error=ads_denied`)
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.redirect(`${origin}/dashboard/connections?error=not_configured`)
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })

  const tokens = await tokenResponse.json()
  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${origin}/dashboard/connections?error=token_exchange`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  await supabase.from("data_connections").insert({
    user_id: user.id,
    provider: "google_ads",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    provider_account_name: "Google Ads",
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  })

  return NextResponse.redirect(`${origin}/dashboard/connections?success=ads`)
}
