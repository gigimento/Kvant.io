"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Search, Check, ArrowRight, Mail, Eye } from "lucide-react"

const features = [
  { id: "brand-radar", label: "Brand Radar", icon: Search, desc: "Monitor how AI models talk about your clients' brands" },
  { id: "geo-briefs", label: "GEO Briefs", icon: FileText, desc: "Actionable plans to improve AI visibility" },
  { id: "pdf-audit", label: "PDF Audit", icon: Eye, desc: "Generate client-ready AI visibility audit reports" },
]

const steps = [
  { label: "Profile", description: "Tell us about yourself" },
  { label: "Features", description: "Pick your tools" },
  { label: "Verify", description: "Confirm your email" },
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
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["brand-radar", "geo-briefs", "pdf-audit"])
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)

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
      setEmailVerified(!!user.email_confirmed_at)
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

  async function handleVerification() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    setSaving(true)
    setError("")
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (resendError) {
      setError(resendError.message)
    } else {
      setVerificationSent(true)
    }
    setSaving(false)
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
    // Fire welcome email (async, don't block redirect)
    fetch("/api/email/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, name: fullName }),
    }).catch(() => {})
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
          <div className="mt-6 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i <= step ? "bg-accent text-white" : "bg-white/10 text-muted-foreground"
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`hidden sm:inline text-sm ${
                  i === step ? "text-white font-medium" : "text-muted-foreground"
                }`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block h-px w-6 ${
                    i < step ? "bg-accent" : "bg-white/10"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <CardTitle className="mt-6">
            {step === 0 ? "Welcome to Kvant" : step === 1 ? "What brings you here?" : "Verify your email"}
          </CardTitle>
          <CardDescription>
            {step === 0
              ? "Tell us a bit about yourself"
              : step === 1
              ? "Pick the features you want to use"
              : "Confirm your email address to get started"}
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
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-[#1e1d24] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" className="bg-[#1e1d24]">Select one</option>
                  <option value="agency" className="bg-[#1e1d24]">Marketing Agency</option>
                  <option value="freelancer" className="bg-[#1e1d24]">Freelancer</option>
                  <option value="business" className="bg-[#1e1d24]">Business Owner</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={saveAndNext} className="w-full" disabled={saving || !fullName}>
                {saving ? "Saving..." : "Continue"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : step === 1 ? (
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
              <Button onClick={() => setStep(2)} className="w-full" disabled={saving}>
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  {emailVerified ? (
                    <Check className="h-8 w-8 text-green-400" />
                  ) : (
                    <Mail className="h-8 w-8 text-yellow-400" />
                  )}
                </div>
              </div>
              {emailVerified ? (
                <div>
                  <p className="text-muted-foreground mt-2">Your email is verified. You&apos;re all set!</p>
                  <Button onClick={completeOnboarding} className="mt-6" disabled={saving}>
                    {saving ? "Loading..." : "Go to Dashboard"} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mt-2">
                    We sent a verification email. Click the link in the email to confirm your address.
                  </p>
                  {verificationSent && (
                    <p className="text-sm text-green-400 mt-2">Email sent! Check your inbox.</p>
                  )}
                  {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
                    <Button onClick={handleVerification} disabled={saving} variant="outline">
                      {saving ? "Sending..." : verificationSent ? "Resend Email" : "Send Verification Email"}
                    </Button>
                    <Button
                      onClick={async () => {
                        const supabase = createClient()
                        const { data: { user } } = await supabase.auth.getUser()
                        if (user?.email_confirmed_at) {
                          setEmailVerified(true)
                        } else {
                          setError("Email not confirmed yet. Please check your inbox and click the link.")
                        }
                      }}
                      variant="outline"
                    >
                      I&apos;ve verified, continue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
