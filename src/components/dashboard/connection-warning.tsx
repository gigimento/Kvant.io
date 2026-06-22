"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Connection {
  id: string
  provider: string
  expires_at: string | null
  is_valid: boolean
}

export function ConnectionWarning() {
  const [expiring, setExpiring] = useState<Connection[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      supabase
        .from("data_connections")
        .select("id, provider, expires_at, is_valid")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (!data) return

          const threshold = Date.now() + 3 * 24 * 60 * 60 * 1000
          const warnings = data.filter((c: Connection) => {
            if (!c.is_valid) return true
            if (c.expires_at && new Date(c.expires_at).getTime() < threshold) return true
            return false
          })

          setExpiring(warnings)
        })
    })
  }, [])

  if (dismissed || expiring.length === 0) return null

  const providerLabel: Record<string, string> = {
    ga4: "Google Analytics",
    google_ads: "Google Ads",
    meta_ads: "Meta Ads",
  }

  return (
    <div className="mb-6 space-y-2">
      {expiring.map((conn) => (
        <div
          key={conn.id}
          className="flex items-center justify-between rounded-lg border border-red-400/30 bg-red-50 px-4 py-3 text-sm dark:bg-red-950/20"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="text-red-700 dark:text-red-300">
              {conn.is_valid
                ? `Connection to ${providerLabel[conn.provider] || conn.provider} is expiring soon.`
                : `Connection to ${providerLabel[conn.provider] || conn.provider} has expired — reports may fail.`}
              {" "}
              <a
                href="/dashboard/connections"
                className="font-medium underline underline-offset-2 hover:no-underline"
              >
                Reconnect
              </a>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {conn.is_valid && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <RefreshCw className="h-3 w-3" />
                Expiring
              </span>
            )}
            {!conn.is_valid && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                Expired
              </span>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="ml-1 rounded p-0.5 text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
