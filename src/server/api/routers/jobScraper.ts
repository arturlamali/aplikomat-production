// src/server/api/routers/jobScraper.ts
import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { scraperService } from "~/server/scrapers";
import { checkRateLimit } from "~/lib/rate-limit";
import { logger } from "~/lib/logger";
import { TRPCError } from "@trpc/server";

export const jobScraperRouter = createTRPCRouter({
	/**
	 * Scrape a job from a URL
	 */
	scrapeJobByUrl: privateProcedure
		.input(
			z.object({
				url: z.string().url("Invalid URL format"),
				skipCache: z.boolean().optional().default(false),
				method: z.enum(["ai", "portal-specific", "auto"]).optional().default("auto"),
				aiModel: z.string().optional().default("gpt-5-nano"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Rate limiting for scraping
			checkRateLimit(ctx.user.id, "JOB_SEARCH");

			logger.info("Scraping job by URL", {
				userId: ctx.user.id,
				url: input.url,
				method: input.method,
				aiModel: input.aiModel,
			});

			try {
				const jobData = await scraperService.scrapeJob(input.url, {
					skipCache: input.skipCache,
					method: input.method,
					aiModel: input.aiModel,
				});

				logger.info("Job scraped successfully", {
					userId: ctx.user.id,
					title: jobData.title,
					company: jobData.companyName,
					method: input.method,
				});

				return jobData;
			} catch (error) {
				logger.error("Failed to scrape job", error, {
					userId: ctx.user.id,
					url: input.url,
					method: input.method,
				});

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Nie udało się pobrać oferty pracy: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),

	/**
	 * Check if a URL can be scraped
	 */
	canScrapeUrl: publicProcedure
		.input(
			z.object({
				url: z.string().url("Invalid URL format"),
			}),
		)
		.query(({ input }) => {
			const canScrape = scraperService.canScrape(input.url);
			const hasPortalSpecific = scraperService.hasPortalSpecificScraper(input.url);
			const supportedDomains = scraperService.getSupportedDomains();

			return {
				canScrape, // Always true (AI can handle any URL)
				hasPortalSpecific, // True if portal-specific scraper exists
				supportedDomains, // List of domains with portal-specific scrapers
				aiAvailable: true, // AI scraper is always available
				recommendedMethod: hasPortalSpecific ? "auto" : "ai",
			};
		}),

	/**
	 * Get list of supported domains
	 */
	getSupportedDomains: publicProcedure.query(() => {
		return {
			domains: scraperService.getSupportedDomains(),
		};
	}),

	/**
	 * Get cache statistics (admin only)
	 */
	getCacheStats: publicProcedure.query(() => {
		return scraperService.getCacheStats();
	}),

	/**
	 * Clear scraper cache (admin only)
	 */
	clearCache: privateProcedure.mutation(() => {
		scraperService.clearCache();
		return { success: true };
	}),
});
