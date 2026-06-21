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
  Bell,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  Eye,
  MessageSquare,
  LineChart,
} from "lucide-react"

const products = [
  {
    id: "reports",
    name: "Narrative Reports",
    tagline: "AI-powered client reports in plain English",
    description:
      "Connect GA4, Google Ads, or Meta Ads. Get beautifully written monthly reports your clients will actually read.",
    icon: FileText,
    href: "/register?product=reports",
    features: [
      "One-click data import from GA4, Google Ads, Meta",
      "Professional narrative generation (Claude AI)",
      "PDF reports delivered to your inbox",
      "White-label ready",
    ],
    price: "$49",
  },
  {
    id: "seo",
    name: "Brand Radar",
    tagline: "See what AI says about your brand",
    description:
      "Monitor how ChatGPT, Claude, and other LLMs mention your brand and competitors.",
    icon: Search,
    href: "/register?product=seo",
    features: [
      "100+ LLM queries per monitor",
      "Sentiment analysis per mention",
      "Share of voice vs competitors",
      "Weekly email digests",
    ],
    price: "$99",
  },
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
            Two tools, one platform
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Reports your clients{" "}
            <span className="text-accent">actually read</span>
            <br />
            AI visibility you can{" "}
            <span className="text-accent">actually trust</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Narrative reports that replace dashboards. Brand monitoring across
            every major LLM. Built for agencies that want to communicate better.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#products">See Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,156,99,0.03),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Two products, one platform</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Each solves a specific agency need. Use one or both.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {products.map((product) => {
              const Icon = product.icon
              return (
                <Card key={product.id} className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-accent/5 blur-3xl group-hover:bg-accent/10 transition-all" />
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.tagline}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                    <ul className="space-y-3">
                      {product.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div>
                        <span className="text-2xl font-bold">{product.price}</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={product.href}>
                          Learn More <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
