<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Kvant — Project Memory

## Overview
8 SaaS tools in one Next.js project at `https://kvantio.vercel.app`:
- **Narrative Reports**, **Brand Radar**, **Competitive Dashboard**, **Content Briefs**, **Content Calendar**, **Invoices**, **Proposals**, **Branding**
- Build-your-own-plan pricing: pick any subset of tools, pay per tier (1=$9, 2-3=$15, 4-5=$22, 6-8=$29/mo)
- GitHub: `github.com/gigimento/Kvant.io`

## Tech Stack
- **Next.js 16.2.9** (App Router, Turbopack)
- **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL) — project: `pvjyeycxwqoyzhaancaj`
- **Google Gemini** (`gemini-3.1-flash-lite`) — free 60 req/min for all LLM calls
- **Paddle** — payments (14-day trial, tiered pricing: 4 tiers × 2 billing cycles = 8 prices)
- **Vercel** — hosting at `kvantio.vercel.app` (team: `giga-s-projects4`, project: `kvant`)
- Resend — planned for email delivery

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── proxy.ts                    # Request interception (was middleware.ts)
│   ├── login/page.tsx
│   ├── register/page.tsx           # Redirects to /onboarding
│   ├── onboarding/page.tsx         # Profile + feature selection
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   ├── refund/page.tsx
│   ├── share/[token]/page.tsx      # Client-facing shared reports
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + OnboardingGuard
│   │   ├── page.tsx                # Stats cards
│   │   ├── reports/                # Narrative Reports (list + detail + create)
│   │   ├── seo/                    # Brand Radar (list + detail + new)
│   │   ├── competitive/            # Competitive Dashboard (charts + sentiment)
│   │   ├── content-briefs/         # AI content brief generation
│   │   ├── content-calendar/       # Drag-and-drop calendar
│   │   ├── invoices/               # Invoice CRUD + PDF download
│   │   ├── proposals/              # AI-powered proposal generation
│   │   ├── connections/            # GA4 / Google Ads / Meta Ads
│   │   ├── subscriptions/          # Paddle checkout + billing history
│   │   └── settings/branding/      # Brand color/logo customization
│   └── api/
│       ├── auth/callback/route.ts  # Check onboarding → redirect
│       ├── branding/route.ts
│       ├── reports/generate/route.ts
│       ├── reports/share/route.ts
│       ├── reports/export-pdf/[reportId]/route.ts
│       ├── seo/scan/route.ts
│       ├── dashboard/competitive/route.ts
│       ├── content-briefs/generate/route.ts
│       ├── content-calendar/[id]/route.ts
│       ├── invoices/[id]/pdf/route.ts + [id]/route.ts
│       ├── proposals/generate/route.ts
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
│   ├── ui/                         # button, card, badge, input, skeleton, etc.
│   ├── dashboard/
│   │   ├── sidebar.tsx             # Nav + logout
│   │   ├── subscription-gate.tsx   # Client-side gating (optional feature prop)
│   │   └── onboarding-guard.tsx    # Redirects if onboarding incomplete


│   └── calendar/
│       └── content-calendar.tsx    # Drag-drop calendar grid
├── lib/
│   ├── features.ts                 # 8 tool definitions, tier pricing, price selection
│   ├── subscription-guard.ts       # Server-side guard (active sub OR trial) + per-feature check
│   ├── supabase/                   # client.ts, server.ts, middleware.ts, admin.ts
│   ├── llm/client.ts               # Google Gemini unified client
│   ├── llm/prompts/                # narrative.ts, seo-scan.ts, proposal.ts, content-brief.ts
│   ├── api/                        # ga4.ts, google-ads.ts, meta-ads.ts
│   ├── paddle/client.ts            # Paddle API wrapper
│   └── email/                      # send-report.ts + templates/
supabase/migrations/
├── 001_schema.sql                  # Base: profiles, reports, brand_monitors, etc.
├── 002_soft_delete.sql             # Soft delete columns + RLS fixes
├── 003_onboarding_paddle.sql       # onboarding_completed, paddle_subscription_id, billing_history
├── 004_trial.sql                   # Trial period (14 days)
├── 005_features.sql                # client_share_links, recipients, brand_settings
├── 006_public_share_rls.sql        # RLS for public share links
├── 007_content_calendar.sql        # content_calendar table
├── 008_invoices.sql                # invoices table
└── 010_user_features.sql           # user_features TEXT[] for per-feature gating
```

## Key Constraints
- **Color palette**: `#27262E` bg, `#E19C63` accent, `#8BA5BE` secondary
- **No Stripe** — Paddle for payments (works from Serbia)
- **Google Gemini** free tier for all LLM calls
- **proxy.ts** — migrated from `middleware.ts` (Next.js 16 convention)

