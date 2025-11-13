// test-ai-scraper.ts
// Test script for AI Universal Scraper
//
// Usage: OPENAI_API_KEY=sk-xxx npx tsx test-ai-scraper.ts [url]
//
// Examples:
// npx tsx test-ai-scraper.ts "https://nofluffjobs.com/pl/job/senior-frontend-developer-xyz"
// npx tsx test-ai-scraper.ts "https://www.linkedin.com/jobs/view/123456"

import { aiUniversalScraper } from "./src/server/scrapers/AiUniversalScraper";
import { jinaReader } from "./src/server/scrapers/JinaReader";

async function testAiScraper() {
	// Check for OPENAI_API_KEY
	if (!process.env.OPENAI_API_KEY) {
		console.error("❌ Error: OPENAI_API_KEY environment variable is required");
		console.error("");
		console.error("Usage:");
		console.error("  OPENAI_API_KEY=sk-xxx npx tsx test-ai-scraper.ts [url]");
		console.error("");
		process.exit(1);
	}

	// Get URL from command line or use default
	const url =
		process.argv[2] ||
		"https://nofluffjobs.com/pl/job/senior-fullstack-developer-remote-warsaw";

	console.log("🤖 Testing AI Universal Scraper");
	console.log("📍 URL:", url);
	console.log("🔑 OpenAI API Key:", process.env.OPENAI_API_KEY.substring(0, 10) + "...");
	console.log("");

	try {
		// Step 1: Test Jina Reader
		console.log("📚 Step 1: Testing Jina AI Reader...");
		const startJina = Date.now();

		const markdown = await jinaReader.urlToMarkdown(url);

		const jinaTime = ((Date.now() - startJina) / 1000).toFixed(2);

		console.log(`✅ Jina Reader success in ${jinaTime}s`);
		console.log(`📝 Markdown length: ${markdown.length} characters`);
		console.log("");
		console.log("First 500 chars of Markdown:");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(markdown.substring(0, 500));
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("");

		// Step 2: Test AI Scraper
		console.log("🤖 Step 2: Testing AI Universal Scraper...");
		const startAi = Date.now();

		const jobData = await aiUniversalScraper.scrapeJob(url, {
			model: "gpt-5-nano",
		});

		const aiTime = ((Date.now() - startAi) / 1000).toFixed(2);

		console.log("");
		console.log(`✅ AI Scraper success in ${aiTime}s`);
		console.log("");
		console.log("📊 Extracted Job Data:");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("Title:", jobData.title);
		console.log("Company:", jobData.companyName);
		console.log("Location:", jobData.location.city, jobData.location.street || "");
		console.log(
			"Remote/Hybrid:",
			jobData.location.remote ? "Remote" : jobData.location.hybrid ? "Hybrid" : "On-site",
		);
		console.log("Workplace Type:", jobData.workplaceType || "N/A");
		console.log("Working Time:", jobData.workingTime || "N/A");
		console.log("Experience Level:", jobData.experienceLevel || "N/A");
		console.log(
			"Required Skills:",
			jobData.requiredSkills.length > 0 ? jobData.requiredSkills.slice(0, 10).join(", ") : "N/A",
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
					`  [${i + 1}] ${s.from || "?"} - ${s.to || "?"} ${s.currency} (${s.type}, ${s.gross ? "gross" : "net"})`,
				);
			});
		}

		console.log("");
		console.log("Description (first 300 chars):");
		console.log(jobData.description.substring(0, 300) + "...");
		console.log("");

		console.log("⏱️  Total Time:");
		console.log(`  Jina Reader: ${jinaTime}s`);
		console.log(`  AI Extraction: ${aiTime}s`);
		console.log(`  Total: ${((Date.now() - startJina) / 1000).toFixed(2)}s`);
		console.log("");

		console.log("💰 Estimated Cost:");
		const inputTokens = Math.ceil(markdown.length / 4); // ~4 chars per token
		const outputTokens = 500; // Estimated structured output
		const inputCost = (inputTokens / 1000000) * 0.05; // $0.05 per 1M tokens
		const outputCost = (outputTokens / 1000000) * 0.4; // $0.40 per 1M tokens
		const totalCost = inputCost + outputCost;

		console.log(`  Input: ~${inputTokens.toLocaleString()} tokens ($${inputCost.toFixed(6)})`);
		console.log(`  Output: ~${outputTokens.toLocaleString()} tokens ($${outputCost.toFixed(6)})`);
		console.log(`  Total: $${totalCost.toFixed(6)} per job`);
		console.log("");

		console.log("✨ Success! AI Universal Scraper works perfectly!");
	} catch (error) {
		console.error("");
		console.error("❌ Error:", error instanceof Error ? error.message : error);
		if (error instanceof Error && error.stack) {
			console.error("");
			console.error("Stack trace:");
			console.error(error.stack);
		}
		process.exit(1);
	}
}

testAiScraper();
