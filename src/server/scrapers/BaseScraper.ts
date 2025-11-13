// src/server/scrapers/BaseScraper.ts
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { JobScraper, ScraperConfig, ScrapedJob } from "./types";
import { DEFAULT_SCRAPER_CONFIG } from "./types";
import { logger } from "~/lib/logger";
import {
	waitForPageReady,
	closeCookieBanners,
	extractDomain,
	normalizeUrl,
} from "./utils";

/**
 * Base scraper class with common functionality
 */
export abstract class BaseScraper implements JobScraper {
	abstract readonly name: string;
	abstract readonly domain: string;

	protected config: ScraperConfig;
	protected browser: Browser | null = null;
	protected context: BrowserContext | null = null;

	constructor(config: Partial<ScraperConfig> = {}) {
		this.config = { ...DEFAULT_SCRAPER_CONFIG, ...config };
	}

	/**
	 * Initialize browser and context
	 */
	protected async init(): Promise<void> {
		if (this.browser) return;

		try {
			logger.info(`Initializing ${this.name} scraper`);

			this.browser = await chromium.launch({
				headless: this.config.headless,
			});

			this.context = await this.browser.newContext({
				userAgent: this.config.userAgent,
				viewport: { width: 1920, height: 1080 },
			});

			// Set cookies if provided
			if (this.config.cookies && this.config.cookies.length > 0) {
				await this.context.addCookies(this.config.cookies);
			}

			logger.debug(`${this.name} scraper initialized`);
		} catch (error) {
			logger.error(`Failed to initialize ${this.name} scraper`, error);
			throw error;
		}
	}

	/**
	 * Create a new page
	 */
	protected async createPage(): Promise<Page> {
		await this.init();

		if (!this.context) {
			throw new Error("Browser context not initialized");
		}

		const page = await this.context.newPage();

		// Set default timeout
		page.setDefaultTimeout(this.config.timeout || 30000);

		return page;
	}

	/**
	 * Navigate to URL and wait for page to be ready
	 */
	protected async navigateToUrl(page: Page, url: string): Promise<void> {
		logger.info(`Navigating to ${url}`);

		try {
			await page.goto(url, {
				waitUntil: this.config.waitForNetworkIdle ? "networkidle" : "domcontentloaded",
				timeout: this.config.timeout,
			});

			await waitForPageReady(page);

			// Try to close cookie banners
			await closeCookieBanners(page);

			logger.debug("Page loaded successfully", { url });
		} catch (error) {
			logger.error("Failed to navigate to URL", error, { url });
			throw error;
		}
	}

	/**
	 * Check if this scraper can handle the given URL
	 */
	canHandle(url: string): boolean {
		const domain = extractDomain(url);
		return domain === this.domain || domain.endsWith(`.${this.domain}`);
	}

	/**
	 * Scrape a job - must be implemented by subclasses
	 */
	abstract scrapeJob(url: string): Promise<ScrapedJob>;

	/**
	 * Cleanup resources
	 */
	async cleanup(): Promise<void> {
		logger.info(`Cleaning up ${this.name} scraper`);

		try {
			if (this.context) {
				await this.context.close();
				this.context = null;
			}

			if (this.browser) {
				await this.browser.close();
				this.browser = null;
			}

			logger.debug(`${this.name} scraper cleaned up`);
		} catch (error) {
			logger.error(`Failed to cleanup ${this.name} scraper`, error);
		}
	}
}
