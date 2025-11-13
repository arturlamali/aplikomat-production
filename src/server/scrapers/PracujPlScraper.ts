// src/server/scrapers/PracujPlScraper.ts
import type { ScrapedJob } from "./types";
import { BaseScraper } from "./BaseScraper";
import { extractJsonLd, parseJsonLdToJob, stripHtml, normalizeUrl } from "./utils";
import { logger } from "~/lib/logger";

/**
 * Scraper for Pracuj.pl job postings
 *
 * Pracuj.pl provides excellent JSON-LD data and data-test attributes
 * making it one of the easiest sites to scrape.
 */
export class PracujPlScraper extends BaseScraper {
	readonly name = "PracujPlScraper";
	readonly domain = "pracuj.pl";

	async scrapeJob(url: string): Promise<ScrapedJob> {
		const normalizedUrl = normalizeUrl(url);
		logger.info("Scraping Pracuj.pl job", { url: normalizedUrl });

		const page = await this.createPage();

		try {
			await this.navigateToUrl(page, normalizedUrl);

			// Strategy 1: Try JSON-LD first (most reliable)
			const jsonLd = await extractJsonLd(page);

			if (jsonLd) {
				logger.debug("Found JSON-LD data on Pracuj.pl");
				const jobData = this.parseFromJsonLd(jsonLd, normalizedUrl);

				// Enrich with additional data from page
				await this.enrichWithPageData(page, jobData);

				return jobData;
			}

			// Strategy 2: Fallback to data-test attributes
			logger.warn("No JSON-LD found, falling back to data-test attributes");
			return await this.parseFromDataAttributes(page, normalizedUrl);
		} catch (error) {
			logger.error("Failed to scrape Pracuj.pl job", error, { url: normalizedUrl });
			throw new Error(`Failed to scrape Pracuj.pl job: ${error instanceof Error ? error.message : "Unknown error"}`);
		} finally {
			await page.close();
		}
	}

	/**
	 * Parse job data from JSON-LD
	 */
	private parseFromJsonLd(jsonLd: any, sourceUrl: string): ScrapedJob {
		const baseJob = parseJsonLdToJob(jsonLd, sourceUrl, "pracuj.pl");

		// Ensure required fields
		const job: ScrapedJob = {
			title: baseJob.title || "Unknown Position",
			companyName: baseJob.companyName || "Unknown Company",
			description: baseJob.description || "",
			location: baseJob.location || { city: "" },
			requiredSkills: baseJob.requiredSkills || [],
			niceToHaveSkills: baseJob.niceToHaveSkills || [],
			sourceUrl,
			sourceType: "pracuj.pl",
			workplaceType: baseJob.workplaceType,
			workingTime: baseJob.workingTime,
			experienceLevel: baseJob.experienceLevel,
			salary: baseJob.salary,
			languages: baseJob.languages,
			companyLogoUrl: baseJob.companyLogoUrl,
			publishedAt: baseJob.publishedAt,
			rawData: baseJob.rawData,
		};

		return job;
	}

