import { NextResponse } from "next/server"

const APP_ID = process.env.META_APP_ID
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/meta-ads/callback`

export async function GET() {
  if (!APP_ID) {
    return NextResponse.json(
      { error: "Meta Ads not configured. Set META_APP_ID in env." },
      { status: 501 }
    )
  }

  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "ads_read,ads_management,business_management",
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v22.0/dialog/oauth?${params.toString()}`
  )
}
