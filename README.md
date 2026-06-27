# Kvant — AI-Powered Agency Toolkit

17 AI-native tools for marketing agencies: narrative client reports, brand monitoring across LLMs, competitive analysis, content calendar, invoices, proposals, and more.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL)
- **Google Gemini** (all LLM calls, 60 req/min free tier)
- **Paddle** (payments, 14-day trial)
- **Vercel** (hosting)
- **Resend** (transactional email)

## Getting Started

```bash
# Install
npm ci

# Copy env vars
cp .env.example .env.local
# Fill in: Supabase URL/keys, Paddle API key, Google Gemini key, Resend API key

# Dev
npm run dev

# Build
npm run build

# Tests
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
npm run test:api      # API route integration tests
```

## Project Structure

```
src/
  app/
    page.tsx                   # Landing page
    layout.tsx                 # Root layout (metadata, JSON-LD)
    login, register, onboarding, terms, privacy, refund
    dashboard/
      layout.tsx               # Sidebar + auth guard
      page.tsx                 # Stats overview
      reports/, seo/, competitive/, content-briefs/,
      content-calendar/, invoices/, proposals/,
      subscriptions/, settings/, connections/,
      analytics/, keyword-rankings/, backlinks/,
      citation-audit/, aeo/, agentic/,
      client-portal/, referrals/, scheduled-reports/
    api/
      paddle/                  # Paddle checkout, webhook, portal, cancel
      connections/             # GA4, Google Ads, Meta Ads OAuth
      cron/                    # Scheduled reports + brand scans
      reports/, seo/, competitive/, content-briefs/,
      content-calendar/, invoices/, proposals/,
      branding/, email/
  components/
    ui/                        # Button, Card, Badge, etc.
    dashboard/                 # Sidebar, SubscriptionGate, OnboardingGuard
    calendar/                  # ContentCalendar, KanbanView, EntryForm
  lib/
    features.ts                # Tool definitions, tier pricing
    subscription-guard.ts      # Server-side gating
    supabase/                  # Client, server, admin, middleware
    paddle/                    # Paddle API client
    llm/                       # Gemini client + prompts
    email/                     # Resend templates
```

## Pricing Model

3 tiers — Starter ($19/mo, 6 tools), Pro ($49/mo, 12 tools), Agency ($99/mo, 17 tools).
Yearly billing: 2 months free (monthly × 10). 14-day free trial included.

## Key Features

- **Narrative Reports** — AI-generated client reports from analytics data
- **Brand Radar** — Monitor brand mentions across ChatGPT, Claude, Gemini, Perplexity
- **Competitive Dashboard** — LLM share-of-voice tracking
- **Content Briefs** — SEO-optimized briefs with SERP analysis
- **Content Calendar** — Drag-and-drop calendar + Kanban view
- **Invoices** — PDF generation, client management
- **Proposals** — AI-powered proposal generation
- **Analytics Hub** — GA4 + Google Ads + Meta Ads unified view
- **SEO Audit** — Technical SEO, keyword research, on-page analysis
- **AI Citation Audit** — 80-prompt brand visibility scan
- **AEO Foundations** — AI crawler optimization (llms.txt, robots.txt)
- **Agentic Readiness** — WebMCP agent task completion scoring
- **Client Portal** — White-label share dashboard
- **Referrals** — Share-to-earn with click tracking
- **Scheduled Reports** — Automated email delivery via cron

## Tests

```bash
npm test                 # 37 unit tests (Vitest)
npm run test:api         # API route integration tests
npm run test:e2e         # 37 E2E tests (Playwright)
npx playwright show-report  # View E2E report
```

## CI/CD

GitHub Actions on push/PR: lint → build → unit tests → E2E tests.

## Environment

See `.env.example` for all required variables. Key ones:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_AI_API_KEY`
- `PADDLE_API_KEY` + `PADDLE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (GA4 OAuth)
- `META_APP_ID` + `META_APP_SECRET` (Meta Ads OAuth)