	/**
	 * Enrich job data with additional information from the page
	 */
	private async enrichWithPageData(page: any, job: ScrapedJob): Promise<void> {
		try {
			// Extract skills from data-test attributes
			const skills = await page.evaluate(() => {
				const skillElements = document.querySelectorAll('[data-test*="skill"]');
				return Array.from(skillElements)
					.map((el) => el.textContent?.trim())
					.filter(Boolean);
			});

			if (skills.length > 0 && job.requiredSkills.length === 0) {
				job.requiredSkills = skills;
			}

			// Extract workplace type if not present
			if (!job.workplaceType) {
				const workplaceText = await page.evaluate(() => {
					const el = document.querySelector('[data-test*="workplace"], [data-test*="remote"]');
					return el?.textContent?.toLowerCase() || "";
				});

				if (workplaceText.includes("zdalna") || workplaceText.includes("remote")) {
					job.workplaceType = "remote";
				} else if (workplaceText.includes("hybryda") || workplaceText.includes("hybrid")) {
					job.workplaceType = "hybrid";
				} else if (workplaceText.includes("stacjonarna") || workplaceText.includes("office")) {
					job.workplaceType = "office";
				}
			}

			// Extract experience level if not present
			if (!job.experienceLevel) {
				const experienceText = await page.evaluate(() => {
					const el = document.querySelector('[data-test*="experience"], [data-test*="seniority"]');
					return el?.textContent?.toLowerCase() || "";
				});

				if (experienceText.includes("junior") || experienceText.includes("młodszy")) {
					job.experienceLevel = "junior";
				} else if (experienceText.includes("senior") || experienceText.includes("starszy")) {
					job.experienceLevel = "senior";
				} else if (experienceText.includes("mid") || experienceText.includes("regular")) {
					job.experienceLevel = "mid";
				}
			}

			logger.debug("Enriched job data from page", {
				skillsCount: job.requiredSkills.length,
				hasWorkplaceType: !!job.workplaceType,
				hasExperience: !!job.experienceLevel,
			});
		} catch (error) {
			logger.warn("Failed to enrich job data from page", { error });
		}
	}

	/**
	 * Fallback: Parse job data from data-test attributes
	 */
	private async parseFromDataAttributes(page: any, sourceUrl: string): Promise<ScrapedJob> {
		const data = await page.evaluate(() => {
			// Title
			const titleEl = document.querySelector('[data-test="text-jobTitle"]');
			const title = titleEl?.textContent?.trim() || "Unknown Position";

			// Company
			const companyEl = document.querySelector('[data-test="text-companyName"]');
			const companyName = companyEl?.textContent?.trim() || "Unknown Company";

			// Description
			const descEl = document.querySelector('[data-test="section-description"]');
			const description = descEl?.innerHTML || "";

			// Location
			const locationEl = document.querySelector('[data-test="text-location"]');
			const locationText = locationEl?.textContent?.trim() || "";

			// Skills
			const skillElements = document.querySelectorAll('[data-test*="skill"]');
			const skills = Array.from(skillElements)
				.map((el) => el.textContent?.trim())
				.filter(Boolean);

			// Salary
			const salaryEl = document.querySelector('[data-test*="salary"]');
			const salaryText = salaryEl?.textContent?.trim() || "";

			// Company logo
			const logoEl = document.querySelector('[data-test="image-company"] img') as HTMLImageElement;
			const companyLogoUrl = logoEl?.src || undefined;

			return {
				title,
				companyName,
				description,
				locationText,
				skills,
				salaryText,
				companyLogoUrl,
			};
		});

		// Parse location
		const city = data.locationText.split(",")[0]?.trim() || "";
		const street = data.locationText.split(",")[1]?.trim();

		// Parse salary
		let salary: ScrapedJob["salary"] = undefined;
		if (data.salaryText) {
			const salaryMatch = data.salaryText.match(/(\d+[\s\d]*)\s*-\s*(\d+[\s\d]*)\s*(\w+)/);
			if (salaryMatch) {
				const from = parseInt(salaryMatch[1]!.replace(/\s/g, ""));
				const to = parseInt(salaryMatch[2]!.replace(/\s/g, ""));
				const currency = salaryMatch[3]!;

				salary = [
					{
						from,
						to,
						currency,
						type: "permanent",
						gross: true,
					},
				];
			}
		}

		const job: ScrapedJob = {
			title: data.title,
			companyName: data.companyName,
			description: stripHtml(data.description),
			location: {
				city,
				street,
			},
			requiredSkills: data.skills,
			niceToHaveSkills: [],
			sourceUrl,
			sourceType: "pracuj.pl",
			salary,
			companyLogoUrl: data.companyLogoUrl,
		};

		return job;
	}
}
