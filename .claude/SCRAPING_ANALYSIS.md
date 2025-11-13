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

**Status:** ✅ ANALYZED
**Example URL:** https://www.pracuj.pl/praca/specjalista-ds-ochrony-srodowiska-wroclaw-curie-sklodowskiej-55,oferta,1004476116
**Date Analyzed:** 2025-01-13

### 2.1 Cookies & Consent

**Cookie Banner:**
- ✅ Appears on first visit
- **Title:** "Cenimy Twoją prywatność"
- **Content:** Long privacy notice about cookies and partners
- **Buttons:**
  - "Akceptuj wszystkie" (Accept all cookies)
  - "Dostosuj" (Customize)
- **Selector Strategy:**
  - Button: `[data-test="button-submitCookie"]`
  - Playwright: `page.locator('[data-test="button-submitCookie"]').click()`
- **Action Required:** Click "Akceptuj wszystkie" to dismiss
- **Links:**
  - "Lista partnerów cookies"
  - "Polityka Cookies"

### 2.2 Modals & Popups

**Application Dialog:**
- ⚠️ Hidden by default, appears on "Aplikuj" click
- Not blocking initial page load
- **Action Required:** NONE for scraping (only for applying)

**Similar Offers Dialog:**
- ⚠️ Hidden by default
- **Action Required:** NONE for scraping

🎉 **GREAT NEWS:** Unlike LinkedIn, Pracuj.pl has NO blocking modals!
**Order:** Just close cookie banner → extract data

### 2.3 Content Loading

**Job Description:**
- ✅ Loads immediately - NO "Show more" click needed!
- Full description visible in DOM on page load
- All sections fully expanded by default
- **Action Required:** NONE - just extract from DOM

**Lazy Loading:**
- ❌ NO lazy loading for main content
- ✅ "Pokaż więcej" button exists but is for similar job offers (sidebar)
- Main job posting is fully loaded

### 2.4 CSS Selectors & Data Structure

```yaml
Job Title:
  - Selector: h1
  - Example: "Specjalista ds. Ochrony Środowiska"
  - Clean, simple heading

Company Name:
  - Selector: h2 (contains "O firmie" link)
  - Example: "Ekologis Laboratorium Badań Środowiskowych S.C"
  - Text before "O firmie" link
  - Also in JSON-LD: hiringOrganization

Company Logo:
  - Selector: img[alt="{Company Name}"]
  - URL: https://logos.gpcdn.pl/loga-firm/...
  - Also in JSON-LD: image

Location:
  - Selector: a[href*="map"] or look for address
  - Example: "Curie-Skłodowskiej 55, Śródmieście, Wrocław(dolnośląskie)"
  - Also in JSON-LD: jobLocation with full address

Posted Date:
  - Selector: Look for "ważna jeszcze" or "Nowość" badge
  - JSON-LD: datePosted (ISO format: "2025-11-13T08:50:00.283Z")
  - JSON-LD: validThrough (expiry date)

Employment Details (Metadata):
  - Location: With map icon
  - Contract type: "umowa o pracę" (also in JSON-LD: employmentType)
  - Working hours: "pełny etat"
  - Seniority: "specjalista (Mid / Regular)"
  - Work mode: "praca stacjonarna"
  - Start: "Praca od zaraz"

Job Sections:
  - Responsibilities:
    - data-test: "section-responsibilities"
    - Heading: "Twój zakres obowiązków"
    - Format: List with bullet points
    - Also in JSON-LD: responsibilities

  - Requirements:
    - data-test: "section-requirements"
    - Heading: "Nasze wymagania"
    - Format: List with bullet points
    - Also in JSON-LD: experienceRequirements

  - Offered:
    - data-test: "section-offered"
    - Heading: "To oferujemy"
    - Format: List with bullet points

  - Benefits:
    - data-test: "sections-benefit"
    - Heading: "Benefity"
    - Format: List with icons
    - Example: "dofinansowanie zajęć sportowych", "spotkania integracyjne"
    - Also in JSON-LD: jobBenefits

Breadcrumb/Tags:
  - Location tag: Links to city jobs
  - Category tag: "BHP / Ochrona środowiska"
  - Subcategory: "Inżynieria"
  - Also in JSON-LD: industry
```

### 2.5 Alternative Data Sources

