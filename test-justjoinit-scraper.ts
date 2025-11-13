// test-justjoinit-scraper.ts
// Test portal-specific JustJoinIT scraper
//
// Usage: npx tsx test-justjoinit-scraper.ts [url]

import { JustJoinItScraper } from "./src/server/scrapers/JustJoinItScraper";

async function testJustJoinItScraper() {
	// Get URL from command line or use default
	const url =
		process.argv[2] ||
		"https://justjoin.it/job-offer/tesco-technology-product-manager---identity-krakow-pm";

	console.log("🚀 Testing JustJoinIT Portal-Specific Scraper");
	console.log("📍 URL:", url);
	console.log("");

	const scraper = new JustJoinItScraper({ headless: true });

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
			jobData.requiredSkills.length > 0
				? jobData.requiredSkills.slice(0, 10).join(", ")
				: "N/A",
		);
		if (jobData.requiredSkills.length > 10) {
			console.log(`  ... and ${jobData.requiredSkills.length - 10} more skills`);
		}
		console.log(
			"Nice to Have Skills:",
			jobData.niceToHaveSkills.length > 0
				? jobData.niceToHaveSkills.slice(0, 10).join(", ")
				: "N/A",
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
		console.log("Description (first 300 chars):");
		console.log(jobData.description.substring(0, 300) + "...");
		console.log("");

		if (jobData.rawData) {
			console.log("📋 Raw JSON-LD Data (first 500 chars):");
			const jsonStr = JSON.stringify(jobData.rawData, null, 2);
			console.log(jsonStr.substring(0, 500) + "...");
		}
		console.log("");
		console.log("💰 Cost: $0 (portal-specific)");
		console.log("⏱️  Speed:", duration, "seconds");
		console.log("");
	} catch (error) {
		console.error("");
		console.error("❌ Error:", error instanceof Error ? error.message : error);
		if (error instanceof Error && error.stack) {
			console.error("");
			console.error("Stack trace:");
			console.error(error.stack);
		}
		process.exit(1);
	} finally {
		await scraper.cleanup();
	}
}

testJustJoinItScraper();
