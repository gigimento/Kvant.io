<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Kvant — Project Memory

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
- ✅ Database schema migration run on Supabase
- ✅ API routes for report generation + brand scanning
- ✅ Supabase project setup with URL + anon key
- ✅ Deployed on Vercel (github.com/gigimento/agencytools)
- ✅ Auth working (register/login with Supabase)
- ✅ Narrative Reports — generating with LLM
- ❌ Brand Radar scan — needs OpenRouter model fix (deploying)
- ❌ Need Lemon Squeezy account
- ❌ Need Resend API key

## Session Learnings (2026-06-20)

### LLM Stack
- **Google Gemini** (60 req/min free) — both report generation and SEO scans
- `fast` model: `gemini-3.1-flash-lite` (SEO scans)
- `quality` model: `gemini-3.1-flash-lite` (report narratives)
- API key: `GOOGLE_AI_API_KEY` in env
- **No longer using OpenRouter** — was rate-limited and paid-only

## Hard Rule: Full Code Audit on Provider/Architecture Changes

When switching providers, libraries, or making any cross-cutting change:

1. **Search entire codebase** for the old name — `grep` all `*.{ts,tsx,js,md,sql,env}` files
2. **Check every file** that references the old provider — not just the core library
3. **Update AGENTS.md** — old references become stale immediately
4. **Verify build** — `npm run build` must pass
5. **Stale env vars in Vercel** — remove old ones AND add new ones; redeploy
6. **Review ALL API routes** that call the changed function — verify model params are updated (e.g. `"claude"` → `"quality"`, `"groq"` → `"fast"`)
7. **Check DB schema** — stored provider names in tables must match reality (e.g. `llm_provider: "groq"` → `"gemini"`)

Skipping any of these steps silently creates production bugs.

## Hard Rule: RLS Policies Must Match All CRUD Operations

When adding ANY feature that writes to Supabase (INSERT, UPDATE, DELETE, soft delete):

1. **Check RLS policies FIRST** — `SELECT * FROM pg_policies WHERE tablename = 'table_name'`
2. **Every operation type needs a policy** — just because SELECT works doesn't mean UPDATE/DELETE do
3. **Missing UPDATE policy** silently swallows `.update()` calls — no error, nothing happens
4. **Always create policies for ALL 4 operations** (SELECT, INSERT, UPDATE, DELETE) on every new table
5. **Use `auth.uid()` pattern consistently** — or subquery via related table for indirect ownership
6. **Migration from scratch** vs **manual SQL fix** — manually applied SQL must be synced back to migration files

### Vercel Deployment
- After adding env vars in Vercel dashboard, you MUST **Redeploy** (Deployments → Redeploy) for them to take effect
- Vercel free tier has **10s function timeout** — sequential LLM calls can exceed this
- Force push (`git push --force`) triggers a new deployment

### Git on Windows
- `git config user.email` must match GitHub account email or Vercel blocks deployment
- Force push after amending commits works but resets deployment history
- Default git email `igor@akytec.com` was found nowhere in source files, only in commit history

### Supabase
- **Email auth provider** is disabled by default — must be enabled in Authentication → Providers
- Site URL and Redirect URLs must be configured for auth to work
- Anon key from Supabase Settings → API is a JWT, not `sb_publishable_` format
- SQL migration runs reliably via Supabase SQL Editor

### Landing Page Design
- Global palette: `#27262E` bg, `#E19C63` accent, `#8BA5BE` secondary
- CSS gradients + radial gradients work well for visual interest without images
- Bento grid for features section is cleaner than plain cards
- Stats section adds credibility (85% retained, 10x read rate, 50+ LLMs)
- Remove anchor nav links that point to same-page sections (redundant)

## Exit Strategy
Target Acquire.com at $3-5k MRR (6-9 months). Bundle sale potential: Semrush, Ahrefs, AgencyAnalytics.
