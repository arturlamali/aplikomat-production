// test-scraper.ts
// Simple test script for Pracuj.pl scraper
//
// Usage: npx tsx test-scraper.ts [url]
//
// Example:
// npx tsx test-scraper.ts "https://www.pracuj.pl/praca/senior-fullstack-developer-warszawa,oferta,1003526669"

import { PracujPlScraper } from "./src/server/scrapers/PracujPlScraper";

async function testScraper() {
	// Get URL from command line or use default
	const url =
		process.argv[2] ||
		"https://www.pracuj.pl/praca/senior-fullstack-developer-warszawa,oferta,1003526669";

	console.log("🚀 Testing Pracuj.pl Scraper");
	console.log("📍 URL:", url);
	console.log("");

	const scraper = new PracujPlScraper({ headless: false });

	try {
		console.log("⏳ Scraping job data...");
		const startTime = Date.now();

		const jobData = await scraper.scrapeJob(url);

		const duration = ((Date.now() - startTime) / 1000).toFixed(2);

		console.log("");
		console.log("✅ Scraping completed in", duration, "seconds");
		console.log("");
		console.log("📊 Job Data:");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("Title:", jobData.title);
		console.log("Company:", jobData.companyName);
		console.log("Location:", jobData.location.city, jobData.location.street || "");
		console.log("Workplace Type:", jobData.workplaceType || "N/A");
		console.log("Working Time:", jobData.workingTime || "N/A");
		console.log("Experience Level:", jobData.experienceLevel || "N/A");
		console.log(
			"Required Skills:",
			jobData.requiredSkills.length > 0 ? jobData.requiredSkills.join(", ") : "N/A",
		);
		console.log(
			"Nice to Have Skills:",
			jobData.niceToHaveSkills.length > 0 ? jobData.niceToHaveSkills.join(", ") : "N/A",
		);
		console.log("Languages:", jobData.languages?.join(", ") || "N/A");

		if (jobData.salary && jobData.salary.length > 0) {
			console.log("");
			console.log("💰 Salary:");
			jobData.salary.forEach((s, i) => {
				console.log(
					`  [${i + 1}] ${s.from || "?"} - ${s.to || "?"} ${s.currency} (${s.type})`,
				);
			});
		}

		console.log("");
		console.log("Description (first 200 chars):");
		console.log(jobData.description.substring(0, 200) + "...");
		console.log("");

		if (jobData.rawData) {
			console.log("📋 Raw JSON-LD Data:");
			console.log(JSON.stringify(jobData.rawData, null, 2));
		}
	} catch (error) {
		console.error("");
		console.error("❌ Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	} finally {
		await scraper.cleanup();
	}
}

testScraper();
