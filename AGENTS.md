<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Kvant — Project Memory

## Overview
Two SaaS products in one Next.js project at `https://kvantio.vercel.app`:
- **Narrative Reports** — AI-generated client reports with narrative storytelling
- **Brand Radar** — LLM brand visibility monitoring and share-of-voice tracking
- GitHub: `github.com/gigimento/Kvant.io`

## Tech Stack
- **Next.js 16.2.9** (App Router, Turbopack)
- **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL) — project: `pvjyeycxwqoyzhaancaj`
- **Google Gemini** (`gemini-3.1-flash-lite`) — free 60 req/min for all LLM calls
- **Paddle** — payments (14-day trial, $29/mo or $290/yr)
- **Vercel** — hosting at `kvantio.vercel.app` (team: `giga-s-projects4`, project: `kvant`)
- Resend — planned for email delivery

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── login/page.tsx
│   ├── register/page.tsx           # Redirects to /onboarding
│   ├── onboarding/page.tsx         # Profile + feature selection
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   ├── refund/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + OnboardingGuard
│   │   ├── page.tsx                # Stats cards
│   │   ├── reports/                # Narrative Reports
│   │   ├── seo/                    # Brand Radar
│   │   ├── connections/            # GA4 / Google Ads / Meta Ads
│   │   └── subscriptions/          # Paddle checkout + billing history
│   └── api/
│       ├── auth/callback/route.ts  # Check onboarding → redirect
│       ├── reports/generate/route.ts
│       ├── seo/scan/route.ts
│       ├── cron/
│       │   ├── generate-reports/   # Vercel cron Mon 6h
│       │   └── scan-brands/        # Vercel cron daily 7h
│       ├── connections/
│       │   ├── ga4/ + callback/
│       │   ├── google-ads/ + callback/
│       │   └── meta-ads/ + callback/
│       └── paddle/
│           ├── create-checkout/    # Creates Paddle transaction
│           └── webhook/            # Handles subscription events
├── components/
│   ├── ui/                         # button, card, badge, input, skeleton
│   ├── dashboard/
│   │   ├── sidebar.tsx             # Nav + logout
│   │   └── onboarding-guard.tsx    # Redirects if onboarding incomplete
├── lib/
│   ├── supabase/                   # client.ts, server.ts, middleware.ts
│   ├── llm/client.ts               # Google Gemini unified client
│   ├── llm/prompts/                # narrative.ts, seo-scan.ts
│   ├── api/                        # ga4.ts, google-ads.ts, meta-ads.ts
│   └── paddle/client.ts            # Paddle API wrapper
supabase/migrations/
├── 001_schema.sql                  # Base: profiles, reports, brand_monitors, etc.
├── 002_soft_delete.sql             # Soft delete columns + RLS fixes
└── 003_onboarding_paddle.sql       # onboarding_completed, paddle_subscription_id, billing_history
```

## Key Constraints
- **Color palette**: `#27262E` bg, `#E19C63` accent, `#8BA5BE` secondary
- **No Stripe** — Paddle for payments (works from Serbia)
- **Google Gemini** free tier for all LLM calls
- Middleware renamed to "proxy" in Next.js 16 — `middleware.ts` deprecated but still works

## Database (Supabase `pvjyeycxwqoyzhaancaj`)
- `profiles` — user profile, onboarding_completed flag
- `data_connections` — OAuth tokens for GA4, Google Ads, Meta Ads
- `report_configs` + `reports` — Narrative Reports (soft delete)
- `brand_monitors` + `brand_mentions` — Brand Radar
- `subscriptions` + `billing_history` — Paddle subscriptions
- RLS: ALL tables need SELECT + INSERT + UPDATE + DELETE policies

## Env Vars

| Variable | Where | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel (production) | Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Supabase Settings → API |
| `GOOGLE_AI_API_KEY` | `.env.local` + Vercel (production) | Google AI Studio |
| `PADDLE_API_KEY` | `.env.local` + Vercel (production) | Paddle Developer Tools → Authentication |
| `NEXT_PUBLIC_APP_URL` | `.env.local` + Vercel | `https://kvantio.vercel.app` |
| `GOOGLE_CLIENT_ID` | Not set yet | Google Cloud Console (for GA4 OAuth) |
| `GOOGLE_CLIENT_SECRET` | Not set yet | Google Cloud Console |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Not set yet | Google Ads API |
| `META_APP_ID` | Not set yet | Meta Developers |
| `META_APP_SECRET` | Not set yet | Meta Developers |
| `PADDLE_WEBHOOK_SECRET` | Not set yet | Paddle Developer Tools → Webhooks |
| `RESEND_API_KEY` | Not set yet | Resend |

