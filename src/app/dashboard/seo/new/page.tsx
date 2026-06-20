"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, X } from "lucide-react"
import Link from "next/link"

export default function NewMonitorPage() {
  const router = useRouter()
  const [brandName, setBrandName] = useState("")
  const [keywords, setKeywords] = useState<string[]>(["best marketing agency", "top social media management", "best SEO agency 2026"])
  const [keyword, setKeyword] = useState("")
  const [competitors, setCompetitors] = useState<string[]>([])
  const [competitor, setCompetitor] = useState("")
  const [loading, setLoading] = useState(false)

  function addKeyword() { if (keyword.trim() && !keywords.includes(keyword.trim())) { setKeywords([...keywords, keyword.trim()]); setKeyword("") } }
  function removeKeyword(k: string) { setKeywords(keywords.filter((x) => x !== k)) }
  function addCompetitor() { if (competitor.trim() && !competitors.includes(competitor.trim())) { setCompetitors([...competitors, competitor.trim()]); setCompetitor("") } }
  function removeCompetitor(c: string) { setCompetitors(competitors.filter((x) => x !== c)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) { router.push("/login"); return }
    await supabase.from("brand_monitors").insert({ user_id: user.user.id, brand_name: brandName, competitors, keywords, schedule: "weekly", is_active: true })
    router.push("/dashboard/seo")
    router.refresh()
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <Link href="/dashboard/seo" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold">New Brand Monitor</h1>
        <p className="text-muted-foreground">Track how AI responds when asked about your brand.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Your Brand Name *</Label>
              <Input id="brand" placeholder="e.g. Acme Marketing" value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Competitors</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g. Competitor Co" value={competitor} onChange={(e) => setCompetitor(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCompetitor())} />
                <Button type="button" variant="outline" onClick={addCompetitor}>Add</Button>
              </div>
              {competitors.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{competitors.map((c) => <span key={c} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs">{c}<button onClick={() => removeCompetitor(c)} className="text-muted-foreground hover:text-white"><X className="h-3 w-3" /></button></span>)}</div>}
            </div>
            <div className="space-y-2">
              <Label>Keywords / Questions to Track</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g. best marketing agency" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())} />
                <Button type="button" variant="outline" onClick={addKeyword}>Add</Button>
              </div>
              {keywords.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{keywords.map((k) => <span key={k} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs">{k}<button onClick={() => removeKeyword(k)} className="text-muted-foreground hover:text-white"><X className="h-3 w-3" /></button></span>)}</div>}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !brandName}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Monitor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
