# Kvant — AI-Powered Agency Toolkit

Kvant (**K**nowledge **V**isualization & **A**nalytics for **N**arrative **T**eams) je sve-u-jednom AI platforma za marketing agencije, frilensere i biznise. Zamenjuje 8+ alata jednom platformom — plaćaš samo što koristiš.

> **Tech stack**: Next.js 16, TypeScript, Supabase, Google Gemini AI, Paddle, Resend, Vercel

---

## 1. Narrative Reports — AI Izveštaji

Automatizovani klijentski izveštaji koje AI piše u narativnom stilu — umesto suvih tabela, klijent dobija priču sa uvidima.

### Šta radi:
- Povlači **realne podatke iz GA4** (Google Analytics 4) — sessioni, korisnici, pageview-i, bounce rate, avg session duration
- Poredi **tekući vs prethodni period** sa delta procentima
- Učitava **top 5 stranica po sessionima**, **top 5 izvora saobraćaja**
- AI generiše **3-4 pasusa narativnog teksta** — executive summary, key wins, areas needing attention, recommendations
- **Period-over-period comparison** — selektuj dva izveštaja i vidi ih side-by-side sa svim metrikama + narativom
- **PDF export** — svaki izveštaj može da se preuzme kao PDF
- **Shareable link** — generiši javni link sa tokenom (ne zahteva login)
- **Scheduled auto-generation** — cron job generiše izveštaje automatski po rasporedu (nedeljno/mesečno)
- **Email delivery** — izveštaji se šalju na listu email adresa putem Resend-a

### Povezani podaci (putem OAuth):
- **Google Analytics 4** — sessioni, korisnici, pageview-i, bounce rate, top stranice, izvori
- **Google Ads** — utisci, klikovi, trošak, konverzije
- **Meta Ads** — utisci, klikovi, potrošnja, reach, CTR, CPC

---

## 2. Brand Radar — AI Brand Monitoring

Prati gde i kako se tvoj brend (i konkurenti) pominju u AI asistentima (Gemini, ChatGPT, Claude, itd.).

### Šta radi:
- Kreiraš **monitor** sa imenom brenda, listom konkurenata i ključnim rečima/pitanjima
- AI **simulira odgovor** — pita LLM "Šta znaš o X?" i parsira odgovor
- Detektuje da li je **tvoj brend ili konkurent pomenut**
- Određuje **sentiment** (positive / neutral / negative)
- Čuva **context snippet** — okolni tekst iz odgovora
- **Share-of-Voice** analiza — pita LLM koji brend preporučuje i u kom procentu
- **Manual scan** — klikni "Run Scan" odmah
- **Scheduled scan** — cron job skenira automatski (nedeljno)
- **Sentiment donut chart** — vizuelni prikaz positive/neutral/negative

---

## 3. Competitive Dashboard — Konkurentska Analiza

Dashboard koji agregira sve podatke iz Brand Radar skenova i prikazuje trendove.

### Šta radi:
- **Total Mentions** — ukupan broj pomena
- **Avg Sentiment Score** — prosečan sentiment u %
- **Competitors Tracked** — koliko konkurenata se prati
- **This Month Mentions** — pomeni u tekućem mesecu
- **Share of Voice bar chart** — pomeni kroz vreme (bar chart)
- **Sentiment Breakdown** — donut chart (positive/neutral/negative)
- **Brand vs Competitors line chart** — linije za svaki brend kroz vreme
- Prazan state sa CTA da se kreira prvi monitor

---

## 4. Content Briefs — AI Content Briefovi

Generiši SEO-optimizovane content briefove za pisce, copywritere i content tim.

### Šta radi:
- Uneseš **target keyword**, **ciljnu publiku** i **content goal**
- AI vraća **strukturirani JSON brief** sa:
  - SEO-optimized title
  - Article outline (section headings)
  - Key points
  - FAQ ideas (pitanje + odgovor)
  - Recommended tone/style
- **Copy sections** — klikni da kopiraš outline, key points ili FAQs
- **Save & history** — svi briefovi se čuvaju, istorija sa timestamp-ovima
- **Schedule to Calendar** — zakaži post direktno u Content Calendar
- **AI Fill Social Post** — generiši caption + hashtagove za Instagram/TikTok/Facebook/YouTube iz brief-a
- **Delete** — obriši brief kad nije više potreban

---

## 5. Content Calendar — Kalendar Sadržaja

Planiraj, organizuj i prati sav content na jednom mestu — sa dve vrste pregleda.

### Šta radi:
- **Monthly Calendar View** — klasičan mesečni grid sa obeleženim danima
- **Kanban Board View** — 5 kolona: Draft → Review → Approved → Scheduled → Published
- **Drag & drop** — prevuci karticu između kolona da promeniš status
- **Platform color coding** — Instagram (roze), TikTok (cyan), Facebook (plavi), YouTube (crveni)
- **CRUD** — kreiraj, edituj, briši unose
- **Polja**: title, platforme (multi-select), content type, date, time, assigned user, status, caption, media URL-ovi, evergreen toggle
- **AI Post Generation** — iz brief-a generiši platform-specific caption + hashtagove
- **Comments** — dodaj komentare na svaki unos (timski rad)
- **Bulk scheduling** — batch API za masovno zakazivanje

