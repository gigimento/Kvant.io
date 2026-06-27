# Kvant (Agency Tools) — Analiza Projekta

> **Lokacija:** `C:\Users\Igor\Documents\i4ss\agency-tools`
> **Deploy:** `https://kvantio.vercel.app`
> **GitHub:** `github.com/gigimento/Kvant.io`

---

## Šta je Kvant?

Kvant je **sve-u-jednom AI SaaS platforma** za marketing agencije, frilensere i biznise. Zamenjuje 17+ alata jednom platformom sa "Build Your Own Plan" modelom plaćanja.

---

## Trenutni Status Projekta

### ✅ Završeno i deploy-ovano
- Build prolazi (67+ ruta, 0 grešaka)
- Auth + onboarding flow
- Paddle integracija sa tiered pricingom
- Vercel cron za automatske skenove
- Soft delete na reportovima
- Legal pages (Terms, Privacy, Refund)
- `proxy.ts` migracija (umesto `middleware.ts`)
- Multi-provider LLM sistem (OpenAI, Anthropic, Gemini, Perplexity)
- Sentry integracija za error tracking
- Sitemap + robots.ts

### ❌ Još nije konfigurisano
- Paddle webhook secret
- GA4/Google Ads/Meta Ads puna integracija (OAuth postavljen, API ključevi nedostaju)
- Resend API ključ
- Customer portal u Paddle-u

---

## Šta Sve Kvant Može — 17 Feature-a

### Starter Tier (besplatno u trial-u)

| Feature | Opis |
|---------|------|
| **1. Narrative Reports** | AI generiše klijentske izveštaje u narativnom stilu. Povlači podatke iz GA4, Google Ads, Meta Ads. PDF export, shareable linkovi, period-over-period comparison, scheduled auto-generation. |
| **2. Brand Radar** | Prati kako AI modeli (ChatGPT, Claude, Gemini) pominju brend i konkurente. Sentiment analiza, Share-of-Voice, scheduled scanning putem cron-a. |
| **3. Competitive Dashboard** | Agregira Brand Radar podatke — total mentions, sentiment score, share of voice bar chart, brand vs competitors line chart. |
| **4. Analytics Hub** | Unified dashboard za GA4, Meta Ads i Google Ads metrike na jednom mestu. |
| **5. Content Briefs** | AI generiše SEO-optimizovane content briefove sa outline-om, key points, FAQ idejama. SERP analiza, content gap detection, scheduler za Calendar. |
| **6. Content Calendar** | Dva pregleda: mesečni grid i Kanban board. Drag & drop, platform color coding, comments, AI post generation iz brief-a, bulk scheduling. |

### Pro Tier

| Feature | Opis |
|---------|------|
| **7. Rank Tracker** | Prati pozicije ključnih reči u Google SERP-u kroz vreme. |
| **8. Invoices** | Kreiraj i šalji fakture. Auto numbering, live total, statusi (draft/sent/paid/cancelled), PDF download, revenue sparkline, branding support. |
| **9. Proposals** | AI generiše profesionalne proposals sa Executive Summary, Approach, Deliverables, Timeline, Investment, Next Steps. |
| **10. Branding** | Prilagođavanje boja i logoa za klijentske materijale (PDF, shared reportovi). |
| **11. Scheduled Reports** | Automatska email dostava izveštaja po rasporedu (nedeljno/mesečno) putem Resend-a. |
| **12. Backlink Monitor** | Prati referring domene i kvalitet linkova. |

### Agency Tier

| Feature | Opis |
|---------|------|
| **13. AI Citation Audit** | Skenira vidljivost brenda na ChatGPT, Claude, Gemini i Perplexity. 20 promptova × 4 platforme + fix pack generacija. |
| **14. AEO Foundations** | AI Engine Optimization — audit robots.txt, llms.txt fetch, generacija llms.txt za AI crawler-e. |
| **15. Agentic Readiness** | WebMCP provera, task completion scoring, detekcija friction points i hostile patterns. |
| **16. Client Portal** | White-label share dashboard za klijente. |
| **17. Referrals** | Referral program sa kodovima, click tracking (IP/UA), stats dashboard i share buttons. |

