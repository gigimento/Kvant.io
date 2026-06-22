"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Mail, Loader2, X } from "lucide-react"

export function EmailVerificationBanner() {
  const [unverified, setUnverified] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !data.user.email_confirmed_at) {
        setUnverified(true)
      }
    })
  }, [])

  async function resendVerification() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    setSending(true)
    await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  if (!unverified || dismissed) return null

  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm">
      <Mail className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-yellow-200 font-medium">Email not verified</p>
        <p className="text-yellow-300/70 mt-0.5">Please verify your email address to access all features.</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {sent ? (
          <span className="text-xs text-green-400">Sent!</span>
        ) : (
          <button
            onClick={resendVerification}
            disabled={sending}
            className="text-xs text-yellow-400 hover:text-yellow-300 underline underline-offset-2 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Resend"}
          </button>
        )}
        <button onClick={() => setDismissed(true)} className="text-yellow-400/50 hover:text-yellow-300 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
