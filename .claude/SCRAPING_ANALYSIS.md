# 🕷️ Web Scraping Analysis - Job Sites

> **Created:** 2025-01-13
> **Purpose:** Detailed analysis of job site structures for universal scraping implementation
> **Status:** In Progress

---

## 📋 Analysis Template

For each site, we document:
1. **Cookies & Consent** - Banners, buttons, how to handle
2. **Modals & Popups** - Login prompts, overlays to dismiss
3. **Content Loading** - Lazy loading, "Show more" buttons
4. **CSS Selectors** - Where to find each piece of data
5. **Dynamic Content** - React/Vue, JSON-LD, data attributes
6. **Anti-Scraping** - Bot detection, rate limits, restrictions

---

## 🔴 1. LinkedIn (Jobs)

**Status:** ✅ ANALYZED
**Example URL:** https://www.linkedin.com/jobs/view/4312761599/
**Date Analyzed:** 2025-01-13

### 1.1 Cookies & Consent

**Cookie Banner:**
- ✅ Appears on first visit
- **Title:** "LinkedIn szanuje Twoją prywatność"
- **Buttons:**
  - "Zaakceptuj" (Accept all cookies)
  - "Odrzuć" (Reject optional cookies)
- **Selector Strategy:**
  - Button text: `button` with text "Odrzuć"
  - Playwright: `page.getByRole('button', { name: 'Odrzuć' }).click()`
- **Action Required:** Click "Odrzuć" to dismiss

### 1.2 Modals & Popups

**Login Dialog:**
- ✅ Auto-appears after page load
- **Title:** "Zaloguj się, aby zobaczyć, kogo już znasz w Performance Group"
- **Close Button:**
  - Button with name "Odrzuć" (same as cookie button!)
  - Appears before cookie banner in DOM
- **Action Required:** Click close button first, THEN cookie banner
- **Selector:**
  - Playwright: `page.getByRole('button', { name: 'Odrzuć' }).click()`

**🔥 IMPORTANT:** Dialog blocks cookie banner!
**Order:** Close Dialog → Close Cookies

### 1.3 Content Loading

**Job Description:**
- ✅ Loads immediately - NO "Show more" click needed!
- Full description visible in DOM
- "Show more" button present but doesn't hide content
- **Action Required:** NONE - just extract from DOM

### 1.4 CSS Selectors & Data Structure

```yaml
Job Title:
  - Selector: heading[level=1]
  - Example: "Digital Strategist"
  - Accessibility: role="heading", level=1

Company Name:
  - Selector: heading[level=4] > link
  - Example: "Performance Group"
  - Direct link to company page
  - URL pattern: /company/{slug}

Location:
  - Selector: heading[level=4] > text after link
  - Example: "· Warszawa i okolice"
  - Format: "· {location}"

Posted Date:
  - Selector: heading[level=4] > generic > text
  - Example: "1 miesiąc temu"
  - Polish text: "X dni/tygodni/miesięcy temu"

Applicant Count:
  - Selector: same heading[level=4]
  - Example: "50 kandydatów"
  - Format: "{number} kandydatów/kandydat"

Job Description:
  - Container: generic[ref varies] > generic > paragraphs & lists
  - Structure:
    - paragraph: Plain text sections
    - list > listitem: Bullet points
    - strong: Bold/emphasized text
  - Content includes:
    - Company description
    - Responsibilities (Twoje zadania)
    - Requirements (Nasze wymagania)
    - Nice-to-have (Mile widziane)
    - Benefits (Co oferujemy)
    - Recruitment process (Jak wygląda proces)

Metadata (Sidebar):
  - Container: list with metadata items
  - Items:
    - "Poziom w hierarchii": Seniority level
    - "Forma zatrudnienia": Employment type
    - "Funkcja": Job function/category
    - "Branże": Industries
  - Structure: heading[level=3] + text

Company Logo:
  - Selector: img with alt="{Company Name}"
  - Usually at top of job posting
```

### 1.5 Alternative Data Sources

**JSON-LD Structured Data:**
- ❌ NOT checked yet - may contain structured job posting data
- TODO: Investigate `<script type="application/ld+json">`

**Data Attributes:**
- ❌ NOT checked yet
- TODO: Check for data-* attributes with job info

### 1.6 Dynamic Content

**JavaScript Rendering:**
- ✅ Full React/SPA application
- Content loads after page navigation
- **Wait Strategy:**
  - `page.waitForSelector('heading[level=1]')` for job title
  - or `page.waitForLoadState('networkidle')`

**Lazy Loading:**
- ❌ Description NOT lazy loaded
- "Show more" is cosmetic only

### 1.7 Anti-Scraping Measures

**Bot Detection:**
- ⚠️ May use bot detection (not confirmed)
- Uses Cadmus anti-bot scripts (visible in console)
- **Mitigation:**
  - Use real User-Agent
  - Enable JavaScript
  - Headless: use `headless: true` but with real viewport
  - Don't scrape too fast

**Rate Limiting:**
- ⚠️ Unknown rate limits
- **Recommended:** Max 10-20 requests/hour
- Add delays between requests (2-5 seconds)

