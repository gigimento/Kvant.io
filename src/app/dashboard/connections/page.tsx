"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader, Check, X, ExternalLink, RefreshCw, BarChart3, Megaphone, MessageCircle } from "lucide-react"

const providers = [
  {
    id: "ga4" as const,
    label: "Google Analytics 4",
    icon: BarChart3,
    desc: "Import sessions, users, pageviews, bounce rate, and session duration data.",
    connectUrl: "/api/connections/ga4",
    color: "text-blue-400",
    envCheck: "GOOGLE_CLIENT_ID",
  },
  {
    id: "google_ads" as const,
    label: "Google Ads",
    icon: Megaphone,
    desc: "Track campaign performance, impressions, clicks, cost, and conversions.",
    connectUrl: "/api/connections/google-ads",
    color: "text-blue-400",
    envCheck: "GOOGLE_CLIENT_ID",
  },
  {
    id: "meta_ads" as const,
    label: "Meta Ads",
    icon: MessageCircle,
    desc: "Monitor ad account metrics: impressions, clicks, spend, reach, and CTR.",
    connectUrl: "/api/connections/meta-ads",
    color: "text-blue-400",
    warning: "Requires Meta app to be Live (not Development mode)",
    envCheck: "META_APP_ID",
  },
]

type ProviderId = "ga4" | "google_ads" | "meta_ads"

export default function ConnectionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const errorParam = searchParams.get("error")
  const errorDesc = searchParams.get("error_desc")
  const [user, setUser] = useState<any>(null)
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
      const { data: conns } = await supabase
        .from("data_connections")
        .select("*")
        .eq("user_id", user.id)
      setConnections(conns || [])
      setLoading(false)
    })
  }, [router])

  async function handleDelete(connId: string) {
    setDeleting(connId)
    const supabase = createClient()
    await supabase.from("data_connections").delete().eq("id", connId)
    setConnections((prev) => prev.filter((c) => c.id !== connId))
    setDeleting(null)
  }

  function hasProvider(id: ProviderId) {
    return connections.some((c) => c.provider === id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Data Connections</h1>
        <p className="text-muted-foreground">Connect your analytics and ads accounts for live data</p>
      </div>

      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Connection added successfully!
        </div>
      )}
      {errorParam && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 space-y-1">
          <p className="font-medium">
            {errorParam === "not_configured"
              ? "This integration is not configured yet."
              : errorParam === "meta_denied"
              ? "Meta Ads connection was denied."
              : errorParam === "token_exchange"
              ? "Meta Ads connection failed."
              : "Connection failed."}
          </p>
          {errorDesc && (
            <p className="text-xs text-red-300/70">{errorDesc}</p>
          )}
          {errorParam === "token_exchange" && (
            <p className="text-xs text-red-300/70 mt-1">
              Make sure your Meta app is out of Development mode or that you are added as a test user.
              Go to{" "}
              <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-red-200">
                Facebook Developers
              </a>{" "}
              to check your app status.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const Icon = provider.icon
          const connected = hasProvider(provider.id)
          return (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${provider.color}`} />
                  {connected ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                      <Check className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not connected</span>
                  )}
                </div>
                <CardTitle className="text-base mt-3">{provider.label}</CardTitle>
                <CardDescription>{provider.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(provider as any).warning && !connected && (
                  <p className="text-xs text-yellow-400/70 mb-1">{(provider as any).warning}</p>
                )}
                {connected ? (
                  <div className="space-y-2">
                    {connections
                      .filter((c) => c.provider === provider.id)
                      .map((conn) => (
                        <div key={conn.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                          <span className="text-muted-foreground truncate">
                            {conn.provider_account_name || provider.label}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(conn.id)}
                            disabled={deleting === conn.id}
                            className="text-red-400 hover:text-red-300"
                          >
                            {deleting === conn.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a href={provider.connectUrl}>
                      Connect <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
