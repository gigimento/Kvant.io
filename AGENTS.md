<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agency Tools Suite — Project Memory

## Overview
Two SaaS products in one Next.js project:
- **Narrative Reports** — AI-generated client reports from GA4/Meta/Google Ads data
- **Brand Radar (LLM SEO)** — Monitor brand mentions across AI chatbots (ChatGPT, Claude, etc.)

## Tech Stack
- Next.js 16.2.9 (App Router)
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL)
- OpenRouter API (Claude for narratives, Groq for SEO scans)
- Lemon Squeezy (payments — works from Serbia, no Stripe)
- Resend (email)
- Vercel (hosting)

## Project Structure
```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── login/page.tsx        # Auth
│   ├── register/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx        # Dashboard with sidebar
│   │   ├── page.tsx          # Dashboard home
│   │   ├── reports/          # Narrative Reporting product
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── seo/              # Brand Radar product
│   │       ├── page.tsx
│   │       ├── new/page.tsx
│   │       └── [id]/page.tsx
│   └── api/
│       ├── auth/callback/route.ts
│       ├── reports/generate/route.ts
│       └── seo/scan/route.ts
├── components/
│   ├── ui/                   # shadcn-style (button, card, badge, input, etc.)
│   └── dashboard/sidebar.tsx
└── lib/
    ├── supabase/             # client.ts, server.ts, middleware.ts
    ├── llm/
    │   ├── client.ts         # OpenRouter unified client
    │   └── prompts/          # narrative.ts, seo-scan.ts
    └── utils.ts
supabase/migrations/001_schema.sql
```

## Routing
- Route groups are NOT used (to avoid parallel page conflicts)
- Dashboard is at `/dashboard/...` (not in a route group)
- Landing page is at `/` (root)

## Key Constraints
- Build only with AGENTS.md global color palette: `#27262E` bg, `#E19C63` accent, `#8BA5BE` secondary
- No Stripe — use Lemon Squeezy for payments
- OpenRouter API key is in `.env.local` — uses Claude for reports, Groq for SEO scans (free)
- Middleware renamed to "proxy" in Next.js 16 — currently using middleware.ts (deprecated but works)

## Session Status (June 20, 2026)
- ✅ Build passes (14 routes, 0 errors)
- ✅ All UI components created
- ✅ Database schema migration ready
- ✅ API routes for report generation + brand scanning
- ❌ Need Supabase project setup + .env values
- ❌ Need Lemon Squeezy account
- ❌ Need Resend API key
- ❌ Need to deploy on Vercel

## Exit Strategy
Target Acquire.com at $3-5k MRR (6-9 months). Bundle sale potential: Semrush, Ahrefs, AgencyAnalytics.
