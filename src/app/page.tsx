"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Search,
  TrendingUp,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Eye,
  MessageSquare,
  FileEdit,
  Calendar,
  Receipt,
  Presentation,
  Palette,
} from "lucide-react"

const ALL_FEATURES_MARKETING = [
  { name: "Narrative Reports", description: "AI-generated client reports from your analytics data", icon: FileText, price: "$9", beta: false },
  { name: "Brand Radar", description: "Monitor brand mentions across every major LLM", icon: Search, price: "$9", beta: false },
  { name: "Competitive Dashboard", description: "Track competitors and market positioning over time", icon: BarChart3, price: "$9", beta: true },
  { name: "Content Briefs", description: "Generate SEO-optimized content briefs in seconds", icon: FileEdit, price: "$9", beta: true },
  { name: "Content Calendar", description: "Plan and schedule your content publishing", icon: Calendar, price: "$9", beta: true },
  { name: "Invoices", description: "Create and manage professional client invoices", icon: Receipt, price: "$9", beta: false },
  { name: "Proposals", description: "AI-powered proposal generation that wins bids", icon: Presentation, price: "$9", beta: false },
  { name: "Branding", description: "Custom brand colors and settings across all tools", icon: Palette, price: "$3", beta: false },
]

const tiers = [
  { name: "Starter", count: "1 tool", price: "$9", yearly: "$90" },
  { name: "Growth", count: "2–3 tools", price: "$15", yearly: "$150" },
  { name: "Scale", count: "4–5 tools", price: "$22", yearly: "$220" },
  { name: "All Access", count: "6–8 tools", price: "$29", yearly: "$290", badge: "Best Value" },
]

const benefits = [
  {
    icon: Zap,
    title: "Zero dashboard fatigue",
    description: "No login required for clients. Reports land in their inbox.",
  },
  {
    icon: Sparkles,
    title: "AI-native quality",
    description: "Professional narrative prose, not robot bullet points.",
  },
  {
    icon: TrendingUp,
    title: "Retain more clients",
    description: "Clients who understand your reports stay longer.",
  },
  {
    icon: Shield,
    title: "Privacy-first",
    description: "No tracking, no ads. Your data stays yours.",
  },
]

export default function MarketingPage() {
  return (
    <div>
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-primary/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Kvant
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Sign In
            </Link>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(225,156,99,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,165,190,0.06),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-6 text-center relative">
          <Badge variant="secondary" className="mb-6">
            Beta — 8 tools, one platform — pay for what you use
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Your agency toolkit,{" "}
            <span className="text-accent">your way</span>
            <br />
            Pick only what you need
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            AI-powered reports, brand monitoring, competitive analysis, content
            briefs, calendar, invoices, proposals, and branding. Use one or all.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#tools">See Tools</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* All Tools */}
      <section id="tools" className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,156,99,0.03),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="text-center">
            <h2 className="text-3xl font-bold">All your agency tools in one place</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Pick exactly what you need. Build your own plan.
            </p>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ALL_FEATURES_MARKETING.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.name} className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold">
                    {f.name}
                    {f.beta && <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-xs text-accent">Beta</span>}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  <p className="mt-4 text-sm"><span className="text-lg font-bold">{f.price}</span><span className="text-muted-foreground">/mo</span></p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Simple per-tool pricing</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Beta pricing — locked in forever for early users. Every tool is $9/mo individually.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-4">
            {tiers.map((tier) => (
              <Card key={tier.name} className={tier.badge ? "border-accent/50 relative" : ""}>
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                    {tier.badge}
                  </span>
                )}
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">{tier.count}</p>
                  </div>
                  <div>
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">or {tier.yearly}/yr (2 months free)</p>
                  <Button size="sm" className="w-full" asChild>
                    <Link href={tier.count === "6–8 tools" ? "/register" : "/register"}>
                      Get Started <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento */}
      <section id="features" className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Built for agencies, by builders</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Every feature exists because real agency owners asked for it.
            </p>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <div
                  key={b.title}
                  className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all"
                >
                  <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-all" />
                  <div className="relative">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { icon: Users, value: "85%", label: "Clients retained" },
              { icon: MessageSquare, value: "10x", label: "Report read rate" },
              { icon: Eye, value: "50+", label: "LLMs monitored" },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,156,99,0.06),transparent_60%)]" />
        <div className="mx-auto max-w-3xl px-6 text-center relative">
          <h2 className="text-3xl font-bold">Ready to impress your clients?</h2>
          <p className="mt-4 text-muted-foreground">
            Start free. No credit card required. Cancel anytime.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kvant. All rights reserved.</p>
          <div className="mt-3 flex items-center justify-center gap-6">
            <Link href="/terms" className="hover:text-accent transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
            <Link href="/refund" className="hover:text-accent transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
