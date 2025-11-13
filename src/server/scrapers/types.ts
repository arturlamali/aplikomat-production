// src/server/scrapers/types.ts

/**
 * Base interface for all job scrapers
 */
export interface JobScraper {
	/**
	 * Unique identifier for the scraper
	 */
	readonly name: string;

	/**
	 * The domain this scraper handles
	 * @example "pracuj.pl"
	 */
	readonly domain: string;

	/**
	 * Check if this scraper can handle the given URL
	 */
	canHandle(url: string): boolean;

	/**
	 * Scrape a single job posting from the URL
	 */
	scrapeJob(url: string): Promise<ScrapedJob>;

	/**
	 * Close browser and cleanup resources
	 */
	cleanup(): Promise<void>;
}

/**
 * Scraped job data - normalized format from any source
 */
export interface ScrapedJob {
	// Basic info
	title: string;
	companyName: string;
	description: string;
	location: {
		city: string;
		street?: string;
		remote?: boolean;
		hybrid?: boolean;
	};

	// Skills
	requiredSkills: string[];
	niceToHaveSkills: string[];

	// Employment details
	workplaceType?: "hybrid" | "remote" | "on-site" | "office" | "mobile";
	workingTime?: "full_time" | "part_time" | "freelance" | "internship";
	experienceLevel?: "junior" | "mid" | "senior" | "c_level";

	// Salary
	salary?: {
		from: number | null;
		to: number | null;
		currency: string;
		type:
			| "permanent"
			| "b2b"
			| "mandate_contract"
			| "any"
			| "freelance"
			| "internship"
			| "contract";
		gross?: boolean;
	}[];

	// Languages
	languages?: string[];

	// Company
	companyLogoUrl?: string;

	// Source
	sourceUrl: string;
	sourceType: "pracuj.pl" | "justjoin.it" | "rocketjobs.pl" | "linkedin" | "nofluffjobs" | "other";
	publishedAt?: string;

	// Raw data for debugging
	rawData?: Record<string, unknown>;
}

/**
 * JSON-LD JobPosting schema
 * @see https://schema.org/JobPosting
 */
export interface JobPostingJsonLd {
	"@context": string;
	"@type": "JobPosting";
	title?: string;
	description?: string;
	datePosted?: string;
	validThrough?: string;
	employmentType?: string | string[];
	hiringOrganization?: {
		"@type": "Organization";
		name: string;
		sameAs?: string;
		logo?: string | { "@type": "ImageObject"; url: string };
	};
	jobLocation?: {
		"@type": "Place";
		address?: {
			"@type": "PostalAddress";
			streetAddress?: string;
			addressLocality?: string;
			addressRegion?: string;
			postalCode?: string;
			addressCountry?: string;
		};
	};
	baseSalary?: {
		"@type": "MonetaryAmount";
		currency?: string;
		value?: {
			"@type": "QuantitativeValue";
			minValue?: number;
			maxValue?: number;
			unitText?: string;
		};
	};
	skills?: string | string[];
	[key: string]: unknown;
}

/**
 * Scraper configuration
 */
export interface ScraperConfig {
	/**
	 * Browser headless mode
	 */
	headless?: boolean;

	/**
	 * Timeout for page navigation (ms)
	 */
	timeout?: number;

	/**
	 * User agent to use
	 */
	userAgent?: string;

	/**
	 * Whether to wait for network idle
	 */
	waitForNetworkIdle?: boolean;

	/**
	 * Additional cookies to set
	 */
	cookies?: Array<{
		name: string;
		value: string;
		domain: string;
	}>;
}

/**
 * Default scraper configuration
 */
export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
	headless: true,
	timeout: 30000,
	userAgent:
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	waitForNetworkIdle: false,
};