## Session Status (June 21, 2026)
- ✅ Build passes (30 routes, 0 errors)
- ✅ Auth + onboarding flow
- ✅ Narrative Reports + Brand Radar working
- ✅ Paddle integration: products created, checkout API, webhook handler
- ✅ Vercel cron: Mon 6h reports, daily 7h brand scans
- ✅ GA4 / Google Ads / Meta Ads OAuth infrastructure
- ✅ Soft delete on reports
- ✅ Legal pages (Terms, Privacy, Refund)
- ❌ Paddle webhook secret not yet configured (needs setup in Paddle dashboard)
- ❌ GA4/Ads integrations need Google Cloud + Meta App setup
- ❌ Resend API key not configured
- ❌ Customer portal URL not set up in Paddle

## Hard Rule: Full Code Audit on Provider/Architecture Changes

When switching providers, libraries, or making any cross-cutting change:

1. **Search entire codebase** for the old name — `grep` all `*.{ts,tsx,js,md,sql,env}` files
2. **Check every file** that references the old provider
3. **Update AGENTS.md** — old references become stale immediately
4. **Verify build** — `npm run build` must pass
5. **Stale env vars in Vercel** — remove old ones AND add new ones; redeploy
6. **Review ALL API routes** that call the changed function
7. **Check DB schema** — stored provider names in tables must match reality

## Hard Rule: RLS Policies Must Match All CRUD Operations

1. **Check RLS policies FIRST** — `SELECT * FROM pg_policies WHERE tablename = 'table_name'`
2. **Every operation type needs a policy** — SELECT + INSERT + UPDATE + DELETE
3. **Missing UPDATE/DELETE policy** silently swallows calls — no error, nothing happens
4. **Use `auth.uid()` pattern** or subquery via related table for indirect ownership
5. **Manually applied SQL must be synced back to migration files**

## Session Learnings (2026-06-21)

### Paddle Integration
- API key format: `pdl_live_apikey_01..._secret` — use `Authorization: Bearer` header
- API base: `https://api.paddle.com`
- Products created via `POST /products`, prices via `POST /prices`
- Checkout via `POST /transactions` returns `data.urls.checkout`
- Webhooks: Paddle sends `paddle-signature` header (HMAC-SHA256, format: `ts=...;sig=...`)
- Trial period: `trial_period` on price, requires `requires_payment_method: true`
- PowerShell JSON: `Invoke-RestMethod` with `ConvertTo-Json` works better than `curl.exe`
- Supabase `admin.listUsers()` needed to find users by email in webhooks

### Onboarding Flow
- After registration → redirect to `/onboarding` (not `/dashboard`)
- Auth callback route checks `profiles.onboarding_completed`
- Dashboard layout has `OnboardingGuard` client component that redirects if incomplete
- Two steps: profile (name, company, role) → feature selection → /dashboard

### Vercel Cron
- `vercel.json` `crons` array — schedule in cron syntax
- Cron auth via `x-vercel-cron` header (auto-added by Vercel)
- `x-vercel-cron !== "1"` means unauthorized
- Max 2 cron jobs on free tier
- Report generation cron: Mon 6h, Brand scan cron: daily 7h

### Supabase Management API
- Token format: `sbp_...` personal access token
- Endpoint: `POST /v1/projects/{ref}/database/query`
- Body: `{ "query": "SQL here" }`
- Must use `Invoke-RestMethod` in PowerShell for reliable JSON handling
- Supabase CLI `db execute` doesn't exist; use `db query` instead

### Vercel API for Env Vars
- Endpoint: `POST /v1/projects/{projectId}/env?teamId={teamId}`
- Body: `{ "key": "VAR_NAME", "type": "encrypted", "value": "...", "target": ["production"] }`
- Add `key` property (required) — missing it causes "bad_request"
- PowerShell: use `Invoke-RestMethod` with `ConvertTo-Json`

### Windows/PowerShell
- `curl` in PS is alias for `Invoke-WebRequest` — use `curl.exe` for real curl
- `Invoke-RestMethod` with `-Body (ConvertTo-Json $obj)` for JSON APIs
- Here-strings require content on new line after `@'`
- `Add-Content` appends to files, `Set-Content` writes
