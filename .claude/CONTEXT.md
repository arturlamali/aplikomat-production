# 🤖 Claude Code - Aplikomat Project Context

> **Ostatnia aktualizacja:** 2025-01-13
> **Status projektu:** Production-ready (8.5/10)
> **Cel:** AI-powered CV generator z LinkedIn profile + job posting

---

## 📋 Szybki Start dla Nowych Sesji

### Co zostało zrobione (Completed):

✅ **Security & Configuration**
- .gitignore i .env.example utworzone
- next.config.js naprawiony (usunięto ignoreBuildErrors)
- Security headers dodane (HSTS, X-Frame-Options, CSP, etc.)
- Cookies zabezpieczone (Secure flag, 7 dni zamiast 100 lat)
- ENV variables są required (nie optional)

✅ **Error Handling & Monitoring**
- Error Boundary dodany do layout
- /api/health endpoint utworzony
- Structured logger zaimplementowany (src/lib/logger.ts)

✅ **Rate Limiting**
- Rate limiter zaimplementowany (src/lib/rate-limit.ts)
- Limity dla wszystkich kosztownych operacji:
  - AI Generation: 10/godzinę
  - Job Search: 50/godzinę
  - LinkedIn Scraping: 20/godzinę

✅ **Code Quality**
- 50+ console.log zastąpionych structured loggerem (backend)
- 58+ console.log usuniętych z client code
- Czysta konsola w production

✅ **Git & GitHub**
- Repository: https://github.com/arturlamali/aplikomat-production
- 3 commity zrobione (initial + rate limiting + cleanup)

---

## 🎯 Aktualny Focus: Universal Job Scraping

### Problem do rozwiązania:
Obecnie system wspiera tylko:
- LinkedIn (przez RapidAPI)
- RocketJobs (przez database)

**Cel:** Obsługa DOWOLNEGO linku do oferty pracy!

### Plan implementacji:

#### **FAZA 1: ANALIZA (W TRAKCIE)** ⏳

**Co trzeba przeanalizować dla każdej strony:**

1. **Cookies & Consent**
   - Czy jest cookie banner?
   - Jakie buttony kliknąć?
   - Czy można ominąć?

2. **Content Loading**
   - Czy opis jest od razu widoczny?
   - Czy trzeba kliknąć "Pokaż więcej"?
   - Czy są lazy-loaded elements?

3. **Selektory CSS**
   - Gdzie jest job title?
   - Gdzie company name?
   - Gdzie description?
   - Gdzie requirements?
   - Gdzie salary?
   - Gdzie location?

4. **Dynamic Content**
   - Czy używają React/Vue?
   - Czy dane są w JSON-LD?
   - Czy są w data attributes?

5. **Anti-Scraping**
   - Czy blokują headless browsers?
   - Czy wymagają JavaScript?
   - Czy są rate limits?

**Strony do przeanalizowania (priorytet):**

1. 🔴 **LinkedIn** (incognito, bez API)
   - URL: https://www.linkedin.com/jobs/view/4312761599/
   - Status: DO ANALIZY
   - Notes: Wymaga logowania? Cookies? "Pokaż więcej"?

2. 🟡 **Pracuj.pl**
   - URL: https://www.pracuj.pl/praca/specjalista-ds-ochrony-srodowiska-wroclaw-curie-sklodowskiej-55,oferta,1004476116
   - Status: DO ANALIZY
   - Notes: Sprawdzić strukturę, cookies

3. 🟡 **RocketJobs** (już mamy API, ale dobra baza testowa)
   - URL: https://rocketjobs.pl/oferta-pracy/znanylekarz-specjalist-ka-ds-sprzedazy-ai-warszawa-sales-it-i-telekomunikacja
   - Status: DO ANALIZY
   - Notes: Już mamy dane z DB, użyć do walidacji

4. 🟢 **NoFluffJobs**
   - URL: https://nofluffjobs.com/pl/job/...
   - Status: TODO

5. 🟢 **JustJoinIt**
   - URL: https://justjoin.it/offers/...
   - Status: TODO

6. 🟢 **BulldogJob**
   - URL: https://bulldogjob.pl/companies/jobs/...
   - Status: TODO

#### **FAZA 2: IMPLEMENTACJA** (Po analizie)

Po ukończeniu analizy, zaimplementować:

1. **Playwright Setup**
   ```bash
   pnpm add playwright
   npx playwright install chromium
   ```

2. **Source Detector** (src/lib/scraper/source-detector.ts)
   - Rozpoznawanie źródła po URL
   - Routing do odpowiedniej strategii

3. **Site-Specific Scrapers** (src/lib/scraper/sites/)
   - linkedin-scraper.ts
   - pracuj-scraper.ts
   - nofluffjobs-scraper.ts
   - etc.

