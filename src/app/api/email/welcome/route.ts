import { NextResponse } from "next/server"

const RESEND_API_KEY = process.env.RESEND_API_KEY

export async function POST(req: Request) {
  if (!RESEND_API_KEY || RESEND_API_KEY === "your_resend_api_key") {
    return NextResponse.json({ sent: false, reason: "not_configured" })
  }

  try {
    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const { buildWelcomeHtml } = await import("@/lib/email/templates/welcome")

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kvant <hello@kvantio.vercel.app>",
        to: [email],
        subject: "Welcome to Kvant — your AI agency toolkit",
        html: buildWelcomeHtml(name || ""),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Resend welcome email failed:", err)
      return NextResponse.json({ sent: false, error: err }, { status: 500 })
    }

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error("Welcome email error:", error)
    return NextResponse.json({ sent: false, error: String(error) }, { status: 500 })
  }
}
