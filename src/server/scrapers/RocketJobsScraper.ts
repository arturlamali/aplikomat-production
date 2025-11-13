// src/server/scrapers/RocketJobsScraper.ts
import { JustJoinItScraper } from "./JustJoinItScraper";

/**
 * Scraper for RocketJobs.pl job postings
 *
 * RocketJobs uses the same infrastructure as JustJoinIT
 * (both owned by Just Join IT sp. z o.o.), so we can extend
 * JustJoinItScraper with minimal changes.
 */
export class RocketJobsScraper extends JustJoinItScraper {
	readonly name = "RocketJobsScraper";
	readonly domain = "rocketjobs.pl";

	// Override sourceType in parseFromJsonLd
	protected parseFromJsonLd(jsonLd: any, sourceUrl: string): any {
		const job = super.parseFromJsonLd(jsonLd, sourceUrl);
		job.sourceType = "rocketjobs.pl";
		return job;
	}

	// Override sourceType in parseFromReactAttributes
	protected async parseFromReactAttributes(page: any, sourceUrl: string): Promise<any> {
		const job = await super.parseFromReactAttributes(page, sourceUrl);
		job.sourceType = "rocketjobs.pl";
		return job;
	}
}