**JSON-LD Structured Data:** ✅ BEST OPTION!
- **Highly Recommended:** Use this for primary extraction!
- Selector: `script[type="application/ld+json"]` or `[data-test="job-schema-org"]`
- Schema: http://schema.org JobPosting
- **Complete data includes:**
  - `@type`: "JobPosting"
  - `title`: Job title
  - `hiringOrganization`: Company name
  - `datePosted`: ISO date (2025-11-13T08:50:00.283Z)
  - `validThrough`: Expiry date (2025-12-13T22:59:59Z)
  - `employmentType`: "umowa o pracę"
  - `jobLocation`: Full address with geo coordinates
  - `responsibilities`: Comma-separated list
  - `experienceRequirements`: Comma-separated list
  - `jobBenefits`: Comma-separated list
  - `industry`: Categories
  - `baseSalary`: null (if not provided)
  - `image`: Company logo URL

**Data Attributes:**
- ✅ Extensive use of `data-test` attributes
- Very scraping-friendly!
- Examples:
  - `data-test="section-responsibilities"`
  - `data-test="section-requirements"`
  - `data-test="section-offered"`
  - `data-test="sections-benefit"`
  - `data-test="button-submitCookie"`

### 2.6 Dynamic Content

**JavaScript Rendering:**
- ✅ React/SPA application (similar to LinkedIn)
- Content loads after JavaScript executes
- **Wait Strategy:**
  - `page.waitForSelector('h1')` for job title
  - or `page.waitForLoadState('networkidle')`
  - or `page.waitForSelector('[data-test="job-schema-org"]')` for JSON-LD

**Lazy Loading:**
- ❌ Main content NOT lazy loaded
- ✅ Immediately available in DOM

### 2.7 Anti-Scraping Measures

**Bot Detection:**
- ⚠️ May use bot detection (not confirmed)
- Less aggressive than LinkedIn
- **Mitigation:**
  - Use real User-Agent
  - Enable JavaScript
  - Headless: use `headless: true` but with real viewport
  - Add delays between requests

**Rate Limiting:**
- ⚠️ Unknown rate limits
- **Recommended:** Max 10-20 requests/hour
- Add delays between requests (2-5 seconds)

**Login Requirements:**
- ✅ Can view jobs WITHOUT login
- Some features require account (Apply, Save, etc.)
- For scraping: NO LOGIN NEEDED

### 2.8 Scraping Strategy

**Recommended Approach (JSON-LD Priority):**

```typescript
async function scrapePracujJob(jobId: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  try {
    // 1. Navigate
    await page.goto(`https://www.pracuj.pl/praca/{slug},oferta,${jobId}`, {
      waitUntil: 'networkidle'
    });

    // 2. Close cookie banner
    try {
      await page.locator('[data-test="button-submitCookie"]').click({ timeout: 2000 });
    } catch {}

    // 3. Wait for JSON-LD to load
    await page.waitForSelector('[data-test="job-schema-org"]');

    // 4. Extract JSON-LD (PRIMARY METHOD)
    const jsonLdData = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]');
      return script ? JSON.parse(script.textContent) : null;
    });

    if (jsonLdData) {
      // Use structured data directly!
      return {
        title: jsonLdData.title,
        company: jsonLdData.hiringOrganization,
        location: jsonLdData.jobLocation?.address,
        datePosted: jsonLdData.datePosted,
        validThrough: jsonLdData.validThrough,
        employmentType: jsonLdData.employmentType,
        responsibilities: jsonLdData.responsibilities?.split(', '),
        requirements: jsonLdData.experienceRequirements?.split(', '),
        benefits: jsonLdData.jobBenefits?.split(', '),
        salary: jsonLdData.baseSalary,
        logo: jsonLdData.image,
        // ... all fields available!
      };
    }

    // 5. Fallback: Extract from HTML (if JSON-LD fails)
    const jobData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent;
      const company = document.querySelector('h2')?.textContent?.replace('O firmie', '')?.trim();
      const responsibilities = document.querySelector('[data-test="section-responsibilities"]')?.textContent;
      const requirements = document.querySelector('[data-test="section-requirements"]')?.textContent;
      const offered = document.querySelector('[data-test="section-offered"]')?.textContent;

      return { title, company, responsibilities, requirements, offered };
    });

    return jobData;
  } finally {
    await browser.close();
  }
}
```

### 2.9 Example Selectors (Playwright)

```typescript
// JSON-LD (BEST!)
const jsonLd = await page.locator('[data-test="job-schema-org"]').textContent();
const data = JSON.parse(jsonLd);

