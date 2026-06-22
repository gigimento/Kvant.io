"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Palette, Key, Mail, User } from "lucide-react"
import { useToast } from "@/lib/use-toast"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const [newEmail, setNewEmail] = useState("")
  const [changingEmail, setChangingEmail] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    setEmail(user.email || "")

    const res = await fetch("/api/profile")
    const data = await res.json()
    if (data.profile) {
      setFullName(data.profile.full_name || "")
      setCompanyName(data.profile.company_name || "")
      setRole(data.profile.role || "")
    }
    setLoading(false)
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, company_name: companyName, role: role || undefined }),
    })
    const data = await res.json()
    if (data.error) {
      addToast(data.error, "error")
    } else {
      addToast("Profile updated", "success")
    }
    setSaving(false)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      addToast("Passwords don't match", "error")
      return
    }
    if (newPassword.length < 6) {
      addToast("Password must be at least 6 characters", "error")
      return
    }
    setChangingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      addToast(error.message, "error")
    } else {
      addToast("Password updated", "success")
      setNewPassword("")
      setConfirmPassword("")
    }
    setChangingPassword(false)
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setChangingEmail(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) {
      addToast(error.message, "error")
    } else {
      addToast("Confirmation email sent. Check your inbox.", "success")
      setNewEmail("")
    }
    setChangingEmail(false)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="skeleton-text" />
          <div className="skeleton-text-short" />
        </div>
        <div className="skeleton-card h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="default" size="sm" disabled>Account</Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings/branding"><Palette className="h-4 w-4" /> Branding</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
          <CardDescription>Update your name, company, and role</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-white/10 bg-primary/50 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <option value="">Select a role</option>
                <option value="agency">Agency</option>
                <option value="freelancer">Freelancer</option>
                <option value="business">Business</option>
              </select>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email</CardTitle>
          <CardDescription>Current: <span className="text-white">{email}</span></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label>New Email</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" required />
            </div>
            <Button type="submit" disabled={changingEmail || !newEmail}>
              {changingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {changingEmail ? "Sending..." : "Change Email"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Password</CardTitle>
          <CardDescription>Set a new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
              </div>
            </div>
            <Button type="submit" disabled={changingPassword || !newPassword || !confirmPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
