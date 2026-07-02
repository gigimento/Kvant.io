"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  TrendingUp,
  ArrowRight,
  Zap,
  FileText,
  Eye,
  ChevronDown,
} from "lucide-react"

const tools = [
  {
    name: "Brand Radar",
    description: "Monitor how AI models talk about your clients' brands",
    icon: Search,
  },
  {
    name: "GEO Briefs",
    description: "Actionable plans to improve AI visibility",
    icon: TrendingUp,
  },
  {
    name: "PDF Audit",
    description: "Generate client-ready AI visibility audit reports",
    icon: FileText,
  },
]

const tiers = [
  {
    name: "Starter",
    price: "$29",
    yearly: "$290",
    badge: "",
    features: ["5 clients", "Weekly scans", "PDF audit"],
  },
  {
    name: "Pro",
    price: "$79",
    yearly: "$790",
    badge: "Most Popular",
    features: ["20 clients", "Daily scans", "GEO briefs", "White-label"],
  },
  {
    name: "Agency",
    price: "$149",
    yearly: "$1490",
    badge: "",
    features: ["Unlimited clients", "API access", "Priority support"],
  },
]

const stats = [
  { value: "62%", label: "of brands are invisible in AI search" },
  { value: "4.4x", label: "higher converting than organic search" },
  { value: "$850M+", label: "GEO market by 2027" },
]

const faq = [
  {
    q: "Which AI models do you support?",
    a: "ChatGPT, Gemini, Claude, Perplexity, and 5+ more.",
  },
  {
    q: "How is this different from SEO monitoring?",
    a: "SEO tracks Google rankings. We track AI recommendations. Different channel, different rules.",
  },
  {
    q: "Can I white-label the reports?",
    a: "Yes, Pro and Agency plans include full white-labeling.",
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
            AI Visibility Monitoring for Agencies
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Does AI recommend{" "}
            <span className="text-accent">your clients?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Kvant shows you exactly what ChatGPT, Gemini, and Claude say about
            every brand you manage. See the gaps. Fix them. Keep your clients.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Scan Your First Client Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            Your clients are asking AI about their industry right now.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            If AI doesn&apos;t mention them — they&apos;re invisible. And you have no way
            to check.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">How It Works</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Enter client domain + competitors" },
              { step: "2", title: "Kvant scans 5 AI models in 60 seconds" },
              { step: "3", title: "Get a PDF audit you can share with your client" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent text-xl font-bold">
                  {s.step}
                </div>
                <p className="font-medium">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="relative py-24 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,156,99,0.03),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="text-center">
            <h2 className="text-3xl font-bold">3 Tools, Zero Bloat</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Everything you need to prove AI visibility ROI to your clients.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {tools.map((t) => {
              const Icon = t.icon
              return (
                <div key={t.name} className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Start free. Scale as you land more clients.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {tiers.map((tier) => (
              <Card key={tier.name} className={tier.badge ? "border-accent/50 relative" : ""}>
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white whitespace-nowrap">
                    {tier.badge}
                  </span>
                )}
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                  </div>
                  <div>
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">or {tier.yearly}/yr (2 months free)</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" className="w-full" asChild>
                    <Link href="/register">
                      Get Started <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-accent">{s.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="mt-12 space-y-6">
            {faq.map((f) => (
              <div key={f.q} className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,156,99,0.06),transparent_60%)]" />
        <div className="mx-auto max-w-3xl px-6 text-center relative">
          <h2 className="text-3xl font-bold">Ready to see how AI sees your clients?</h2>
          <p className="mt-4 text-muted-foreground">
            Start free. No credit card required. Cancel anytime.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Scan Your First Client Free <ArrowRight className="ml-1 h-4 w-4" />
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
