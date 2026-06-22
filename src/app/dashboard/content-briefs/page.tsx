"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Check, Sparkles, CalendarPlus, Trash2, Clock, ChevronLeft } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/lib/use-toast"

interface ContentBrief {
  id: string
  title: string
  outline: string[]
  keyPoints: string[]
  faqIdeas: { question: string; answer: string }[]
  toneAndStyle: string
  keyword: string
  audience?: string
  goal?: string
  created_at: string
}

function mapBrief(row: any): ContentBrief {
  return {
    id: row.id,
    title: row.title,
    outline: row.outline || [],
    keyPoints: row.key_points || [],
    faqIdeas: row.faq_ideas || [],
    toneAndStyle: row.tone_and_style || "",
    keyword: row.keyword,
    audience: row.audience,
    goal: row.goal,
    created_at: row.created_at,
  }
}

export default function ContentBriefsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [keyword, setKeyword] = useState("")
  const [audience, setAudience] = useState("")
  const [goal, setGoal] = useState("")
  const [brief, setBrief] = useState<ContentBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduling, setScheduling] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [savedBriefs, setSavedBriefs] = useState<ContentBrief[]>([])
  const [showHistory, setShowHistory] = useState(true)

  useEffect(() => {
    fetchSavedBriefs()
  }, [])

  async function fetchSavedBriefs() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const res = await fetch("/api/content-briefs")
    if (res.ok) {
      const data = await res.json()
      setSavedBriefs((data.briefs || []).map(mapBrief))
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/content-briefs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, audience: audience || undefined, goal: goal || undefined }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        const mapped = mapBrief(data.brief)
        setBrief(mapped)
        setShowHistory(false)
        setScheduled(false)
        setScheduleDate("")
        addToast("Brief saved", "success")
        fetchSavedBriefs()
      }
    } catch {
      setError("Failed to generate brief. Please try again.")
    }
    setLoading(false)
  }

  async function loadBrief(b: ContentBrief) {
    setBrief(b)
    setKeyword(b.keyword)
    setAudience(b.audience || "")
    setGoal(b.goal || "")
    setScheduled(false)
    setScheduleDate("")
    setShowHistory(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function deleteBrief(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const res = await fetch(`/api/content-briefs/${id}`, { method: "DELETE" })
    if (res.ok) {
      setSavedBriefs(prev => prev.filter(b => b.id !== id))
      if (brief?.id === id) setBrief(null)
      addToast("Brief deleted", "info")
    }
  }

  function copyToClipboard(text: string, section: string) {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    addToast("Copied to clipboard", "info")
    setTimeout(() => setCopiedSection(null), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Content Briefs</h1>
        <p className="text-muted-foreground">Generate and manage SEO content briefs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Saved Briefs</span>
                <span className="text-sm text-muted-foreground font-normal">{savedBriefs.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {savedBriefs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No briefs yet. Generate one above.</p>
              ) : (
                savedBriefs.map(b => (
                  <div
                    key={b.id}
                    onClick={() => loadBrief(b)}
                    className={`group flex items-start justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      brief?.id === b.id ? "bg-accent/20 border border-accent/30" : "bg-primary/30 hover:bg-primary/50 border border-white/5"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.title || b.keyword}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(b.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteBrief(b.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create a Brief</CardTitle>
              <CardDescription>Fill in the details to generate a content brief</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">Target Keyword *</Label>
                  <Input id="keyword" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g., AI marketing tools" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input id="audience" value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g., Marketing managers" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Content Goal</Label>
                  <select
                    id="goal"
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-white/10 bg-primary/50 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a goal</option>
                    <option value="Inform">Inform</option>
                    <option value="Educate">Educate</option>
                    <option value="Convert">Convert</option>
                    <option value="Entertain">Entertain</option>
                  </select>
                </div>
                <Button type="submit" disabled={loading || !keyword}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Generating..." : "Generate Brief"}
                </Button>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </form>
            </CardContent>
          </Card>

          {brief && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Schedule to Calendar</CardTitle>
                    <CardDescription>Add this brief to your content calendar</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {scheduled ? (
                    <p className="text-sm text-green-400">Added to calendar for {format(new Date(scheduleDate), "MMMM d, yyyy")}</p>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-fit" />
                      <Button size="sm" onClick={async () => {
                        if (!scheduleDate) return
                        setScheduling(true)
                        try {
                          await fetch("/api/content-calendar", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ title: `Brief: ${brief.title}`, scheduled_date: scheduleDate, content_brief_id: brief.id }),
                          })
                          setScheduled(true)
                          addToast("Added to calendar", "success")
                        } catch {}
                        setScheduling(false)
                      }} disabled={!scheduleDate || scheduling}>
                        {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                        {scheduling ? "Adding..." : "Add to Calendar"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="reveal">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Suggested Title</CardTitle>
                  </div>
                  <button onClick={() => copyToClipboard(brief.title, "title")} className="text-muted-foreground hover:text-white transition-colors">
                    {copiedSection === "title" ? <Check className="h-4 w-4 text-green-400 animate-scale-check" /> : <Copy className="h-4 w-4" />}
                  </button>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{brief.title}</p>
                </CardContent>
              </Card>

              <Card className="reveal" style={{ transitionDelay: "60ms" }}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Article Outline</CardTitle>
                  </div>
                  <button onClick={() => copyToClipboard(brief.outline.join("\n"), "outline")} className="text-muted-foreground hover:text-white transition-colors">
                    {copiedSection === "outline" ? <Check className="h-4 w-4 text-green-400 animate-scale-check" /> : <Copy className="h-4 w-4" />}
                  </button>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-5 space-y-1">
                    {brief.outline.map((section, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{section}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card className="reveal" style={{ transitionDelay: "120ms" }}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Key Points</CardTitle>
                  </div>
                  <button onClick={() => copyToClipboard(brief.keyPoints.join("\n"), "points")} className="text-muted-foreground hover:text-white transition-colors">
                    {copiedSection === "points" ? <Check className="h-4 w-4 text-green-400 animate-scale-check" /> : <Copy className="h-4 w-4" />}
                  </button>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    {brief.keyPoints.map((point, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{point}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="reveal" style={{ transitionDelay: "180ms" }}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>FAQ Ideas</CardTitle>
                  </div>
                  <button onClick={() => copyToClipboard(brief.faqIdeas.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n"), "faq")} className="text-muted-foreground hover:text-white transition-colors">
                    {copiedSection === "faq" ? <Check className="h-4 w-4 text-green-400 animate-scale-check" /> : <Copy className="h-4 w-4" />}
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brief.faqIdeas.map((faq, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium">Q: {faq.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">A: {faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="reveal" style={{ transitionDelay: "240ms" }}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Tone & Style</CardTitle>
                  </div>
                  <button onClick={() => copyToClipboard(brief.toneAndStyle, "tone")} className="text-muted-foreground hover:text-white transition-colors">
                    {copiedSection === "tone" ? <Check className="h-4 w-4 text-green-400 animate-scale-check" /> : <Copy className="h-4 w-4" />}
                  </button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{brief.toneAndStyle}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