## Database (Supabase `pvjyeycxwqoyzhaancaj`)
- `profiles` — user profile, onboarding_completed, trial_ends_at, user_features TEXT[]
- `data_connections` — OAuth tokens for GA4, Google Ads, Meta Ads
- `report_configs` + `reports` — Narrative Reports (soft delete)
- `client_share_links` — public share tokens for reports
- `brand_monitors` + `brand_mentions` — Brand Radar
- `content_calendar` — calendar entries (title, date, status, brief_id, notes)
- `invoices` — invoice number, client, items, subtotal/tax/total, status, due_date
- `subscriptions` + `billing_history` — Paddle subscriptions
- RLS: ALL tables need SELECT + INSERT + UPDATE + DELETE policies

## Env Vars

| Variable | Where | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Supabase Settings → API |
| `SUPABASE_SERVICE_KEY` | `.env.local` + Vercel | Supabase Settings → API (`service_role`) |
| `SUPABASE_MGMT_TOKEN` | `.env.local` + Vercel | Supabase Settings → Access Tokens |
| `GOOGLE_AI_API_KEY` | `.env.local` + Vercel | Google AI Studio |
| `PADDLE_API_KEY` | `.env.local` + Vercel | Paddle Developer Tools → Authentication |
| `PADDLE_WEBHOOK_SECRET` | `.env.local` + Vercel | Paddle Developer Tools → Webhooks |
| `NEXT_PUBLIC_APP_URL` | `.env.local` + Vercel | `https://kvantio.vercel.app` |
| `GOOGLE_CLIENT_ID` | `.env.local` + Vercel | Google Cloud Console (for GA4 OAuth) |
| `GOOGLE_CLIENT_SECRET` | `.env.local` + Vercel | Google Cloud Console |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `.env.local` + Vercel | Google Ads API |
| `META_APP_ID` | `.env.local` + Vercel | Meta Developers |
| `META_APP_SECRET` | `.env.local` + Vercel | Meta Developers |
| `RESEND_API_KEY` | `.env.local` + Vercel | Resend |
| `NEON_API_KEY` | `.env.local` + DB | Neon Console |
| `SENTRY_AUTH_TOKEN` | `.env.local` + DB | Sentry Account → Auth Tokens |

## Session Status (June 27, 2026)
- ✅ Build passes (82 routes, 0 errors)
- ✅ Auth + onboarding flow
- ✅ 17 tools live (6 starter + 6 pro + 5 agency)
- ✅ Per-feature subscription gating (server + client side) — FIXED
- ✅ 3-tier pricing: Starter ($19), Pro ($49), Agency ($99), monthly/yearly
- ✅ Paddle integration: products, checkout, webhook, customer portal, cancel
- ✅ Vercel cron: Mon 6h reports, daily 7h brand scans
- ✅ GA4 / Google Ads OAuth infrastructure (API enabled, redirect URI added)
- ✅ Supabase service key — FIXED (was wrong `sb_secret_...` format)
- ✅ Supabase service_config — FIXED (updated in DB)
- ✅ Vercel env vars — FIXED (SUPABASE_SERVICE_KEY updated)
- ✅ Deploy on Vercel — DONE
- ✅ Soft delete on reports
- ✅ Legal pages (Terms, Privacy, Refund)
- ✅ `proxy.ts` migration (was `middleware.ts`)
- ❌ GA4 OAuth not yet reconnect-tested (user needs to reconnect)
- ❌ Meta Ads — paused until Meta app is configured
- ❌ Neon API unreachable (DNS issue)

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

