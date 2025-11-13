# Universal Job Scraping - Implementation Plan

## 🎯 Goal
Enable users to generate CV from ANY job posting URL, not just LinkedIn/RocketJobs API.

## 🏗️ Architecture

```
User Input (URL or Text)
    ↓
Source Detection
    ↓
Scraping Strategy:
    ├─ API (LinkedIn/RocketJobs) - if available
    ├─ Playwright Scraping - for other sites
    └─ Manual Text - fallback
    ↓
AI Data Extraction (Gemini)
    ↓
Resume Generation
```

## 📦 Phase 1: Setup Playwright (Day 1-2)

### 1.1 Install Dependencies
```bash
pnpm add playwright
pnpm add -D @playwright/test
npx playwright install chromium
```

### 1.2 Create Scraper Service
- [ ] `src/lib/scraper/playwright-scraper.ts`
- [ ] `src/lib/scraper/source-detector.ts`
- [ ] `src/lib/scraper/ai-extractor.ts`

### 1.3 Environment Setup
Add to `.env.example`:
```
# Playwright
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
```

## 📦 Phase 2: Source-Specific Scrapers (Day 3-4)

### 2.1 Supported Sites (Priority Order)
1. ✅ LinkedIn (existing API + scraping fallback)
2. ✅ RocketJobs (existing)
3. 🆕 Pracuj.pl
4. 🆕 NoFluffJobs
5. 🆕 JustJoinIt
6. 🆕 BulldogJob
7. 🆕 Indeed
8. 🆕 Generic (any site)

### 2.2 Create Site-Specific Selectors
```typescript
// src/lib/scraper/selectors.ts
export const SITE_SELECTORS = {
  'pracuj.pl': {
    title: '[data-test="text-offerTitle"]',
    company: '[data-test="text-employerName"]',
    description: '[data-test="section-description"]',
    location: '[data-test="text-region"]',
    salary: '[data-test="text-salaryRange"]',
  },
  'nofluffjobs.com': {
    title: '.posting-title__position',
    company: '.posting-title__company',
    description: '.posting-details__description',
    // ...
  },
  // ...
};
```

### 2.3 Smart Fallback Strategy
```typescript
async function scrapeJob(url: string) {
  const source = detectJobSource(url);

  // Try 1: API (fastest)
  if (source === 'linkedin' || source === 'rocketjobs') {
    try {
      return await fetchFromAPI(url, source);
    } catch (error) {
      // Fallback to scraping
    }
  }

  // Try 2: Selectors (reliable)
  try {
    return await scrapeWithSelectors(url, source);
  } catch (error) {
    // Fallback to AI
  }

  // Try 3: AI Extraction (universal)
  return await scrapeWithAI(url);
}
```

## 📦 Phase 3: AI Data Extraction (Day 5)

### 3.1 Create Universal Extractor
```typescript
// src/lib/scraper/ai-extractor.ts
export async function extractJobDataFromHTML(html: string, text: string) {
  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: jobDataSchema,
    prompt: `Extract job posting data from this content...`,
  });

  return object;
}
```

### 3.2 Validation & Confidence Score
```typescript
interface ExtractionResult {
  data: JobData;
  confidence: number; // 0-100
  missingFields: string[];
}

// If confidence < 70%, ask user to verify/edit
```

## 📦 Phase 4: Manual Text Input (Day 6)

### 4.1 Create tRPC Endpoint
```typescript
// src/server/api/routers/resume.ts
generateFromManualText: privateProcedure
  .input(z.object({
    jobText: z.string().min(100).max(50000),
    jobTitle: z.string().optional(),
    companyName: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    checkRateLimit(ctx.user.id, "AI_GENERATION");

    const jobData = await extractJobDataFromText(input.jobText);
    // ... generate CV
  });
```

### 4.2 UI Component
```tsx
// TextInputTab.tsx
<Textarea
  placeholder="Wklej pełny tekst oferty pracy..."
  minLength={100}
  rows={10}
/>
```

## 📦 Phase 5: Update UI (Day 7)

### 5.1 Unified Input Component
```tsx
// UniversalJobInput.tsx
<Tabs>
  <Tab value="url">Link do oferty</Tab>
  <Tab value="text">Wklej tekst</Tab>
</Tabs>

// Auto-detect source
<Input
  placeholder="https://pracuj.pl/... lub linkedin.com/jobs/..."
  onChange={detectAndShowSource}
/>

<Badge>{detectedSource}</Badge>
```

### 5.2 Progress Indicator
```tsx
<Steps>
  <Step status="current">Pobieranie oferty...</Step>
  <Step status="waiting">Analiza AI...</Step>
  <Step status="waiting">Generowanie CV...</Step>
</Steps>
```

## 📦 Phase 6: Testing & Optimization (Day 8-9)

### 6.1 Test Sites
- [ ] LinkedIn (incognito)
- [ ] Pracuj.pl
- [ ] NoFluffJobs
- [ ] JustJoinIt
- [ ] BulldogJob
- [ ] Indeed
- [ ] Random company career pages

### 6.2 Performance Optimization
- Cache scraped job data (24h)
- Queue system for scraping (avoid parallel overload)
- Timeout handling (30s max)
- Retry logic with exponential backoff

### 6.3 Error Handling
- URL validation
- Scraping failures → fallback to manual text
- Rate limit for scraping (20/hour)
- User-friendly error messages

## 📦 Phase 7: Production Deploy (Day 10)

### 7.1 Environment Setup
- Playwright on Vercel (serverless)
- Or separate scraping service (Railway/Render)

### 7.2 Monitoring
- Track scraping success rate per source
- Alert on high failure rate
- Log extraction confidence scores

### 7.3 Documentation
- Update README with supported sites
- Add examples for each source
- API documentation

## 🎯 Success Metrics

- ✅ Support 7+ job sites
- ✅ 80%+ extraction success rate
- ✅ <30s total time (scrape + generate)
- ✅ Fallback to manual text works 100%

## 🚀 Future Enhancements

1. Browser extension (one-click scrape)
2. Bulk scraping from search results
3. Job alerts with auto-CV generation
4. AI job matching based on LinkedIn profile
5. Cover letter generation for each job

## 📝 Technical Notes

### Playwright on Vercel
- Serverless functions have 10s timeout
- Solution: Use edge runtime or external service
- Alternative: Puppeteer (lighter)

### Rate Limiting
- Scraping: 20 jobs/hour/user
- AI extraction: included in AI_GENERATION limit (10/hour)

### Caching Strategy
```typescript
// Cache scraped job data
const jobCache = new Map<string, { data: JobData; expires: number }>();

// 24h cache
if (cached && cached.expires > Date.now()) {
  return cached.data;
}
```

### Security
- Validate URLs (whitelist domains or use URL parser)
- Sanitize HTML before AI extraction
- Rate limit scraping to prevent abuse
- No credentials stored for scraping

## 🔧 Dependencies

```json
{
  "playwright": "^1.48.0",
  "@playwright/test": "^1.48.0",
  "cheerio": "^1.0.0", // HTML parsing fallback
  "turndown": "^7.1.3" // HTML to Markdown
}
```

## 📚 Resources

- Playwright docs: https://playwright.dev/
- Scraping best practices
- AI extraction prompts library
- Site-specific selector mappings