**Login Requirements:**
- ✅ Can view jobs WITHOUT login
- Some features require account (Apply, Save, etc.)
- For scraping: NO LOGIN NEEDED

### 1.8 Scraping Strategy

**Recommended Approach:**

```typescript
async function scrapeLinkedInJob(jobId: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  try {
    // 1. Navigate
    await page.goto(`https://www.linkedin.com/jobs/view/${jobId}/`, {
      waitUntil: 'networkidle'
    });

    // 2. Close login dialog (if exists)
    try {
      await page.getByRole('button', { name: 'Odrzuć' }).click({ timeout: 2000 });
    } catch {}

    // 3. Close cookie banner
    try {
      await page.getByRole('button', { name: 'Odrzuć' }).click({ timeout: 2000 });
    } catch {}

    // 4. Wait for job title
    await page.waitForSelector('h1');

    // 5. Extract data
    const jobData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent;
      const company = document.querySelector('h4 a')?.textContent;
      // ... more extraction

      return {
        title,
        company,
        // ... more fields
      };
    });

    return jobData;
  } finally {
    await browser.close();
  }
}
```

### 1.9 Example Selectors (Playwright)

```typescript
// Job Title
await page.locator('h1').textContent();

// Company
await page.locator('h4 a').first().textContent();

// Description
await page.locator('article').textContent();
// or
await page.evaluate(() => document.body.innerText);

// Metadata
const metadata = await page.locator('ul li').allTextContents();
```

### 1.10 Notes & Observations

✅ **Pros:**
- No login required
- Full description visible immediately
- Clean HTML structure
- Accessible markup (ARIA roles)

⚠️ **Cons:**
- Anti-bot scripts present (Cadmus)
- Modal popups block content initially
- React SPA = requires JS rendering
- Polish language interface (need i18n handling)

🔥 **Critical:**
- MUST close dialogs in correct order: Dialog → Cookies
- MUST wait for networkidle or job title element
- DO NOT scrape too fast (risk of ban)

---

## 🟡 2. Pracuj.pl

**Status:** ⏳ TODO
**Example URL:** https://www.pracuj.pl/praca/specjalista-ds-ochrony-srodowiska-wroclaw-curie-sklodowskiej-55,oferta,1004476116
**Date Analyzed:** Not yet

### 2.1 Cookies & Consent

TODO: Analyze

### 2.2 Modals & Popups

TODO: Analyze

### 2.3 Content Loading

TODO: Analyze

### 2.4 CSS Selectors & Data Structure

TODO: Map all selectors

---

## 🟢 3. RocketJobs.pl

**Status:** ⏳ TODO
**Example URL:** https://rocketjobs.pl/oferta-pracy/znanylekarz-specjalist-ka-ds-sprzedazy-ai-warszawa-sales-it-i-telekomunikacja
**Date Analyzed:** Not yet

*Note: We already have RocketJobs in our database, but good to analyze for scraping fallback*

---

## 🟢 4. NoFluffJobs

**Status:** ⏳ TODO
**Example URL:** TBD
**Date Analyzed:** Not yet

---

## 🟢 5. JustJoinIT

**Status:** ⏳ TODO
**Example URL:** TBD
**Date Analyzed:** Not yet

---

## 🟢 6. BulldogJob

**Status:** ⏳ TODO
**Example URL:** TBD
**Date Analyzed:** Not yet

---

## 📊 Summary Comparison

| Site | Cookies | Login Dialog | Show More | JS Required | Anti-Bot |
|------|---------|--------------|-----------|-------------|----------|
| LinkedIn | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ⚠️ Maybe |
| Pracuj.pl | ❓ | ❓ | ❓ | ❓ | ❓ |
| RocketJobs | ❓ | ❓ | ❓ | ❓ | ❓ |
| NoFluffJobs | ❓ | ❓ | ❓ | ❓ | ❓ |
| JustJoinIT | ❓ | ❓ | ❓ | ❓ | ❓ |
| BulldogJob | ❓ | ❓ | ❓ | ❓ | ❓ |

---

## 🎯 Next Steps

1. ✅ Analyze LinkedIn structure
2. ⏳ Analyze Pracuj.pl structure
3. ⏳ Analyze NoFluffJobs structure
4. ⏳ Analyze JustJoinIt structure
5. TODO: Create unified selector map
6. TODO: Implement Playwright scrapers
7. TODO: Implement AI fallback extractor
8. TODO: Test on real job postings

---

## 💡 General Findings & Patterns

### Common Elements Across Sites:
- Job title (h1 or similar)
- Company name (link or text)
- Location
- Posted date/time
- Description (rich text with lists)
- Requirements list
- Benefits/perks
- Employment type
- Seniority level

### Common Challenges:
1. **Cookie Banners** - Every site has them
2. **Login Prompts** - Many sites push for account creation
3. **Dynamic Loading** - Most modern sites use React/Vue
4. **Anti-Scraping** - Various levels of protection
5. **Internationalization** - Polish vs English content

### Best Practices:
- Always close modals BEFORE extracting data
- Wait for content to load (networkidle or specific elements)
- Use realistic browser settings (viewport, UA)
- Add delays between requests
- Have fallback extraction strategies
- Sanitize HTML before AI extraction