---

## Tehnička Arhitektura

### Stack

| Sloj | Tehnologija |
|------|------------|
| **Framework** | Next.js 16.2.9 (App Router, Turbopack) |
| **Styling** | Tailwind CSS v4 |
| **UI Komponente** | Radix UI (Dialog, DropdownMenu, Tabs, Slot) + class-variance-authority |
| **Baza** | Supabase PostgreSQL (projekat: `pvjyeycxwqoyzhaancaj`) |
| **Auth** | Supabase Auth (SSR, email/password) |
| **AI Engine** | Google Gemini 3.1 Flash Lite (default), OpenAI / Anthropic / Perplexity kao opcioni provideri |
| **Payments** | Paddle Billing (14-day trial, 3 tier-a × 2 billing cycle-a = 6 price ID-ova) |
| **Email** | Resend (planirano) |
| **Hosting** | Vercel (team: `giga-s-projects4`, projekat: `kvant`) |
| **Monitoring** | Sentry |
| **Charts** | Recharts (bar, line, donut) + inline SVG |
| **PDF** | @react-pdf/renderer |
| **Icons** | Lucide React |
| **Date** | date-fns |

### Boje (brand)

- **Pozadina:** `#27262E` (dark charcoal)
- **Akcent:** `#E19C63` (warm gold/copper)
- **Sekundarna:** `#8BA5BE` (cool steel blue)

