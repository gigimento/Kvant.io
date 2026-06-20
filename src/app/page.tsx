"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"

const products = [
  {
    id: "reports",
    name: "Narrative Reports",
    tagline: "AI-powered client reports in plain English",
    description:
      "Connect GA4, Google Ads, or Meta Ads. Get beautifully written monthly reports your clients will actually read. No dashboards. No jargon. Just results.",
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
      "Monitor how ChatGPT, Claude, and other LLMs mention your brand and competitors. Get weekly alerts on sentiment, share of voice, and new mentions.",
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
            Agency<span className="text-accent">Tools</span>
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <Link href="/#products" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Products
            </Link>
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Features
            </Link>
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
      <section className="relative overflow-hidden pt-32 pb-24 bg-grid">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <Badge variant="secondary" className="mb-6">
            Launching June 2026
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Reports your clients{" "}
            <span className="text-accent">actually read</span>
            <br />
            AI visibility you can{" "}
            <span className="text-accent">actually trust</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Two tools, one mission: help agencies communicate better.
            Narrative reports that replace dashboards. Brand monitoring
            across every major LLM.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#products">See Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 pt-32">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold">
            Two products, one platform
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Each solves a specific agency pain point. Use one or both.
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {products.map((product) => {
              const Icon = product.icon
              return (
                <Card key={product.id} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-accent/5 blur-3xl" />
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        <Icon className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle>{product.name}</CardTitle>
                        <CardDescription>{product.tagline}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      {product.description}
                    </p>
                    <ul className="space-y-2">
                      {product.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-2xl font-bold">
                        {product.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /mo
                        </span>
                      </span>
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

      {/* Benefits */}
      <section id="features" className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold">
            Built for agencies, by builders
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Every feature exists because real agency owners asked for it.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = b.icon
              return (
                <Card key={b.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {b.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            Ready to impress your clients?
          </h2>
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
          &copy; {new Date().getFullYear()} Agency Tools. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
