// src/server/scrapers/AiUniversalScraper.ts
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { ScrapedJob } from "./types";
import { jinaReader } from "./JinaReader";
import { logger } from "~/lib/logger";
import { normalizeUrl } from "./utils";

/**
 * AI-powered universal job scraper
 *
 * Uses Jina AI Reader (FREE) to convert HTML to Markdown,
 * then GPT-5-nano to extract structured job data.
 *
 * Cost: ~$0.0006 per job (GPT-5-nano only, Jina is FREE)
 * Speed: 3-5 seconds per job
 * Works on: ANY job posting URL
 */
export class AiUniversalScraper {
	/**
	 * Schema for job data extraction
	 */
	private readonly jobSchema = z.object({
		title: z.string().describe("Job title/position name"),
		companyName: z.string().describe("Company name"),
		description: z.string().describe("Full job description"),
		location: z.object({
			city: z.string().describe("City name"),
			street: z.string().optional().describe("Street address if available"),
			remote: z.boolean().optional().describe("Is this a remote position?"),
			hybrid: z.boolean().optional().describe("Is this a hybrid position?"),
		}),
		requiredSkills: z
			.array(z.string())
			.describe("Required technical skills, technologies, languages"),
		niceToHaveSkills: z
			.array(z.string())
			.describe("Nice to have skills, optional technologies"),
		workplaceType: z
			.enum(["hybrid", "remote", "on-site", "office", "mobile"])
			.optional()
			.describe("Workplace type"),
		workingTime: z
			.enum(["full_time", "part_time", "freelance", "internship"])
			.optional()
			.describe("Working time type"),
		experienceLevel: z
			.enum(["junior", "mid", "senior", "c_level"])
			.optional()
			.describe("Required experience level"),
		salary: z
			.array(
				z.object({
					from: z.number().nullable().describe("Minimum salary"),
					to: z.number().nullable().describe("Maximum salary"),
					currency: z.string().describe("Currency code (e.g., PLN, USD, EUR)"),
					type: z
						.enum([
							"permanent",
							"b2b",
							"mandate_contract",
							"any",
							"freelance",
							"internship",
							"contract",
						])
						.describe("Employment type"),
					gross: z.boolean().optional().describe("Is this gross salary?"),
				}),
			)
			.optional()
			.describe("Salary information"),
		languages: z
			.array(z.string())
			.optional()
			.describe("Required languages (e.g., English, Polish)"),
		companyLogoUrl: z.string().optional().describe("URL to company logo image"),
		publishedAt: z.string().optional().describe("Publication date (ISO format)"),
	});

	/**
	 * Scrape job from any URL using AI
	 */
	async scrapeJob(url: string, options?: { model?: string }): Promise<ScrapedJob> {
		const normalizedUrl = normalizeUrl(url);
		logger.info("AI Universal Scraper: Scraping job", { url: normalizedUrl });

		const startTime = Date.now();

		try {
			// Step 1: Convert URL to clean Markdown using Jina (FREE!)
			logger.debug("AI Universal Scraper: Step 1 - Jina Reader");
			const markdown = await jinaReader.urlToMarkdown(normalizedUrl);

			if (!markdown || markdown.length < 100) {
				throw new Error("Jina Reader returned empty or too short content");
			}

			logger.debug("AI Universal Scraper: Markdown received", {
				length: markdown.length,
			});

			// Step 2: Extract structured data using GPT-5-nano
			logger.debug("AI Universal Scraper: Step 2 - GPT-5-nano extraction");

			const model = options?.model || "gpt-5-nano";

			const result = await generateObject({
				model: openai(model),
				schema: this.jobSchema,
				prompt: `Extract job posting information from the following content.

Be thorough and accurate. Extract all available information.

Content:
${markdown.substring(0, 50000)} // Limit to 50K chars to save tokens

Return a structured JSON object with all the job details.`,
				temperature: 1, // GPT-5-nano requires temperature=1
			});

			const extractedData = result.object;

			// Step 3: Combine with metadata
			const jobData: ScrapedJob = {
				...extractedData,
				sourceUrl: normalizedUrl,
				sourceType: "other",
			};

			const duration = ((Date.now() - startTime) / 1000).toFixed(2);

			logger.info("AI Universal Scraper: Success", {
				url: normalizedUrl,
				title: jobData.title,
				company: jobData.companyName,
				duration: `${duration}s`,
				model,
			});

			return jobData;
		} catch (error) {
			logger.error("AI Universal Scraper: Failed to scrape job", error, {
				url: normalizedUrl,
			});
			throw new Error(
				`AI scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Check if AI scraper can handle this URL
	 * (Always returns true - can handle any URL)
	 */
	canHandle(_url: string): boolean {
		return true;
	}
}

// Export singleton instance
export const aiUniversalScraper = new AiUniversalScraper();
