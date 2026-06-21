"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles, Copy, Check, FileText } from "lucide-react"

interface Proposal {
  title: string
  executiveSummary: string
  approach: string
  deliverables: string[]
  timeline: string
  investment: string
  nextSteps: string
}

export default function ProposalsPage() {
  const router = useRouter()
  const [clientName, setClientName] = useState("")
  const [projectScope, setProjectScope] = useState("")
  const [deliverables, setDeliverables] = useState("")
  const [timeline, setTimeline] = useState("")
  const [budget, setBudget] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, projectScope, deliverables, timeline, budget, additionalNotes: additionalNotes || undefined }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setProposal(data.proposal)
    } catch {
      setError("Failed to generate proposal.")
    }
    setLoading(false)
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Client Proposals</h1>
        <p className="text-muted-foreground">Generate AI-powered client proposals</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Create a Proposal</CardTitle><CardDescription>Fill in the details to generate a professional proposal</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g., Acme Corp" required />
              </div>
              <div className="space-y-2">
                <Label>Budget Range</Label>
                <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g., $5,000 - $10,000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Project Scope *</Label>
              <textarea value={projectScope} onChange={e => setProjectScope(e.target.value)} placeholder="Describe what the client needs..." rows={3}
                className="flex w-full rounded-lg border border-white/10 bg-primary/50 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" required />
            </div>
            <div className="space-y-2">
              <Label>Deliverables</Label>
              <Input value={deliverables} onChange={e => setDeliverables(e.target.value)} placeholder="e.g., Website redesign, SEO audit, 5 blog posts" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Input value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="e.g., 4 weeks" />
              </div>
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Input value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} placeholder="Any special requirements" />
              </div>
            </div>
            <Button type="submit" disabled={loading || !clientName || !projectScope}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating..." : "Generate Proposal"}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {proposal && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div><CardTitle>{proposal.title || "Proposal"}</CardTitle></div>
              <button onClick={() => copyText(proposal.executiveSummary + "\n\n" + proposal.approach + "\n\n" + proposal.timeline + "\n\n" + proposal.investment, "all")} className="text-muted-foreground hover:text-white transition-colors">
                {copied === "all" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-accent mb-2">Executive Summary</h3>
                <p className="text-sm text-muted-foreground">{proposal.executiveSummary}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-accent mb-2">Approach</h3>
                <p className="text-sm text-muted-foreground">{proposal.approach}</p>
              </div>
              {proposal.deliverables.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-accent mb-2">Deliverables</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {proposal.deliverables.map((d, i) => <li key={i} className="text-sm text-muted-foreground">{d}</li>)}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-accent mb-2">Timeline</h3>
                  <p className="text-sm text-muted-foreground">{proposal.timeline}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-accent mb-2">Investment</h3>
                  <p className="text-sm text-muted-foreground">{proposal.investment}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-accent mb-2">Next Steps</h3>
                <p className="text-sm text-muted-foreground">{proposal.nextSteps}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