---

## 6. Invoices — Fakture

Kreiraj i šalji profesionalne fakture klijentima.

### Šta radi:
- **Create invoice** — klijent, email, line items (description + qty + rate), tax %, due date
- **Live total** — obračun se ažurira u realnom vremenu dok kucaš
- **Auto numbering** — sekvencijalni brojevi faktura (INV-0001...)
- **Statuses** — draft, sent, paid, cancelled (sa color-coded badge-ovima)
- **PDF download** — svaka faktura se preuzima kao PDF
- **Revenue sparkline** — SVG grafikon prihoda kroz 12 meseci
- **Branding support** — PDF fakture koriste brand boje i logo iz Settings > Branding
- **Delete** — obriši fakturu

---

## 7. Proposals — AI Predlozi

Generiši profesionalne predloge/proposals za klijente u sekundi.

### Šta radi:
- Uneseš: **client name**, **project scope**, **deliverables**, **timeline**, **budget range**, **additional notes**
- AI vraća **strukturirani proposal** sa sekcijama:
  - Executive Summary
  - Approach
  - Deliverables (bullet list)
  - Timeline
  - Investment
  - Next Steps
- **Copy to clipboard** — jedan klik kopira ceo proposal
- Sve na **jednoj strani** — form + result

---

## 8. Data Connections — Povezivanje Podataka

Poveži svoje marketing account-e da Kvant povlači žive podatke.

### Šta radi:
- **Google Analytics 4 (GA4)** — OAuth2, povlači podatke o saobraćaju
- **Google Ads** — OAuth2, campaign performance
- **Meta Ads** — Facebook OAuth, ad account metrics
- **Connect/Disconnect** — jedan klik za svaki provider
- **Connection validity check** — banner upozorava ako je konekcija istekla ili joj ističe za 3 dana
- **Auto-refresh token** — GA4 token se osvežava automatski kad istekne

---

## 9. Subscriptions & Billing — Pretplate i Naplata

"Build Your Plan" — biraš samo alate koje koristiš.

### Šta radi:
- **8 alata** — svaki $9/mo (Branding $3/mo), popust što više uzmeš
- **4 tier-a**: Starter ($9), Growth ($15), Scale ($22), All Access ($29)
- **Monthly / Yearly** — yearly = 2 meseca gratis
- **Paddle checkout** — sigurno plaćanje karticom
- **Customer portal** — "Manage Subscription" za promenu payment metode, otkazivanje
- **Cancel subscription** — otkaži jednim klikom
- **Billing history** — cela istorija transakcija
- **Feature gating** — svaki feature se otključava po subscription-u
- **Trial support** — besplatan probni period

---

## 10. Postavke i Profil

### Settings:
- **Profile** — ime, kompanija, uloga (agency/freelancer/business)
- **Email change** — promeni email (šalje confirmation)
- **Password change** — novi password sa potvrdom
- **Email verification** — banner + resend ako email nije potvrđen

### Branding (utiče na PDF-ove i shared reportove):
- **Company name** — naziv agencije
- **Logo URL** — preview sa error handling-om
- **Color palette** — primary (#27262E), accent (#E19C63), secondary (#8BA5BE) — sve se može promeniti

---

## 11. Onboarding

Vodič kroz 3 koraka za nove korisnike:
1. **Profile** — ime, kompanija, uloga
2. **Features** — izaberi koje alate želiš da koristiš
3. **Verify** — potvrdi email (ili preskoči)

---

## Tehnički Detalji

| Kategorija | Šta se koristi |
|-----------|----------------|
| **Framework** | Next.js 16 (App Router) |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth (email/password, OAuth) |
| **AI Engine** | Google Gemini 3.1 Flash Lite |
| **Payments** | Paddle Billing |
| **Email** | Resend |
| **Deploy** | Vercel (auto-deploy na push) |
| **Charts** | Recharts + inline SVG |
| **Styling** | Tailwind CSS, dark theme |
| **LLM Prompts** | 4 prompt template-a (narrative, seo-scan, content-brief, proposal) |

### Cron Jobs:
- **`/api/cron/generate-reports`** — automatska generacija izveštaja po rasporedu
- **`/api/cron/scan-brands`** — automatski brand skenovi (nedeljno)

### Database Tabele (16 migrationa):
`profiles`, `report_configs`, `reports`, `report_shares`, `brand_monitors`, `brand_mentions`, `content_briefs`, `content_calendar`, `calendar_comments`, `invoices`, `data_connections`, `subscriptions`, `billing_history`, `service_config`, `user_features`

---

## Cena

| Broj alata | Mesečno | Godišnje |
|-----------|---------|---------|
| 1 | $9 | $90 |
| 2–3 | $15 | $150 |
| 4–5 | $22 | $220 |
| 6–8 (All Access) | $29 | $290 |

Svi alati su dostupni besplatno u probnom periodu (trial).
