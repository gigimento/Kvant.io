# Kvant — AI-Powered Agency Suite

> Two SaaS products in one platform: **Narrative Reports** + **Brand Radar**, plus a full toolkit for modern marketing agencies.

Kvant is a production-ready Next.js SaaS for marketing agencies that want to deliver AI-generated client reports, monitor brand visibility across LLMs, manage content pipelines, and streamline operations — all under one roof.

## Features

### Narrative Reports
- AI-generated monthly reports with plain-English storytelling (powered by Google Gemini)
- Connect GA4, Google Ads, and Meta Ads for automated data ingestion
- Branded PDF exports with custom colors and logo
- Client-facing share links with public access
- Weekly email delivery via cron

### Brand Radar
- Monitor how AI models (Gemini, ChatGPT, Claude) mention your brand and competitors
- Automated daily scans via Vercel cron
- Sentiment analysis (positive / neutral / negative)
- Competitive share-of-voice dashboard with interactive charts

### Agency Toolkit
- **Content Briefs** — AI-generated SEO briefs with outline, key points, and FAQ ideas
- **Content Calendar** — Drag-and-drop calendar to plan and schedule posts
- **Invoices** — Create, manage, and download invoices as PDF
- **Client Proposals** — AI-powered proposal generator with executive summary and pricing
- **Branding Settings** — Customize colors and logo for client-facing materials

### Business
- 14-day free trial with Paddle subscriptions ($29/mo or $290/yr)
- Secure auth via Supabase (email/password)
- Onboarding flow with profile and feature selection
- Vercel cron for automated report generation and brand scanning
- Subscription gating with trial period

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (SSR) |
| AI | Google Gemini 3.1 Flash Lite (free tier) |
| Payments | Paddle (subscriptions + trials) |
| Hosting | Vercel (Edge + Serverless) |
| Email | Resend (transactional) |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Icons | Lucide React |

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.local.example` for the full list. Required vars:
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `GOOGLE_AI_API_KEY` — Google AI Studio (free tier)
- `PADDLE_API_KEY` — Paddle for payments

## Deployment

Push to GitHub → Vercel auto-deploys. Add all env vars in Vercel Dashboard → Settings → Environment Variables.

```bash
vercel --prod
```

## Database

Supabase migrations live in `supabase/migrations/`. Run them via the Supabase Dashboard SQL editor or Management API.

```
001_schema.sql       → Base tables (profiles, reports, brand_monitors, etc.)
002_soft_delete.sql  → Soft delete for reports
003_onboarding_paddle.sql → Paddle subscriptions + onboarding
004_trial.sql        → 14-day trial period
005_features.sql     → Share links, brand settings
006_public_share_rls.sql → RLS for public shares
007_content_calendar.sql  → Calendar entries
008_invoices.sql     → Invoice table
009_service_config.sql   → Server-side service config
```

## Architecture

```
src/
├── app/
│   ├── page.tsx                # Landing page
│   ├── proxy.ts                # Request interception (Next.js 16)
│   ├── login/ + register/      # Auth pages
│   ├── onboarding/             # 2-step onboarding flow
│   ├── dashboard/              # 12 feature modules
│   └── api/                    # 20+ API routes
├── components/
│   ├── ui/                     # Reusable UI primitives
│   ├── dashboard/              # Sidebar, OnboardingGuard
│   └── calendar/               # Drag-and-drop calendar grid
└── lib/
    ├── supabase/               # Client, server, admin helpers
    ├── llm/                    # Gemini client + prompt builders
    ├── paddle/                 # Paddle API wrapper
    └── email/                  # Resend templates
```

## Status

- ✅ 46 routes, 0 build errors
- ✅ Auth + onboarding + subscription gating
- ✅ Narrative Reports (GA4 / Google Ads / Meta Ads integrations)
- ✅ Brand Radar (daily LLM scans + sentiment)
- ✅ Content Briefs, Calendar, Invoices, Proposals
- ✅ Paddle payments (14-day trial)
- ✅ Vercel cron automation
- ✅ Client share links + branded PDF exports

---

Built for agencies that want AI-powered reporting without the enterprise price tag.
