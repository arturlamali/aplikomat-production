// src/server/scrapers/ScraperService.ts
import { ScraperFactory } from "./ScraperFactory";
import type { ScrapedJob, ScraperConfig } from "./types";
import { logger } from "~/lib/logger";
import { normalizeUrl } from "./utils";
import { aiUniversalScraper } from "./AiUniversalScraper";

export type ScraperMethod = "ai" | "portal-specific" | "auto";

export interface ScrapeOptions {
	skipCache?: boolean;
	method?: ScraperMethod;
	aiModel?: string;
}

/**
 * Service for managing job scraping operations
 *
 * Smart hybrid approach:
 * 1. Try AI Universal Scraper first (works on ANY site, ~$0.0006/job)
 * 2. Fallback to portal-specific scraper if AI fails
 */
export class ScraperService {
	private config: Partial<ScraperConfig>;
	private cache: Map<string, { data: ScrapedJob; timestamp: number }> = new Map();
	private readonly CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

	constructor(config: Partial<ScraperConfig> = {}) {
		this.config = config;
	}

	/**
	 * Scrape a job from the given URL with smart fallback
	 */
	async scrapeJob(url: string, options?: ScrapeOptions): Promise<ScrapedJob> {
		const normalizedUrl = normalizeUrl(url);

		// Check cache first
		if (!options?.skipCache) {
			const cached = this.getCached(normalizedUrl);
			if (cached) {
				logger.info("Returning cached job data", { url: normalizedUrl });
				return cached;
			}
		}

		const method = options?.method || "auto";

		logger.info("Scraping job from URL", { url: normalizedUrl, method });

		// Determine scraping strategy
		if (method === "ai") {
			return await this.scrapeWithAI(normalizedUrl, options?.aiModel);
		}

		if (method === "portal-specific") {
			return await this.scrapeWithPortalSpecific(normalizedUrl);
		}

		// Auto mode: Try AI first, fallback to portal-specific
		try {
			logger.debug("Trying AI Universal Scraper first");
			return await this.scrapeWithAI(normalizedUrl, options?.aiModel);
		} catch (aiError) {
			logger.warn("AI scraper failed, trying portal-specific fallback", {
				error: aiError,
			});

			// Fallback to portal-specific if available
			if (ScraperFactory.hasScraper(normalizedUrl)) {
				return await this.scrapeWithPortalSpecific(normalizedUrl);
			}

			// No fallback available
			throw aiError;
		}
	}

	/**
	 * Scrape using AI Universal Scraper
	 */
	private async scrapeWithAI(url: string, model?: string): Promise<ScrapedJob> {
		try {
			const jobData = await aiUniversalScraper.scrapeJob(url, { model });

			// Cache the result
			this.setCached(url, jobData);

			logger.info("AI scraper succeeded", {
				url,
				title: jobData.title,
				company: jobData.companyName,
			});

			return jobData;
		} catch (error) {
			logger.error("AI scraper failed", error, { url });
			throw error;
		}
	}

	/**
	 * Scrape using portal-specific scraper
	 */
	private async scrapeWithPortalSpecific(url: string): Promise<ScrapedJob> {
		const scraper = ScraperFactory.getScraper(url, this.config);

		if (!scraper) {
			throw new Error(`No portal-specific scraper available for URL: ${url}`);
		}

		try {
			const jobData = await scraper.scrapeJob(url);

			// Cache the result
			this.setCached(url, jobData);

			logger.info("Portal-specific scraper succeeded", {
				url,
				title: jobData.title,
				company: jobData.companyName,
			});

			return jobData;
		} finally {
			// Always cleanup scraper resources
			await scraper.cleanup();
		}
	}

	/**
	 * Check if a URL can be scraped
	 * (Always true now - AI can handle any URL)
	 */
	canScrape(_url: string): boolean {
		return true;
	}

	/**
	 * Check if a portal-specific scraper exists for this URL
	 */
	hasPortalSpecificScraper(url: string): boolean {
		return ScraperFactory.hasScraper(url);
	}

	/**
	 * Get list of supported domains
	 */
	getSupportedDomains(): string[] {
		return ScraperFactory.getSupportedDomains();
	}

	/**
	 * Get cached job data
	 */
	private getCached(url: string): ScrapedJob | null {
		const cached = this.cache.get(url);

		if (!cached) return null;

		// Check if cache is still valid
		const now = Date.now();
		if (now - cached.timestamp > this.CACHE_TTL) {
			this.cache.delete(url);
			return null;
		}

		return cached.data;
	}

	/**
	 * Set cached job data
	 */
	private setCached(url: string, data: ScrapedJob): void {
		this.cache.set(url, {
			data,
			timestamp: Date.now(),
		});
	}

	/**
	 * Clear cache
	 */
	clearCache(): void {
		this.cache.clear();
		logger.info("Scraper cache cleared");
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; urls: string[] } {
		return {
			size: this.cache.size,
			urls: Array.from(this.cache.keys()),
		};
	}
}

// Export singleton instance
export const scraperService = new ScraperService({
	headless: true,
	timeout: 30000,
});
