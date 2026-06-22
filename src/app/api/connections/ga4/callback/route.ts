import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/ga4/callback`

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(`${origin}/dashboard/connections?error=ga4_denied`)
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.redirect(`${origin}/dashboard/connections?error=not_configured`)
  }

  // Exchange code for tokens
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

  const accountResponse = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )
  const accounts = await accountResponse.json()

  const firstProperty = accounts.accountSummaries?.[0]?.propertySummaries?.[0]
  const propertyId = firstProperty?.property?.replace("properties/", "") || ""
  const propertyName = firstProperty?.displayName || "GA4 Account"

  await supabase.from("data_connections").insert({
    user_id: user.id,
    provider: "ga4",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    provider_account_id: propertyId,
    provider_account_name: propertyName,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  })

  return NextResponse.redirect(`${origin}/dashboard/connections?success=ga4`)
}
