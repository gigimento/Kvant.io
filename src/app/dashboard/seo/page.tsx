"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SEOPage() {
  const router = useRouter()
  const [monitors, setMonitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return }
      supabase.from("brand_monitors").select("*").order("created_at", { ascending: false }).then((res) => {
        if (res.data) setMonitors(res.data)
        setLoading(false)
      })
    })
  }, [router])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Radar</h1>
          <p className="text-muted-foreground">Monitor how AI mentions your brand and competitors</p>
        </div>
        <Button asChild><Link href="/dashboard/seo/new"><Plus className="mr-1 h-4 w-4" /> New Monitor</Link></Button>
      </div>

      {monitors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold">No monitors yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create your first brand monitor.</p>
            <Button className="mt-6" asChild><Link href="/dashboard/seo/new"><Plus className="mr-1 h-4 w-4" /> Create Monitor</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {monitors.map((m) => (
            <Link key={m.id} href={`/dashboard/seo/${m.id}`}>
              <Card className="transition-colors hover:border-accent/30 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{m.brand_name}</CardTitle>
                    <CardDescription>{(m.competitors as any[])?.length || 0} competitors &middot; {(m.keywords as any[])?.length || 0} keywords</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={m.is_active ? "success" : "secondary"}>{m.is_active ? "Active" : "Paused"}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