### Subscription Gating
- `lib/subscription-guard.ts` — server-side check: `checkServerAccess(feature?)` — checks active sub OR trial, plus optional per-feature access via `profiles.user_features`
- `components/dashboard/subscription-gate.tsx` — client wrapper with optional `feature` prop; shows "View Plans" or "Upgrade Plan" card when blocked
- Protected API routes return `402` with `"error": "Subscription required..."`
- Feature-blocked routes return `{allowed: false, reason: "feature_not_available"}`
- Trial period: 14 days from profile creation (`profiles.trial_ends_at DEFAULT now() + interval '14 days'`)

### Paddle Webhook Events
- `transaction.completed` + `transaction.paid` → `handleTransaction()` upserts subscription on `paddle_subscription_id`
- `subscription.updated` → syncs status and billing period
- `subscription.canceled` → sets status to "cancelled"
- `upsert` must specify `onConflict: "paddle_subscription_id"` or it creates duplicate rows on renewal
- `billing_history` dedup: check `maybeSingle()` before insert to avoid duplicates from retries

### Paddle API
- API key: `pdl_live_apikey_...` for server-side calls (`Authorization: Bearer` header)
- Webhook secret: `pdl_ntfset_...` for signature verification (HMAC-SHA256)
- Product creation: `POST /products` → `POST /prices` → `POST /transactions` returns `checkout.url`
- Trial period: set `trial_period: { interval: "day", frequency: 14, requires_payment_method: true }` on price
- Paddle prices for Kvant: `pro_01kvkv9ssf3aqddcj49d7mbh3r`
  - Tier 1 Monthly: `pri_01kvn3dpsztmk4k53qenq9der3` ($9)
  - Tier 1 Yearly: `pri_01kvn3dq038s3hdfckkv1b8dhj` ($90)
  - Tier 2 Monthly: `pri_01kvn3dq5wrn1jv6r1q69xqz6a` ($15)
  - Tier 2 Yearly: `pri_01kvn3dqbsvd8xyv941y2yhr2f` ($150)
  - Tier 3 Monthly: `pri_01kvn3dqhgp6xttjr76nkjk7p9` ($22)
  - Tier 3 Yearly: `pri_01kvn3dqq66t0akr7gvs14bawj` ($220)
  - Tier 4 Monthly: `pri_01kvkva7hbtmngwv59d2hsr1yn` ($29, existing)
  - Tier 4 Yearly: `pri_01kvkva7qmnz1d3fhd4gtznxsr` ($290, existing)

### "Build Your Own Plan" — Pricing Architecture
- All 8 tools defined in `lib/features.ts` with slug, name, icon
- Pricing tiers (by tool count): 1=$9, 2-3=$15, 4-5=$22, 6-8=$29
- Yearly = monthly × 10 (2 months free)
- Tier 4 reuses existing Paddle prices; tiers 1-3 created via Paddle API (`POST /prices`)
- `getPriceForSelection(count, plan)` returns correct `{priceId, price}` from config

### Per-Feature Subscription Gating
- `profiles.user_features TEXT[]` — stores which tools the user paid for
- Migration 010 adds column; existing users backfilled with all 8 features
- `checkServerAccess(feature?)` — optional feature param; if provided, checks `user_features` includes slug
- If `user_features` is null/empty, defaults to allowing (backward compat during rollout)
- Trial users bypass feature check (full access during trial)
- All 11 API routes pass feature slug: `reports`, `seo`, `competitive`, `content-briefs`, `content-calendar`, `invoices`, `proposals`
- `SubscriptionGate({children, feature?})` — client-side gate (optional feature param)
- Feature-blocked state shows "upgrade" card with link to `/dashboard/subscriptions`

