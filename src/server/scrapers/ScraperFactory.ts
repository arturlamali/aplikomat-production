// src/server/scrapers/ScraperFactory.ts
import type { JobScraper, ScraperConfig } from "./types";
import { PracujPlScraper } from "./PracujPlScraper";
import { JustJoinItScraper } from "./JustJoinItScraper";
import { RocketJobsScraper } from "./RocketJobsScraper";
import { logger } from "~/lib/logger";
import { extractDomain } from "./utils";

/**
 * Factory for creating appropriate scraper based on URL
 */
export class ScraperFactory {
	private static scrapers: Map<string, new (config?: Partial<ScraperConfig>) => JobScraper> =
		new Map([
			["pracuj.pl", PracujPlScraper],
			["justjoin.it", JustJoinItScraper],
			["rocketjobs.pl", RocketJobsScraper],
		]);

	/**
	 * Get scraper for a given URL
	 */
	static getScraper(url: string, config?: Partial<ScraperConfig>): JobScraper | null {
		const domain = extractDomain(url);

		logger.debug("Looking for scraper", { domain, url });

		for (const [scraperDomain, ScraperClass] of this.scrapers.entries()) {
			if (domain === scraperDomain || domain.endsWith(`.${scraperDomain}`)) {
				logger.info(`Found scraper for ${scraperDomain}`);
				return new ScraperClass(config);
			}
		}

		logger.warn(`No scraper found for domain: ${domain}`);
		return null;
	}

	/**
	 * Check if a scraper exists for the given URL
	 */
	static hasScraper(url: string): boolean {
		return this.getScraper(url) !== null;
	}

	/**
	 * Get all supported domains
	 */
	static getSupportedDomains(): string[] {
		return Array.from(this.scrapers.keys());
	}

	/**
	 * Register a new scraper
	 */
	static registerScraper(
		domain: string,
		scraperClass: new (config?: Partial<ScraperConfig>) => JobScraper,
	): void {
		logger.info(`Registering scraper for ${domain}`);
		this.scrapers.set(domain, scraperClass);
	}
}
