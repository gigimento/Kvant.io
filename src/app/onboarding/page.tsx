"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Search, Check, ArrowRight } from "lucide-react"

const features = [
  { id: "reports", label: "Narrative Reports", icon: FileText, desc: "AI-generated client reports with narrative storytelling" },
  { id: "seo", label: "Brand Radar", icon: Search, desc: "Track brand visibility across LLMs and search engines" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, full_name, company_name, role")
        .eq("user_id", user.id)
        .maybeSingle()
      if (profile?.onboarding_completed) {
        router.push("/dashboard")
        return
      }
      if (profile?.full_name) setFullName(profile.full_name)
      if (profile?.company_name) setCompanyName(profile.company_name)
      if (profile?.role) setRole(profile.role)
      setLoading(false)
    })
  }, [router])

  async function saveAndNext() {
    setSaving(true)
    setError("")
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) {
      setError(userError?.message || "User not found. Please sign in again.")
      setSaving(false)
      return
    }
    const { error: upsertError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: fullName,
      company_name: companyName,
      role: role || null,
    })
    if (upsertError) {
      setError(`Failed to save: ${upsertError.message}`)
      setSaving(false)
      return
    }
    setSaving(false)
    setStep(1)
  }

  async function completeOnboarding() {
    setSaving(true)
    setError("")
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) {
      setError(userError?.message || "User not found.")
      setSaving(false)
      return
    }
    const { error: updateError } = await supabase.from("profiles").update({
      onboarding_completed: true,
    }).eq("user_id", user.id)
    if (updateError) {
      setError(`Failed to complete: ${updateError.message}`)
      setSaving(false)
      return
    }
    setSaving(false)
    router.push("/dashboard")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link href="/" className="text-lg font-bold tracking-tight">Kvant</Link>
          <CardTitle className="mt-4">
            {step === 0 ? "Welcome to Kvant" : "What brings you here?"}
          </CardTitle>
          <CardDescription>
            {step === 0
              ? "Tell us a bit about yourself"
              : "Pick the features you want to use"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your agency or company" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select one</option>
                  <option value="agency">Marketing Agency</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="business">Business Owner</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={saveAndNext} className="w-full" disabled={saving || !fullName}>
                {saving ? "Saving..." : "Continue"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {features.map((f) => {
                const selected = selectedFeatures.includes(f.id)
                const Icon = f.icon
                return (
                  <button
                    key={f.id}
                    onClick={() =>
                      setSelectedFeatures((prev) =>
                        prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id]
                      )
                    }
                    className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                      selected ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      selected ? "bg-accent text-white" : "bg-white/5 text-muted-foreground"
                    }`}>
                      {selected ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{f.label}</div>
                      <div className="text-sm text-muted-foreground">{f.desc}</div>
                    </div>
                  </button>
                )
              })}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={completeOnboarding} className="w-full" disabled={saving}>
                {saving ? "Setting up..." : "Go to Dashboard"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
