# Agency Tools Suite — Implementation Plan

> **Products:** Narrative-Style Agency Reporting (#2) + LLM SEO Radar (#3)
> **Created:** June 20, 2026
> **Stack:** Next.js 15 + Supabase + OpenRouter (Claude/Groq) + Lemon Squeezy + Vercel
> **Budget:** $0 (all free tiers)
> **Location:** Serbia (Stripe not required — Lemon Squeezy for payments)

---

## Architecture Overview

Single Next.js 15 App Router project with two products under one roof:
- `/reports` → Narrative Reporting
- `/seo` → LLM SEO Radar
- `/` → Landing + pricing

### Stack Choices

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router | Server components, API routes, Vercel deploy |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI, accessible, dark/light |
| Database | Supabase (PostgreSQL) | Free 500MB, auth built-in |
| Auth | Supabase Auth | Free, social login ready |
| Payments | Lemon Squeezy | Works from Serbia (no Stripe needed) |
| LLM | OpenRouter | One API key for Claude (reports) + Groq (SEO) |
| Email | Resend | Free 3k emails/month |
| PDF | react-pdf / @react-pdf/renderer | Generate PDFs from React |
| Hosting | Vercel | Free tier, auto-deploy from git |

---

## Database Schema

See `supabase/migrations/001_schema.sql` for full schema.

Key tables:
- `profiles` — user profile data
- `data_connections` — OAuth connections (GA4, Google Ads, Meta)
- `report_configs` — report configuration per client
- `reports` — generated reports (raw_data, narrative_text, pdf_url)
- `brand_monitors` — brand + competitors + keywords to track
- `brand_mentions` — each LLM scan result
- `subscriptions` — Lemon Squeezy subscription data

---

## Build Phases

### Phase 1 (Week 1-2): Narrative Reporting MVP
1. Init project + Tailwind + shadcn/ui
2. Supabase Auth + profiles
3. Dashboard layout (sidebar, header)
4. GA4 OAuth + data fetch
5. LLM narrative generation (OpenRouter → Claude)
6. PDF generation
7. Report config + manual generate
8. Landing page + Lemon Squeezy pricing
9. Email delivery

### Phase 2 (Week 3-4): LLM SEO Radar MVP
1. Brand monitor create
2. Groq batch queries (via OpenRouter)
3. Brand mention parsing + sentiment
4. Monitor dashboard (trends, share of voice)
5. Scheduled scans (Vercel cron)
6. Weekly report email
7. Landing page + pricing

### Phase 3 (Week 5-8): Launch + Polish
1. Landing pages (both products)
2. SEO + analytics
3. Product Hunt prep
4. Reddit/LinkedIn outreach
5. Beta program + case studies
6. Acquire.com listing prep

---

## Pricing

| Product | Starter | Pro |
|---|---|---|
| Narrative Reporting | $49/mo (5 clients) | $149/mo (unlimited) |
| LLM SEO Radar | $99/mo (3 monitors) | $299/mo (15 monitors) |
| Bundle | $129/mo | $399/mo |

---

## Exit Strategy

Target: Sell on Acquire.com at $3-5k MRR
- $3k MRR × 4-7x = $120k-240k
- Timeline: 6-9 months
- Potential buyers: Semrush, Ahrefs, AgencyAnalytics, DashThis
