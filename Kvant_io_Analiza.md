# Kvant.io — Analiza Projekta i Preporuke

**Repo:** github.com/gigimento/Kvant.io
**Datum analize:** 21. jun 2026.
**Analizirao:** Claude (na zahtev Gige)

---

## 1. Šta je Kvant.io

Next.js 16 SaaS projekat sa dva proizvoda pod jednim krovom, pod internim nazivom "Agency Tools Suite":

| Proizvod | Šta radi | Cena |
|---|---|---|
| **Narrative Reports** | Generiše AI-pisane klijentske izveštaje iz GA4 / Google Ads / Meta podataka | $49–149/mes |
| **Brand Radar (LLM SEO)** | Prati pominjanje brenda i konkurencije unutar AI chatbotova (ChatGPT, Claude, itd.) | $99–299/mes |

Plan je launch + rast do $3-5k MRR za 6-9 meseci, sa ciljem prodaje na Acquire.com.

---

## 2. Tech Stack — Ocena

| Komponenta | Izbor | Ocena | Komentar |
|---|---|---|---|
| Framework | Next.js 16.2.9 (App Router) | ⭐⭐⭐⭐⭐ | Moderno, server components, dobar izbor |
| Baza | Supabase (PostgreSQL) | ⭐⭐⭐⭐ | Free tier dovoljan za MVP, auth built-in, RLS već postavljen |
| LLM | OpenRouter (Claude + Groq) | ⭐⭐⭐⭐ | Jedan API ključ za oba modela — pametno |
| Payments | Lemon Squeezy | ⭐⭐⭐⭐ | Dobar izbor za Srbiju (Stripe nije dostupan) |
| Email | Resend | ⭐⭐⭐⭐ | Free 3k/mes, jednostavan setup |
| Hosting | Vercel | ⭐⭐⭐⭐⭐ | Auto-deploy, serverless, besplatan tier |
| UI | Tailwind v4 + shadcn-style | ⭐⭐⭐⭐ | Brzo, standardno, lako za održavanje |

**Zaključak:** Stack je production-ready, nema eksperimentalnih izbora koji bi blokirali skaliranje kasnije.

---

## 3. Arhitektura

```
src/
├── app/
│   ├── page.tsx                  # Landing
│   ├── login/, register/         # Auth
│   ├── dashboard/
│   │   ├── reports/              # Narrative Reports proizvod
│   │   └── seo/                  # Brand Radar proizvod
│   └── api/
│       ├── auth/callback/
│       ├── reports/generate/
│       └── seo/scan/
├── components/
│   ├── ui/                       # button, card, badge, input, skeleton
│   └── dashboard/sidebar.tsx
└── lib/
    ├── supabase/                 # client.ts, server.ts
    ├── llm/                      # client.ts (OpenRouter) + prompts/
    └── utils.ts
supabase/migrations/001_schema.sql
```

**Dobro:**
- LLM client je centralizovan (`askLLM`, `askLLMWithSystem`) — nema copy-paste poziva po rutama
- RLS (Row Level Security) politike su already postavljene na svim tabelama u schema.sql
- Nema route group chaos-a, ruta je predvidiva
- TypeScript svuda, `.env` pattern za tajne

**Loše:**
- API rute za izveštaje koriste **mock GA4 podatke** — pravi OAuth fetch nije implementiran
- Nema centralizovanog error response shape-a (svaka ruta vraća svoj format greške)
- LLM odgovor se parsira string-matching-om (`.includes("positive")`), bez strukturiranog izlaza
- `@react-pdf/renderer` je u zavisnostima ali se nigde ne koristi — PDF generacija nije implementirana

---

## 4. Status MVP-a

**Gotovo (~70%):**
- ✅ Sve UI komponente (button, card, input, badge, skeleton)
- ✅ Dashboard layout sa sidebar-om
- ✅ Supabase Auth flow + middleware
- ✅ Database schema sa RLS politikama
- ✅ API rute (struktura postoji za reports + seo scan)
- ✅ LLM client + prompt builderi (narrative.ts, seo-scan.ts)

**Nedostaje (~30%):**
- ❌ Supabase projekat nije kreiran — `.env.local` prazan
- ❌ Lemon Squeezy integracija (webhook za subscriptions)
- ❌ Resend integracija (slanje email-ova)
- ❌ GA4 OAuth — pravo povlačenje podataka (trenutno mock)
- ❌ PDF generacija (paket uvezen, ne koristi se)
- ❌ Vercel cron za automatske Brand Radar skenove
- ❌ Error boundaries / graceful fallback UI

---

## 5. Rizici i Crvene Zastavice

