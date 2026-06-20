"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Loader2, Sparkles, Trash2 } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [config, setConfig] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: cfg } = await supabase.from("report_configs").select("*").eq("id", params.id).single()
    setConfig(cfg)

    const { data: rpts } = await supabase.from("reports").select("*").eq("config_id", params.id).is("deleted_at", null).order("created_at", { ascending: false })
    setReports(rpts || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [params.id])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId: params.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(`Generation failed: ${err.error || res.statusText}`)
        return
      }
      await loadData()
    } catch (e: any) {
      alert(`Network error: ${e.message}`)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
  if (!config) return <div className="text-center py-16"><p className="text-muted-foreground">Report not found.</p><Button className="mt-4" asChild><Link href="/dashboard/reports">Back</Link></Button></div>

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/reports" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-2xl font-bold">{config.name}</h1>
          <p className="text-muted-foreground">Client: {config.client_name} &middot; {config.schedule}</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-1 h-4 w-4" /> Generate Report</>}
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold">No reports yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Click "Generate Report" to create your first narrative.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className={report.status === "generating" ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Report — {formatDate(report.period_start)} to {formatDate(report.period_end)}</CardTitle>
                </div>
                <Badge variant={report.status === "ready" ? "success" : report.status === "generating" ? "warning" : report.status === "failed" ? "danger" : "secondary"}>
                  {report.status}
                </Badge>
              </CardHeader>
              {report.narrative_text && (
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                    {report.narrative_text}
                  </div>
                </CardContent>
              )}
              <div className="px-6 pb-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={async () => {
                    if (!confirm("Delete this report?")) return
                    const supabase = createClient()
                    const { error } = await supabase
                      .from("reports")
                      .update({ deleted_at: new Date().toISOString() })
                      .eq("id", report.id)
                    if (error) alert(`Delete failed: ${error.message}`)
                    loadData()
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