### Paddle Checkout Flow (Plan Builder)
- `POST /api/paddle/create-checkout` now accepts `{features: string[], plan}` instead of `{priceId, plan}`
- Route computes the correct tier price ID from feature count
- Selected features passed as `custom_data.features` (comma-separated string)
- Features SAVED immediately on profiles before redirecting to Paddle checkout
- Webhook also saves features from `custom_data.features` on `transaction.completed`
- Subscription page (`/dashboard/subscriptions`) rebuilt as plan builder:
  - 8 tool cards with checkboxes
  - Monthly/yearly toggle
  - Live price calculation
  - Summary card with total + subscribe button

### Migration & Backfill
- Migration `010_user_features.sql` adds `user_features TEXT[]` with default of all 8 slugs
- Backfilled existing users via Supabase Management API: `UPDATE profiles SET user_features = ARRAY[...] WHERE user_features IS NULL`
- Supabase SQL endpoint: `POST /v1/projects/{ref}/database/query`

### Windows/PowerShell
- `curl` in PS is alias for `Invoke-WebRequest` — use `curl.exe` for real curl
- `Invoke-RestMethod` with `-Body (ConvertTo-Json $obj)` for JSON APIs
- Here-strings require content on new line after `@'`
- `Add-Content` appends to files, `Set-Content` writes

## STRICT: Thinking Mode — Stop Overgenerating

**Problem:** AI često na jedan jednostavan prompt odgovara sa 10-sekcijskom analizom, tabelama, ocenama, roadmap-om, akcionim planom — iako niko to nije tražio.

**Pravila koja AI MORA da poštuje:**

### 1. Scope restrikcija
- Odgovori SAMO na ono što je direktno traženo. Ni reč više.
- Ako korisnik pita "analiziraj X" → daj analizu, NE akcioni plan, NE roadmap, NE preporuke, NE ocene sa zvezdicama, NE tabelu "pre/posle".
- Ako korisnik pita "šta fali?" → nabroj samo šta fali. Ne dodaj kako da se popravi, ne predlaži prioritete, ne pravi timeline.

### 2. Zabranjene kategorije (osim ako eksplicitno tražene)
- Akcioni planovi / Roadmap-e / Timeline-ovi
- Tabele sa ocenama (⭐⭐⭐)
- "Preporuke" van direktnog pitanja
- "Šta je odlično" sekcije kad je pitanje o problemima
- Tabele "Pre vs Posle"
- Bilo kakav format koji nije odgovor na postavljeno pitanje

### 3. Ako nisi siguran šta treba da uradiš — pitaj
- "Hoćeš samo analizu ili i preporuke?"
- "Da li da napišem i akcioni plan?"
- Ne pretpostavljaj. Pitaj.

### 4. Pravilo jednog pasusa
- Ako nisi siguran koliko je detaljno potrebno, ograniži se na 1-3 pasusa.
- Korisnik će tražiti više ako mu treba.

### 5. Nijedna analiza ne sme sadržati
- "Zaključak" sekciju osim ako je eksplicitno tražena
- Numeričke ocene (8/10, ⭐⭐⭐⭐)
- Listu "sledećih koraka" osim ako je tražena
- Bilo kakav action item koji korisnik nije tražio
- **Wiki paths fixed**: SMT wikis must use `_SMT` prefix — `C:\Users\Igor\Desktop\_SMT\SMT Command Centar\wikis\smt-engineering` (NOT `C:\Users\Igor\Desktop\SMT Command Centar\...`)
- **Broken sql-server removed**: old `C:\mcp-sql\server.py` didn't exist. Replaced with working `sql` MCP (Python, `asyncpg`, read-only SELECT queries via DATABASE_URL env var) and `neondb` MCP (Neon API management via httpx)
- **Sentry MCP**: `@sentry/mcp-server` npm package, needs `SENTRY_AUTH_TOKEN` env var
- **Neon MCP**: custom Python server at `C:\mcp-sql\neon_server.py`, uses `NEON_API_KEY` env var, provides `list_projects`, `get_project`, `list_branches` tools
- **Env vars in Claude config**: API keys embedded in `env` blocks per MCP server (Neon, Sentry, Obsidian)
- Docker Desktop and GDrive skipped (Docker not installed, GDrive via Claude built-in)