// HTML Fallback
await page.locator('h1').textContent(); // Title
await page.locator('h2').first().textContent(); // Company
await page.locator('[data-test="section-responsibilities"]').textContent();
await page.locator('[data-test="section-requirements"]').textContent();
await page.locator('[data-test="section-offered"]').textContent();
await page.locator('[data-test="sections-benefit"]').textContent();
```

### 2.10 Notes & Observations

✅ **Pros:**
- ⭐ **Excellent JSON-LD structured data** - use this!
- No login required
- No blocking modals (unlike LinkedIn!)
- Full description visible immediately
- Extensive use of `data-test` attributes
- Clean, semantic HTML structure
- All data available in one format

⚠️ **Cons:**
- React SPA = requires JS rendering
- Polish language interface (need i18n handling)
- May have bot detection (unknown severity)

🔥 **Critical:**
- ✅ **ALWAYS try JSON-LD first** - it has everything!
- Close cookie banner before extraction
- Wait for `networkidle` or JSON-LD element
- DO NOT scrape too fast (risk of ban)

🎯 **Best Practice:**
- Primary: Extract from JSON-LD (fastest, most reliable)
- Fallback: Extract from HTML with data-test attributes
- Last resort: AI-based extraction from raw HTML

---

## 🟢 4. RocketJobs.pl

**Status:** ⏳ TODO
**Example URL:** https://rocketjobs.pl/oferta-pracy/znanylekarz-specjalist-ka-ds-sprzedazy-ai-warszawa-sales-it-i-telekomunikacja
**Date Analyzed:** Not yet

*Note: We already have RocketJobs in our database, but good to analyze for scraping fallback*

---

## 🟢 3. NoFluffJobs

**Status:** ✅ ANALYZED
**Example URL:** https://nofluffjobs.com/pl/job/senior-ai-agent-engineer-zendesk-krakow-ntobgkrh
**Date Analyzed:** 2025-01-13

### 3.1 Cookies & Consent

**Cookie Banner:**
- ✅ Appears on first visit (Usercentrics CMP)
- **Title:** "Pozwól na cookies i podobne technologie"
- **Content:** Detailed privacy notice with partner links
- **Buttons:**
  - "Akceptuj wszystkie" (Accept all cookies)
  - "Zapisz ustawienia" (Save settings)
  - "Ustawienia plików cookie" (Cookie settings link)
- **Switches:** 4 toggle switches:
  - Ściśle niezbędne (strictly necessary) - disabled/checked
  - Personalizacja i wydajność
  - Funkcjonalność
  - Dostosowanie reklam
- **Selector Strategy:**
  - Button: `button` with text "Akceptuj wszystkie"
  - Playwright: `page.getByRole('button', { name: 'Akceptuj wszystkie' }).click()`
- **Action Required:** Click "Akceptuj wszystkie" to dismiss

### 3.2 Modals & Popups

**Account Creation Popup:**
- ⚠️ May appear after scrolling (complementary banner)
- **Content:** "Załóż konto i zgarnij dodatkowe korzyści!"
- **Buttons:** "Załóż konto", "Zaloguj się"
- **Action Required:** Can be ignored for scraping

**Login Prompts:**
- ⚠️ Some features may prompt for login (save, apply)
- NO blocking modals for viewing content
- **Action Required:** NONE for scraping

🎉 **GOOD NEWS:** Content is fully accessible without login!

### 3.3 Content Loading

**Job Description:**
- ✅ Loads immediately - full content visible
- May have "pokaż wszystko" (show all) expandable sections for long lists
- **Action Required:** May need to click "pokaż wszystko" buttons to expand full content

**Lazy Loading:**
- ❌ Main content NOT lazy loaded
- ✅ Description sections may be partially collapsed
- Look for "pokaż wszystko (X)" buttons to expand

### 3.4 CSS Selectors & Data Structure

```yaml
Job Title:
  - Selector: h1
  - Example: "Senior AI Agent Engineer"
  - Located in: article > generic > generic > heading

Company Name:
  - Selector: article img[alt*="logo"] + generic
  - Example: "Zendesk"
  - Or: Look for text after company logo

