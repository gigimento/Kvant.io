"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewReportPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [clientName, setClientName] = useState("")
  const [schedule, setSchedule] = useState<"monthly" | "weekly">("monthly")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { router.push("/login"); return }

    const { error: insertError } = await supabase.from("report_configs").insert({
      user_id: user.user.id,
      name,
      client_name: clientName,
      data_sources: ["ga4"],
      schedule,
      is_active: true,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard/reports")
    router.refresh()
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <Link href="/dashboard/reports" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold">New Report Config</h1>
        <p className="text-muted-foreground">Set up a client report that generates automatically.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Details</CardTitle>
          <CardDescription>Configure basic settings for this report.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name</Label>
              <Input id="name" placeholder="e.g. Monthly Performance — ABC Corp" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client Name</Label>
              <Input id="client" placeholder="e.g. ABC Corp" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Schedule</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSchedule("monthly")}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-colors ${schedule === "monthly" ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-muted-foreground hover:border-white/20"}`}>Monthly</button>
                <button type="button" onClick={() => setSchedule("weekly")}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-colors ${schedule === "weekly" ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-muted-foreground hover:border-white/20"}`}>Weekly</button>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Report Config"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