## Workflow Preference (2026-06-22)
- **Design-first approach**: For complex features, present a design in sections → user reviews and approves each section → write design doc → implement. This reduces rework and gives the user control over the architecture before code is written. User explicitly confirmed this as preferred workflow.

## Session Learnings (2026-06-27)

### Subscription guard fix
- `checkServerAccess()` was stubbed to always return `{ allowed: true }`
- Now checks: auth → trial_ends_at → subscriptions.plan/status → feature tier inheritance
- Tier hierarchy: starter → pro (starter+pro) → agency (all)
- `SubscriptionGate` client component now functional with "Upgrade to Access" CTA
- Build passes with real guard (82 routes)

### Supabase service key fix
- `.env.local` had `sb_secret_W68Ov36jdJMzokIJY42r8Q_rS_i_XwP` — returns 401
- Correct key from Management API: `eyJhbG...5nKbX370WSX53pJ0okWpckKrXqe4JXnSQXJfBk4pvM8`
- Updated in: .env.local, service_config table, Vercel env
- Service config also had different MGMT_TOKEN (sbp_5a30...) — kept as-is since it works

### GA4 connection cleanup
- Deleted stale data_connections (GA4, Google Ads) — expired tokens, empty account IDs
- User enabled Analytics API and added redirect URI in Google Cloud Console
- Need to reconnect via /dashboard/connections after deploy

## Session Learnings (2026-06-24)

### 6 agency-agent features built & deployed
- **AI Citation Audit** (#1): scans brand across ChatGPT/Claude/Gemini/Perplexity, 20 prompts × 4 platforms, fix pack generation
- **SEO Scan Enhancement** (#2): multi-provider LLM, tech SEO audit via regex HTML parsing, keyword research, on-page analysis
- **Content Brief Enhancement** (#3): DB-backed briefs with SERP analysis, content gap, keyword data + history UI
- **AEO Foundations** (#4): AI crawler audit, robots.txt/llms.txt fetch, llms.txt generation with copy
- **Agentic Readiness** (#5): WebMCP check, task completion scoring, friction points + hostile patterns detection
- **Growth/Referrals** (#6): referral codes, click tracking with IP/UA, stats dashboard + share buttons
- **Multi-provider LLM system**: `src/lib/llm/providers.ts` dispatches to OpenAI/Anthropic/Gemini/Perplexity; `client.ts` re-exports `callProvider`/`LLMProvider`
- **All 6 features gated** behind `SubscriptionGate` with feature slugs from `features.ts`

### Merge conflict pattern
- Remote was force-pushed (squashed history), local had diverged
- Fix: `git fetch origin`, `git reset --hard origin/master`, `git cherry-pick <commit>`, resolve conflicts, `npm run build`
- For rewritten files (complete rewrites): `git checkout --theirs <path>`
- For shared config (sidebar, features.ts): manually merge both versions

### Repo structure changes
- Remote added Sentry (`@sentry/nextjs`), calendar overhaul, GA4 persistence, Paddle portal/cancel, robots.txt/sitemap
- Route count grew from 43 → 67 after merge
- `outreach` and `brand-voice` features removed in remote's force-push (no longer in sidebar or features.ts)

### API Keys in Knowledge Graph
- All 4 API tokens stored in memory/knowledge graph (MCP memory server):
  - `neon-api-key`: Neon API management (`napi_...`)
  - `sentry-auth-token`: Sentry error tracking (`sntryu_...`)
  - `supabase-mgmt-token`: Supabase Management API (`sbp_...`)
  - `vercel-api-token`: Vercel project management (`vcp_...`)
