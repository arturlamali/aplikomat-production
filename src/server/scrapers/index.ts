// src/server/scrapers/index.ts

// Export types
export * from "./types";

// Export base classes
export { BaseScraper } from "./BaseScraper";

// Export scrapers
export { PracujPlScraper } from "./PracujPlScraper";
export { JustJoinItScraper } from "./JustJoinItScraper";
export { RocketJobsScraper } from "./RocketJobsScraper";
export { AiUniversalScraper, aiUniversalScraper } from "./AiUniversalScraper";

// Export Jina Reader
export { JinaReader, jinaReader } from "./JinaReader";

// Export factory and service
export { ScraperFactory } from "./ScraperFactory";
export { ScraperService, scraperService } from "./ScraperService";
export type { ScraperMethod, ScrapeOptions } from "./ScraperService";

// Export utilities
export * from "./utils";