1. **`middleware.ts` je deprecated u Next.js 16** — preimenovano je u "proxy", ali trenutni kod i dalje koristi staro ime. Radiće za sada, ali treba migracija pre nego što Next.js ga potpuno ukine.
2. **GA4 OAuth je veliki, podcenjen task** — Google-ov OAuth consent flow + token refresh logika obično traje duže nego što plan predviđa.
3. **Parsiranje LLM odgovora je fragilno** — `response.content.toLowerCase().includes(brand_name)` lako puca na edge case-ovima (brend sa specijalnim karakterima, partial match, itd.). Bolje: traži strukturiran JSON output od modela.
4. **Nema retry/fallback za LLM pozive** — ako OpenRouter padne ili vrati grešku, cela ruta puca bez retry logike.
5. **Pricing je agresivan na ulazu** ($49 za 5 klijenata) — tanka marža za podršku + infra troškove ako agencija odmah iskoristi sve klijente.
6. **Nema retention/onboarding strategije u planu** — fokus je na launch, ali ne i na to šta zadržava klijenta posle meseca 1.
7. **Konkurencija na Narrative Reports** je jaka (DashThis, AgencyAnalytics, Supermetrics) — diferencijacija mora biti jasnija od "AI piše izveštaj".

---

## 6. Preporuke — Šta Dodati i Poboljšati

### Prioritet 1 — Ova nedelja (osnovni setup)
- [ ] Kreirati pravi Supabase projekat, popuniti `.env.local`
- [ ] Pokrenuti `npm run dev`, testirati ceo auth flow (register → login → dashboard)
- [ ] Ubaciti 2-3 test korisnika, proveriti da RLS politike rade kako treba

### Prioritet 2 — Nedelja 2 (core funkcionalnost)
- [ ] Implementirati Lemon Squeezy webhook handler (`subscription_created`, `subscription_cancelled`)
- [ ] Implementirati Resend slanje email-ova (potvrda registracije, gotov izveštaj)
- [ ] Završiti PDF generaciju sa `@react-pdf/renderer` (trenutno neiskorišćeno)
- [ ] Promeniti LLM parsing na strukturiran JSON output (koristi `response_format: json` ili tool calling umesto string matching-a)

### Prioritet 3 — Nedelja 3 (pravi podaci)
- [ ] Implementirati GA4 OAuth flow (Google Cloud Console setup + token refresh)
- [ ] Zameniti mock podatke u `reports/generate/route.ts` pravim GA4 API pozivima
- [ ] Dodati Vercel cron job za automatske Brand Radar skenove (`vercel.json` + scheduled route)

### Prioritet 4 — Pre javnog lansiranja
- [ ] Dodati centralizovan error handler / response shape za sve API rute
- [ ] Dodati retry logiku za LLM pozive (exponential backoff, fallback model)
- [ ] Dodati error boundaries u dashboard (da padovi ne ruše ceo UI)
- [ ] Migrirati `middleware.ts` na novi Next.js 16 "proxy" pattern
- [ ] Napraviti landing page sa jasnom diferencijacijom (ne samo "AI izveštaji" — npr. "izveštaj koji klijent stvarno pročita", "vidi gde te ChatGPT pominje pre konkurencije")

### Prioritet 5 — Posle MVP-a (rast)
- [ ] Definisati onboarding flow za nove korisnike (checklist, prazno stanje sa CTA)
- [ ] Definisati retention metriku (npr. broj generisanih izveštaja mesečno po korisniku) i pratiti je
- [ ] Skupiti 5-10 beta klijenata besplatno, tražiti feedback pre nego što se naplaćuje
- [ ] Case studies / testimonijali pre Product Hunt lansiranja
- [ ] Razmotriti fallback LLM provajdera (ako OpenRouter padne, ceo proizvod staje)

---

## 7. Finalna Ocena

| Kategorija | Ocena | Komentar |
|---|---|---|
| Ideja | ⭐⭐⭐⭐⭐ | Brand Radar je nesterotipan i prati pravi trend (AI search), Narrative Reports je validno ali konkurentno tržište |
| Tech izbori | ⭐⭐⭐⭐ | Solidan, production-ready stack, čista arhitektura |
| MVP kompletnost | ⭐⭐⭐ | ~70% gotovo, nedostaju integracije (plaćanje, email, pravi podaci) |
| Kvalitet koda | ⭐⭐⭐ | Dobra struktura, ali fragilan LLM parsing i nema error handling standarda |
| Tržišna pozicija | ⭐⭐⭐⭐ | Realna cena, jasna ciljna grupa (agencije), exit strategija ima smisla |

**Zaključak:** Projekat ima solidnu osnovu i jasnu viziju. Najveći prioritet je završiti realne integracije (Supabase, Lemon Squeezy, GA4 OAuth) pre nego što se dodaju nove funkcije — trenutno je infrastruktura tu, ali "srce" proizvoda (pravi podaci, pravo plaćanje) još nije povezano.