Company Logo:
  - Selector: img[alt="job offer company logo"]
  - Or: img in article header

Salary:
  - Selector: h4
  - Example: "28 500 – 36 000 PLN"
  - Additional text: "brutto miesięcznie (UoP)"
  - May have "Sprawdź wynagrodzenie" instead of actual number

Location:
  - Selector: listitem containing location icon/text
  - Example: "Kraków", "Hybrydowo", "Zdalnie"
  - Format: May show multiple locations with "+1", "+2" indicator
  - Full location list in expandable: generic > paragraph "Lokalizacje:" + list

Seniority:
  - Selector: listitem with level text
  - Example: "Senior", "Mid", "Junior"

Work Mode:
  - Selector: listitem with work mode
  - Example: "Hybrydowo", "Zdalnie", "Stacjonarnie"

Posted/Valid Date:
  - Selector: listitem with calendar icon
  - Example: "Oferta ważna do: 27.11.2025 (zostało 14 dni)"

Category/Tech Stack:
  - Selector: listitem > generic > link
  - Example: "AI", "Python"
  - Multiple categories separated by commas

Required Skills (Obowiązkowe):
  - Section heading: h2 with text "Obowiązkowe"
  - Selector: Following list > listitem
  - Example: "AI", "Redis", "React", "Python", "FastAPI"

Nice-to-Have Skills (Mile widziane):
  - Section heading: h2 with text "Mile widziane"
  - Selector: Following list > listitem
  - Example: "Machine learning", "NLP"

Job Description Sections:
  - "Opis wymagań" (h2) - Requirements description
  - "Opis oferty" (h2) - Job offer description
  - "Zakres obowiązków" (h2) - Responsibilities
  - "Szczegóły oferty" (h2) - Offer details
  - "Kroki w procesie rekrutacyjnym" (h2) - Recruitment steps

Translation Buttons:
  - Some content has "Pokaż tłumaczenie" buttons
  - Indicates original is in English/other language
  - No need to click for scraping (get original text)

Expandable Content:
  - Look for: generic with text "pokaż wszystko (X)"
  - Indicates hidden list items
  - May need to click to see full content
```

### 3.5 Alternative Data Sources

**JSON-LD Structured Data:** ❌ NOT AVAILABLE
- NoFluffJobs does NOT use JSON-LD
- Must scrape from HTML

**Data Attributes:**
- ❌ Limited use of semantic attributes
- Angular app with generic class names
- NO `data-test` attributes like Pracuj.pl
- Must rely on HTML structure and headings

**API Endpoints:**
- ⚠️ May have internal API (Angular app)
- TODO: Investigate network calls for JSON endpoints
- Could be more reliable than HTML scraping

### 3.6 Dynamic Content

**JavaScript Rendering:**
- ✅ Full Angular SPA application
- Content loads after JavaScript executes
- **Wait Strategy:**
  - `page.waitForSelector('h1')` for job title
  - or `page.waitForLoadState('networkidle')`
  - or `page.waitForSelector('article')` for main content

**Lazy Loading:**
- ⚠️ Some sections may be collapsed
- Click "pokaż wszystko" to expand
- Use: `page.click('text=pokaż wszystko')` if needed

### 3.7 Anti-Scraping Measures

**Bot Detection:**
- ⚠️ Uses Usercentrics CMP
- Facebook Pixel tracking present
- **Mitigation:**
  - Use real User-Agent
  - Enable JavaScript
  - Accept cookies
  - Add delays between requests

**Rate Limiting:**
- ⚠️ Unknown rate limits
- **Recommended:** Max 10-20 requests/hour
- Add delays between requests (3-5 seconds)

**Login Requirements:**
- ✅ Can view jobs WITHOUT login
- Some features require account (Apply, Save, CV Analysis)
- For scraping: NO LOGIN NEEDED

### 3.8 Scraping Strategy

**Recommended Approach:**

```typescript
async function scrapeNoFluffJobsJob(jobSlug: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  try {
    // 1. Navigate
    await page.goto(`https://nofluffjobs.com/pl/job/${jobSlug}`, {
      waitUntil: 'networkidle'
    });

    // 2. Close cookie banner
    try {
      await page.getByRole('button', { name: 'Akceptuj wszystkie' }).click({ timeout: 2000 });
    } catch {}

    // 3. Wait for main content
    await page.waitForSelector('article h1');

    // 4. Expand hidden content (if any)
    try {
      const showAllButtons = await page.locator('text=pokaż wszystko').all();
      for (const button of showAllButtons) {
        await button.click({ timeout: 1000 });
      }
    } catch {}

    // 5. Extract data from HTML
    const jobData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const salary = document.querySelector('h4')?.textContent?.trim();

      // Company - tricky to find
      const companyGeneric = document.querySelector('article img[alt*="logo"] ~ generic');
      const company = companyGeneric?.textContent?.trim();

      // Required skills
      const requiredH2 = Array.from(document.querySelectorAll('h2')).find(h =>
        h.textContent?.includes('Obowiązkowe')
      );
      const requiredList = requiredH2?.parentElement?.querySelectorAll('li');
      const required = Array.from(requiredList || []).map(li => li.textContent?.trim());

      // Nice-to-have skills
      const niceH2 = Array.from(document.querySelectorAll('h2')).find(h =>
        h.textContent?.includes('Mile widziane')
      );
      const niceList = niceH2?.parentElement?.querySelectorAll('li');
      const niceToHave = Array.from(niceList || []).map(li => li.textContent?.trim());

      // Description sections
      const sections = {};
      const sectionHeadings = Array.from(document.querySelectorAll('h2'));
      sectionHeadings.forEach(h2 => {
        const title = h2.textContent?.trim();
        const content = h2.parentElement?.textContent?.replace(title, '').trim();
        sections[title] = content;
      });

      return {
        title,
        company,
        salary,
        required,
        niceToHave,
        sections
      };
    });

    return jobData;
  } finally {
    await browser.close();
  }
}
```

### 3.9 Example Selectors (Playwright)

```typescript
// Job Title
await page.locator('h1').textContent();

