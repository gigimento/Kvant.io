import { NextResponse } from "next/server"

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/ga4/callback`
const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"].join(" ")

export async function GET() {
  if (!CLIENT_ID) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID in env." },
      { status: 501 }
    )
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
