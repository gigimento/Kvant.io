"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login")
        return
      }
      supabase
        .from("report_configs")
        .select("*, reports(count)")
        .order("created_at", { ascending: false })
        .then((res) => {
          if (res.data) setConfigs(res.data)
          setLoading(false)
        })
    })
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Narrative Reports</h1>
          <p className="text-muted-foreground">AI-powered client reports in plain English</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reports/new"><Plus className="mr-1 h-4 w-4" /> New Report</Link>
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No reports yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create your first report config.</p>
            <Button className="mt-6" asChild>
              <Link href="/dashboard/reports/new"><Plus className="mr-1 h-4 w-4" /> Create Report Config</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Link key={config.id} href={`/dashboard/reports/${config.id}`}>
              <Card className="transition-colors hover:border-accent/30 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{config.name}</CardTitle>
                    <CardDescription>Client: {config.client_name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={config.is_active ? "success" : "secondary"}>
                      {config.is_active ? "Active" : "Paused"}
                    </Badge>
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
