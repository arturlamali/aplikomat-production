// src/server/scrapers/JustJoinItScraper.ts
import type { ScrapedJob } from "./types";
import { BaseScraper } from "./BaseScraper";
import { extractJsonLd, parseJsonLdToJob, normalizeUrl } from "./utils";
import { logger } from "~/lib/logger";

/**
 * Scraper for JustJoinIT job postings
 *
 * JustJoinIT provides excellent JSON-LD data making it very fast to scrape.
 * Both justjoin.it and rocketjobs.pl use the same infrastructure.
 */
export class JustJoinItScraper extends BaseScraper {
	readonly name = "JustJoinItScraper";
	readonly domain = "justjoin.it";

	async scrapeJob(url: string): Promise<ScrapedJob> {
		const normalizedUrl = normalizeUrl(url);
		logger.info("Scraping JustJoinIT job", { url: normalizedUrl });

		const page = await this.createPage();

		try {
			await this.navigateToUrl(page, normalizedUrl);

			// Wait for content to load
			await page.waitForSelector('h1[data-test-id="title"]', { timeout: 10000 }).catch(() => {
				logger.warn("Title selector not found, continuing anyway");
			});

			// Strategy 1: Try JSON-LD first (most reliable)
			const jsonLd = await extractJsonLd(page);

			if (jsonLd) {
				logger.debug("Found JSON-LD data on JustJoinIT");
				const jobData = this.parseFromJsonLd(jsonLd, normalizedUrl);

				// Enrich with additional data from page
				await this.enrichWithPageData(page, jobData);

				return jobData;
			}

			// Strategy 2: Fallback to React attributes
			logger.warn("No JSON-LD found, falling back to React attributes");
			return await this.parseFromReactAttributes(page, normalizedUrl);
		} catch (error) {
			logger.error("Failed to scrape JustJoinIT job", error, { url: normalizedUrl });
			throw new Error(
				`Failed to scrape JustJoinIT job: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			await page.close();
		}
	}

	/**
	 * Parse job data from JSON-LD
	 */
	protected parseFromJsonLd(jsonLd: any, sourceUrl: string): ScrapedJob {
		const baseJob = parseJsonLdToJob(jsonLd, sourceUrl, "justjoin.it");

		// Ensure required fields
		const job: ScrapedJob = {
			title: baseJob.title || "Unknown Position",
			companyName: baseJob.companyName || "Unknown Company",
			description: baseJob.description || "",
			location: baseJob.location || { city: "" },
			requiredSkills: baseJob.requiredSkills || [],
			niceToHaveSkills: baseJob.niceToHaveSkills || [],
			sourceUrl,
			sourceType: "justjoin.it",
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
	protected async enrichWithPageData(page: any, job: ScrapedJob): Promise<void> {
		try {
			// Extract skills from skill badges
			const skills = await page.evaluate(() => {
				const skillElements = document.querySelectorAll('[data-test-id="skill-tag"]');
				return Array.from(skillElements)
					.map((el) => el.textContent?.trim())
					.filter(Boolean);
			});

			if (skills.length > 0 && job.requiredSkills.length === 0) {
				job.requiredSkills = skills;
			}

			// Extract salary if not present
			if (!job.salary || job.salary.length === 0) {
				const salaryText = await page.evaluate(() => {
					const salaryEl = document.querySelector('[data-test-id="salary-range"]');
					return salaryEl?.textContent?.trim() || "";
				});

				if (salaryText) {
					// Parse salary range (e.g., "15 000 - 20 000 PLN")
					const salaryMatch = salaryText.match(/(\d[\d\s]*)\s*-\s*(\d[\d\s]*)\s*(\w+)/);
					if (salaryMatch) {
						const from = parseInt(salaryMatch[1]!.replace(/\s/g, ""));
						const to = parseInt(salaryMatch[2]!.replace(/\s/g, ""));
						const currency = salaryMatch[3]!;

						job.salary = [
							{
								from,
								to,
								currency,
								type: "b2b",
								gross: true,
							},
						];
					}
				}
			}

			// Extract workplace type if not present
			if (!job.workplaceType) {
				const workplaceText = await page.evaluate(() => {
					const el = document.querySelector('[data-test-id="workplace-type"]');
					return el?.textContent?.toLowerCase() || "";
				});

				if (workplaceText.includes("remote") || workplaceText.includes("zdalna")) {
					job.workplaceType = "remote";
				} else if (workplaceText.includes("hybrid") || workplaceText.includes("hybryda")) {
					job.workplaceType = "hybrid";
				} else if (workplaceText.includes("office") || workplaceText.includes("biuro")) {
					job.workplaceType = "office";
				}
			}

			// Extract experience level if not present
			if (!job.experienceLevel) {
				const experienceText = await page.evaluate(() => {
					const el = document.querySelector('[data-test-id="experience-level"]');
					return el?.textContent?.toLowerCase() || "";
				});

				if (experienceText.includes("junior")) {
					job.experienceLevel = "junior";
				} else if (experienceText.includes("senior")) {
					job.experienceLevel = "senior";
				} else if (experienceText.includes("mid") || experienceText.includes("regular")) {
					job.experienceLevel = "mid";
				}
			}

			logger.debug("Enriched JustJoinIT job data from page", {
				skillsCount: job.requiredSkills.length,
				hasWorkplaceType: !!job.workplaceType,
				hasExperience: !!job.experienceLevel,
			});
		} catch (error) {
			logger.warn("Failed to enrich JustJoinIT job data from page", { error });
		}
	}

	/**
	 * Fallback: Parse job data from React attributes
	 */
	protected async parseFromReactAttributes(page: any, sourceUrl: string): Promise<ScrapedJob> {
		const data = await page.evaluate(() => {
			// Title
			const titleEl = document.querySelector('h1[data-test-id="title"]');
			const title = titleEl?.textContent?.trim() || "Unknown Position";

			// Company
			const companyEl = document.querySelector('[data-test-id="company-name"]');
			const companyName = companyEl?.textContent?.trim() || "Unknown Company";

			// Location
			const locationEl = document.querySelector('[data-test-id="location"]');
			const locationText = locationEl?.textContent?.trim() || "";

			// Skills
			const skillElements = document.querySelectorAll('[data-test-id="skill-tag"]');
			const skills = Array.from(skillElements)
				.map((el) => el.textContent?.trim())
				.filter(Boolean);

			// Description
			const descEl = document.querySelector('[data-test-id="job-description"]');
			const description = descEl?.innerHTML || "";

			// Company logo
			const logoEl = document.querySelector('[data-test-id="company-logo"] img') as HTMLImageElement;
			const companyLogoUrl = logoEl?.src || undefined;

			return {
				title,
				companyName,
				locationText,
				skills,
				description,
				companyLogoUrl,
			};
		});

		const city = data.locationText.split(",")[0]?.trim() || "";

		const job: ScrapedJob = {
			title: data.title,
			companyName: data.companyName,
			description: data.description,
			location: {
				city,
			},
			requiredSkills: data.skills,
			niceToHaveSkills: [],
			sourceUrl,
			sourceType: "justjoin.it",
			companyLogoUrl: data.companyLogoUrl,
		};

		return job;
	}
}