4. **AI Extractor** (src/lib/scraper/ai-extractor.ts)
   - Universal fallback
   - Gemini 2.0 Flash do extraction

5. **tRPC Endpoints** (src/server/api/routers/resume.ts)
   - generateFromUrl (uniwersalny)
   - generateFromText (manual fallback)

6. **UI Updates** (src/components/)
   - UniversalJobInput.tsx
   - SourceBadge.tsx
   - ScrapingProgress.tsx

---

## 📁 Struktura Projektu

```
aplikomat11/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   ├── health/          # Health check endpoint ✅
│   │   │   └── trpc/            # tRPC API
│   │   ├── dashboard/           # User dashboard
│   │   ├── admin/               # Admin panel
│   │   └── page.tsx             # Landing page
│   │
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/         # tRPC routers (rate limited ✅)
│   │   │   │   ├── resume.ts    # CV generation (AI)
│   │   │   │   ├── jobs.ts      # Job search
│   │   │   │   ├── linkedinScraper.ts
│   │   │   │   └── admin.ts
│   │   │   └── schemas/         # Zod validation schemas
│   │   └── db/                  # Drizzle ORM
│   │       ├── schema.postgres.ts
│   │       └── schema.sqlite.ts
│   │
│   ├── lib/                     # Utilities
│   │   ├── logger.ts            # ✅ Structured logger
│   │   ├── rate-limit.ts        # ✅ Rate limiting
│   │   ├── atsOptimization.ts   # ATS keyword optimization
│   │   └── scraper/             # 🔜 NOWE! Universal scraping
│   │       ├── playwright-scraper.ts
│   │       ├── source-detector.ts
│   │       ├── ai-extractor.ts
│   │       └── sites/           # Site-specific scrapers
│   │           ├── linkedin.ts
│   │           ├── pracuj.ts
│   │           └── ...
│   │
│   ├── components/              # React components
│   │   ├── ErrorBoundary/       # ✅ Error boundary
│   │   ├── GenerateCVFromLink.tsx
│   │   └── ui/                  # shadcn/ui components
│   │
│   └── env.js                   # ✅ ENV validation (required vars)
│
├── drizzle/                     # Database migrations (7 migrations)
├── public/                      # Static assets
│
├── .env.example                 # ✅ ENV template
├── .gitignore                   # ✅ Git ignore file
├── next.config.js               # ✅ Fixed (security headers)
├── package.json                 # Dependencies
├── UNIVERSAL_SCRAPING_PLAN.md   # Implementation plan
└── .claude/
    └── CONTEXT.md               # 👈 TEN PLIK!
```

---

## 🔧 Tech Stack

### Core:
- **Framework:** Next.js 15.2.4 (App Router)
- **Language:** TypeScript 5.5 (strict mode)
- **Database:** PostgreSQL (Supabase) + Drizzle ORM
- **API:** tRPC v11 RC (⚠️ TODO: upgrade to stable)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS 4.x + shadcn/ui

### AI/ML:
- **AI SDK:** Vercel AI SDK
- **Models:**
  - Google Gemini 2.0 Flash (primary)
  - OpenAI o3-mini
  - Anthropic Claude 3.5 Haiku
- **ATS Optimization:** Custom keyword extraction + scoring

### Tools:
- **Logging:** Custom structured logger (src/lib/logger.ts)
- **Rate Limiting:** In-memory (⚠️ TODO: Redis for production)
- **PDF Generation:** @react-pdf/renderer
- **Analytics:** PostHog
- **Package Manager:** pnpm 9.12.3

### Planned:
- **Scraping:** Playwright (headless browser)
- **Testing:** Vitest + Playwright Test
- **Error Tracking:** Sentry
- **CI/CD:** GitHub Actions

---

## 📊 Current Status & Metrics

### Production Readiness: 8.5/10 ✅

**Completed:**
- ✅ Security (8/10)
- ✅ Error Handling (9/10)
- ✅ Rate Limiting (8/10)
- ✅ Logging (9/10)
- ✅ Code Quality (9/10)

**TODO (dla 10/10):**
- ⚠️ Testing (0/10) - BRAK TESTÓW
- ⚠️ Error Tracking (0/10) - Brak Sentry
- ⚠️ Redis Rate Limiting (in-memory obecnie)
- ⚠️ tRPC stable (obecnie RC)
- ⚠️ CI/CD pipeline

### Known Issues:

1. **tRPC RC version** - Używa release candidate, nie stable
2. **In-memory rate limiting** - Nie skaluje się w multi-instance
3. **No tests** - Zero testów (unit, integration, E2E)
4. **No error tracking** - Brak Sentry/podobnego
5. **Client-side console** - 3 pliki celowo mają console.error (ErrorBoundary, theme, logger)

---

## 🚀 Następne Kroki (Roadmap)

