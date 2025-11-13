// src/server/scrapers/utils.ts
import type { Page } from "playwright";
import type { JobPostingJsonLd, ScrapedJob } from "./types";
import { logger } from "~/lib/logger";

/**
 * Extract JSON-LD data from a page
 */
export async function extractJsonLd(page: Page): Promise<JobPostingJsonLd | null> {
	try {
		const jsonLdData = await page.evaluate(() => {
			const scripts = Array.from(
				document.querySelectorAll('script[type="application/ld+json"]'),
			);

			for (const script of scripts) {
				try {
					const data = JSON.parse(script.textContent || "");

					// Look for JobPosting type
					if (data["@type"] === "JobPosting") {
						return data;
					}

					// Check if it's an array with JobPosting
					if (Array.isArray(data)) {
						const jobPosting = data.find((item) => item["@type"] === "JobPosting");
						if (jobPosting) return jobPosting;
					}

					// Check if it's a graph with JobPosting
					if (data["@graph"]) {
						const jobPosting = data["@graph"].find(
							(item: { "@type": string }) => item["@type"] === "JobPosting",
						);
						if (jobPosting) return jobPosting;
					}
				} catch (e) {
					// Skip invalid JSON
					continue;
				}
			}

			return null;
		});

		return jsonLdData as JobPostingJsonLd | null;
	} catch (error) {
		logger.error("Failed to extract JSON-LD", error);
		return null;
	}
}

/**
 * Parse JSON-LD to ScrapedJob format
 */
export function parseJsonLdToJob(
	jsonLd: JobPostingJsonLd,
	sourceUrl: string,
	sourceType: ScrapedJob["sourceType"],
): Partial<ScrapedJob> {
	const job: Partial<ScrapedJob> = {
		sourceUrl,
		sourceType,
	};

	// Title
	if (jsonLd.title) {
		job.title = jsonLd.title;
	}

	// Description
	if (jsonLd.description) {
		job.description = stripHtml(jsonLd.description);
	}

	// Company
	if (jsonLd.hiringOrganization?.name) {
		job.companyName = jsonLd.hiringOrganization.name;

		// Logo
		if (jsonLd.hiringOrganization.logo) {
			if (typeof jsonLd.hiringOrganization.logo === "string") {
				job.companyLogoUrl = jsonLd.hiringOrganization.logo;
			} else if (
				typeof jsonLd.hiringOrganization.logo === "object" &&
				"url" in jsonLd.hiringOrganization.logo
			) {
				job.companyLogoUrl = jsonLd.hiringOrganization.logo.url;
			}
		}
	}

	// Location
	if (jsonLd.jobLocation?.address) {
		const address = jsonLd.jobLocation.address;
		job.location = {
			city: address.addressLocality || "",
			street: address.streetAddress,
		};
	}

	// Published date
	if (jsonLd.datePosted) {
		job.publishedAt = jsonLd.datePosted;
	}

	// Skills
	if (jsonLd.skills) {
		const skills = Array.isArray(jsonLd.skills) ? jsonLd.skills : [jsonLd.skills];
		job.requiredSkills = skills.filter(Boolean);
	}

	// Employment type
	if (jsonLd.employmentType) {
		const types = Array.isArray(jsonLd.employmentType)
			? jsonLd.employmentType
			: [jsonLd.employmentType];

		// Map to our format
		for (const type of types) {
			const normalizedType = type.toLowerCase();
			if (normalizedType.includes("full") || normalizedType.includes("time")) {
				job.workingTime = "full_time";
			} else if (normalizedType.includes("part")) {
				job.workingTime = "part_time";
			} else if (normalizedType.includes("intern")) {
				job.workingTime = "internship";
			} else if (normalizedType.includes("freelance") || normalizedType.includes("contract")) {
				job.workingTime = "freelance";
			}
		}
	}

	// Salary
	if (jsonLd.baseSalary?.value) {
		const salary = jsonLd.baseSalary;
		job.salary = [
			{
				from: salary.value.minValue || null,
				to: salary.value.maxValue || null,
				currency: salary.currency || "PLN",
				type: "permanent",
				gross: true,
			},
		];
	}

	// Store raw data
	job.rawData = jsonLd;

	return job;
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(html: string): string {
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Normalize URL (remove trailing slash, query params, etc.)
 */
export function normalizeUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.replace(/\/$/, "");
	} catch {
		return url;
	}
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace(/^www\./, "");
	} catch {
		return "";
	}
}

/**
 * Wait for page to be loaded and stable
 */
export async function waitForPageReady(page: Page, timeout = 5000): Promise<void> {
	try {
		await page.waitForLoadState("domcontentloaded", { timeout });
	} catch (error) {
		logger.warn("Page did not reach domcontentloaded state", { error });
	}
}

/**
 * Close cookie consent banners if present
 */
export async function closeCookieBanners(page: Page): Promise<void> {
	const commonSelectors = [
		'button:has-text("Akceptuj")',
		'button:has-text("Accept")',
		'button:has-text("Zgadzam się")',
		'button:has-text("Agree")',
		'[data-test="button-acceptAll"]',
		'#onetrust-accept-btn-handler',
		'.cookie-accept',
		'.accept-cookies',
	];

	for (const selector of commonSelectors) {
		try {
			const button = await page.locator(selector).first();
			if (await button.isVisible({ timeout: 1000 })) {
				await button.click({ timeout: 2000 });
				logger.debug("Closed cookie banner", { selector });
				await page.waitForTimeout(500);
				break;
			}
		} catch {
			// Button not found or not clickable, continue
		}
	}
}