// Salary
await page.locator('h4').textContent();

// Company (may need refinement)
await page.locator('article').first().textContent();

// Required skills
const required = await page.locator('h2:has-text("Obowiązkowe") + * li').allTextContents();

// Nice-to-have
const niceToHave = await page.locator('h2:has-text("Mile widziane") + * li').allTextContents();

// All sections
const sections = await page.locator('article h2').allTextContents();
```

### 3.10 Notes & Observations

✅ **Pros:**
- No login required
- Full description visible after expanding
- Clean section structure with h2 headings
- Salary information usually visible
- Rich skill categorization (required vs nice-to-have)

⚠️ **Cons:**
- ❌ NO JSON-LD (unlike Pracuj.pl)
- Angular SPA = requires JS rendering
- Limited semantic attributes
- Some content may be collapsed (need to expand)
- Company name selector not straightforward
- Polish/English mixed content
- Bot detection possible

🔥 **Critical:**
- NO JSON-LD available - must parse HTML
- MUST close cookie banner first
- May need to click "pokaż wszystko" to expand content
- Wait for networkidle or article element
- DO NOT scrape too fast (risk of ban)

🎯 **Best Practice:**
- Primary: Extract from HTML structure using h2 headings
- Fallback: AI-based extraction from raw HTML
- Consider: Investigate internal API endpoints for cleaner data

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

| Site | Cookies | Login Dialog | Show More | JS Required | Anti-Bot | JSON-LD |
|------|---------|--------------|-----------|-------------|----------|---------|
| LinkedIn | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ⚠️ Maybe | ❌ No |
| Pracuj.pl | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ⚠️ Maybe | ⭐ YES! |
| NoFluffJobs | ✅ Yes | ❌ No | ⚠️ Maybe | ✅ Yes | ⚠️ Maybe | ❌ No |
| RocketJobs | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |
| JustJoinIT | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |
| BulldogJob | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

---

## 🎯 Next Steps

1. ✅ Analyze LinkedIn structure
2. ✅ Analyze Pracuj.pl structure
3. ✅ Analyze NoFluffJobs structure
4. ⏳ Analyze JustJoinIt structure (recommended next)
5. ⏳ Analyze RocketJobs structure (optional - we have API)
6. ⏳ Analyze BulldogJob structure (optional)
7. TODO: Create unified selector map
8. TODO: Implement Playwright scrapers for each site
9. TODO: Implement AI fallback extractor
10. TODO: Test on real job postings
11. TODO: Add rate limiting and retry logic

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