### Struktura Direktorijuma

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── proxy.ts                  # Request interception (Next.js 16 middleware zamena)
│   ├── robots.ts                 # SEO robots
│   ├── sitemap.ts                # SEO sitemap
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Globalni stilovi
│   ├── error.tsx                 # Global error handler
│   ├── client/                   # Client-side pages (privacy, terms, refund)
│   ├── login/ + register/ + onboarding/
│   ├── share/[token]/            # Javni share linkovi za reportove
│   ├── dashboard/                # 17 feature modula (svaki u svom direktorijumu)
│   └── api/                      # 26 API kategorija
│       ├── auth/                 # Auth callback
│       ├── paddle/               # Checkout + webhook
│       ├── cron/                 # Scheduled tasks (generate-reports, scan-brands)
│       ├── reports/ + seo/ + competitive/ + content-briefs/ + content-calendar/
│       ├── invoices/ + proposals/ + branding/
│       ├── connections/          # GA4, Google Ads, Meta Ads OAuth
│       ├── citation-audit/ + aeo/ + agentic/ + referral/ + analytics/
│       ├── backlink-monitors/ + keyword-rankings/
│       ├── scheduled-reports/ + client-portal/
│       ├── admin/ + users/ + profile/ + webhooks/
│       └── dashboard/            # Competitive dashboard API
├── components/
│   ├── ui/                       # button, card, badge, input, skeleton, dialog, tabs, dropdown-menu
│   ├── dashboard/                # sidebar, subscription-gate, onboarding-guard
│   ├── calendar/                 # content-calendar (drag-drop grid)
│   ├── reports/                  # report-pdf.tsx
│   ├── invoices/                 # invoice-pdf.tsx
│   └── seo/                      # SEO komponente
├── lib/
│   ├── features.ts               # 17 feature definicija + tier pricing + price ID-ovi
│   ├── subscription-guard.ts     # Server-side gating (trial OR active sub + per-feature)
│   ├── supabase/                 # client.ts, server.ts, middleware.ts, admin.ts
│   ├── llm/                      # client.ts, providers.ts, prompts/
│   │   └── prompts/              # narrative.ts, seo-scan.ts, proposal.ts, content-brief.ts
│   ├── api/                      # ga4.ts, google-ads.ts, meta-ads.ts
│   ├── paddle/                   # client.ts (Paddle API wrapper)
│   ├── email/                    # send-report.ts + templates/
│   ├── pdf/                      # PDF helperi
│   ├── integrations/             # (prazno - za buduće integracije)
│   └── hooks/                    # use-animated-counter, use-theme, use-toast
supabase/migrations/              # 25 SQL migracija
scripts/                          # create-paddle-prices.mjs
docs/                             # kvant-capabilities.md, superpowers/
```

### Database (Supabase — 25 migracija)

| Tabela | Namena |
|--------|--------|
| `profiles` | Korisnički profili, onboarding status, trial period, user_features |
| `data_connections` | OAuth tokeni za GA4, Google Ads, Meta Ads + validacija |
| `report_configs` + `reports` | Konfiguracija i generisani narativni izveštaji (soft delete) |
| `client_share_links` | Javni share tokeni za reportove |
| `brand_monitors` + `brand_mentions` | Brand Radar — monitori i rezultati skenova |
| `content_briefs` | AI generisani content briefovi |
| `content_calendar` + `calendar_comments` | Content Calendar unosi i komentari |
| `invoices` | Fakture (broj, klijent, stavke, status) |
| `subscriptions` + `billing_history` | Paddle pretplate i transakcije |
| `service_config` | Server-side konfiguracija |
| `user_features` | Per-feature gating (TEXT[] niz slug-ova) |
| `citation_audits` | AI Citation Audit rezultati |
| `referral_codes` + `referral_clicks` | Referral program |
| `keyword_rankings` | Rank Tracker podaci |
| `backlink_monitors` + `backlinks` | Backlink Monitor podaci |
| `scheduled_reports` + `scheduled_report_recipients` | Scheduled Reports |
| `client_portal_access` | Client Portal |

### API Routes (26 kategorija)

- **Auth:** callback
- **Paddle:** create-checkout, webhook
- **Cron:** generate-reports (Mon 6h), scan-brands (daily 7h)
- **Core features:** reports, seo (Brand Radar), competitive, content-briefs, content-calendar
- **Business:** invoices, proposals, branding
- **Integracije:** connections (ga4, google-ads, meta-ads + callbackovi)
- **Agency AI:** citation-audit, aeo, agentic, analytics
- **Marketing:** referral, backlink-monitors, keyword-rankings, scheduled-reports
- **Admin:** admin, users, profile, webhooks, client-portal
- **Dashboard:** competitive data endpoint

### Pricing Model

| Tier | Cena (mesečno) | Cena (godišnje) | Feature-a |
|-----|----------------|-----------------|-----------|
| Starter | $19/mo | $190/yr | 6 alata (reports, seo, competitive, analytics, content-briefs, content-calendar) |
| Pro | $49/mo | $490/yr | 6 starter + 6 pro alata |
| Agency | $99/mo | $990/yr | Svi alati (starter + pro + agency) |

- Trial period: 14 dana (svi feature-i dostupni)
- Plaćanje: Paddle (kartica)
- "Build Your Own Plan" više ne postoji — prešlo se na 3 tier-a (Starter/Pro/Agency)

---

## Ključni Tehnički Detalji

- **Multi-provider LLM:** `callProvider()` dispatches to OpenAI/Anthropic/Gemini/Perplexity; default je `askLLM()` koji koristi Google Gemini iz env var-a
- **Subscription gating:** Dvoslojna zaštita — server-side (`checkServerAccess()`) + client-side (`SubscriptionGate` komponenta)
- **Paddle webhook:** Handla `transaction.completed`/`transaction.paid` i `subscription.updated`/`subscription.canceled`
- **RLS:** Sve tabele zahtevaju SELECT + INSERT + UPDATE + DELETE politike (silent fail ako fali)
- **Vercel cron:** Maks 2 cron job-a na free tier-u, auto auth preko `x-vercel-cron` header-a
- **Proxy.ts:** Next.js 16 konvencija — middleware je zamenjen proxy.ts fajlom
- **Sentry:** Error tracking sa source map upload-om