### 🔴 HIGH PRIORITY

1. **Universal Job Scraping** ⏳ IN PROGRESS
   - Analiza stron (LinkedIn, Pracuj.pl, etc.)
   - Playwright implementation
   - AI extraction
   - Manual text fallback

2. **Testing**
   - Unit tests dla tRPC routers
   - Integration tests dla AI generation
   - E2E tests dla critical flows

3. **Error Tracking**
   - Sentry setup
   - Error alerts
   - Performance monitoring

### 🟡 MEDIUM PRIORITY

4. **Infrastructure**
   - Redis dla rate limiting
   - Background jobs (BullMQ)
   - Database backups automation
   - CI/CD pipeline

5. **Dependency Updates**
   - tRPC RC → stable
   - Security updates
   - Package audit

### 🟢 NICE TO HAVE

6. **Features**
   - Cover letter generation
   - Multiple CV versions
   - Export to Word
   - ATS score history
   - Browser extension
   - Job alerts

---

## 💡 Development Guidelines

### Gdy dodajesz nowy feature:

1. **Zawsze używaj:**
   - ✅ Structured logger (nie console.log!)
   - ✅ Rate limiting dla kosztownych operacji
   - ✅ Zod validation na wszystkich inputach
   - ✅ Error handling z try-catch
   - ✅ TypeScript strict mode

2. **Nigdy nie:**
   - ❌ Commituj .env.local
   - ❌ Ignoruj TypeScript errors
   - ❌ Używaj any types
   - ❌ Dodawaj console.log (use logger!)
   - ❌ Hardcoduj secrets

3. **Konwencje:**
   - Polski w UI (komunikaty dla userów)
   - Angielski w kodzie (zmienne, funkcje, comments)
   - Commit messages po angielsku
   - Footer: "🤖 Generated with Claude Code"

### Commit Message Format:

```
<type>: <subject>

<body>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: feat, fix, chore, docs, refactor, test

---

## 🔐 Environment Variables

**Required (muszą być w .env.local):**

```bash
# Database
DATABASE_URL_SUPABASE=postgresql://...
DIRECT_URL_SUPABASE=postgresql://...
SUPABASE_SERVICE_KEY=...

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# RapidAPI (LinkedIn scraping)
RAPIDAPI_KEY=...
RAPIDAPI_HOST=linkedin-data-api.p.rapidapi.com
LINKEDIN_API_URL=...

# AI (przynajmniej jeden)
GOOGLE_GENERATIVE_AI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

**Optional:**
```bash
# SQLite (local dev)
DATABASE_URL_SQLITE=file:./drizzle-local/sqlite.db

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Maintenance
MAINTENANCE_MODE=false
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Rate Limit Error
```
Error: "Przekroczono limit 10 żądań. Spróbuj ponownie za X minut."
```
**Solution:** To jest expected behavior. Rate limiting działa!

### Issue 2: ENV Variables Missing
```
Error: Invalid environment variables
```
**Solution:** Skopiuj .env.example do .env.local i wypełnij wartości

### Issue 3: tRPC Type Errors
```
Error: Type 'X' is not assignable to type 'Y'
```
**Solution:** Sprawdź Zod schema - może trzeba dodać .optional() lub .nullable()

---

## 📚 Resources & Links

- **GitHub:** https://github.com/arturlamali/aplikomat-production
- **Vercel:** (TODO: add deployment URL)
- **Supabase:** (project: uynrfmqznwwazfikqqxg)
- **tRPC Docs:** https://trpc.io/
- **Drizzle ORM:** https://orm.drizzle.team/
- **Playwright:** https://playwright.dev/

---

## 🎯 Current Session Goals

**Main Focus:** Universal Job Scraping - Analiza Stron

**Tasks:**
1. ✅ Stworzyć dokumentację projektu (ten plik)
2. ⏳ Przeanalizować LinkedIn (cookies, buttons, selectors)
3. ⏳ Przeanalizować Pracuj.pl
4. ⏳ Przeanalizować NoFluffJobs
5. ⏳ Przeanalizować JustJoinIt
6. TODO: Stworzyć mapę selektorów dla każdej strony
7. TODO: Rozpocząć implementację Playwright

**Expected Output:**
- Dokument z analizą każdej strony (selektory, cookies, akcje)
- Mapa strategii dla każdego źródła
- Gotowość do implementacji

---

## 📝 Notes for Next Session

- Rozpocznij od sprawdzenia tego pliku (.claude/CONTEXT.md)
- Kontynuuj analizę stron (sekcja FAZA 1)
- Update progress w TODO list
- Po zakończeniu analizy - przejdź do FAZA 2 (implementacja)

**Status:** 🟡 Analiza w trakcie
**Next Step:** Analiza struktury LinkedIn incognito
