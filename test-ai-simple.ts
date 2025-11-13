// test-ai-simple.ts
// Simplified AI scraper test without env validation

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Check for API key
if (!process.env.OPENAI_API_KEY) {
	console.error("❌ Error: OPENAI_API_KEY required");
	process.exit(1);
}

const url = process.argv[2] || "https://nofluffjobs.com/pl/job/senior-full-stack-developer-finture-warszawa-xrqkd";

console.log("🤖 Testing AI Universal Scraper (Simple)");
console.log("📍 URL:", url);
console.log("");

async function testScraper() {
	try {
		// Step 1: Jina Reader
		console.log("📚 Step 1: Jina AI Reader...");
		const startJina = Date.now();

		const jinaUrl = `https://r.jina.ai/${url}`;
		const response = await fetch(jinaUrl, {
			headers: {
				"Accept": "text/plain",
				"X-Return-Format": "markdown",
			},
		});

		if (!response.ok) {
			throw new Error(`Jina failed: ${response.status}`);
		}

		const markdown = await response.text();
		const jinaTime = ((Date.now() - startJina) / 1000).toFixed(2);

		console.log(`✅ Jina success in ${jinaTime}s`);
		console.log(`📝 Markdown: ${markdown.length} chars`);
		console.log("");
		console.log("First 300 chars:");
		console.log(markdown.substring(0, 300));
		console.log("...");
		console.log("");

		// Step 2: GPT-5-nano extraction
		console.log("🤖 Step 2: GPT-5-nano extraction...");
		const startAi = Date.now();

		const jobSchema = z.object({
			title: z.string(),
			companyName: z.string(),
			description: z.string(),
			location: z.object({
				city: z.string(),
				street: z.string().optional(),
			}),
			requiredSkills: z.array(z.string()),
			niceToHaveSkills: z.array(z.string()),
			workplaceType: z.enum(["hybrid", "remote", "on-site", "office", "mobile"]).optional(),
			experienceLevel: z.enum(["junior", "mid", "senior", "c_level"]).optional(),
		});

		const result = await generateObject({
			model: openai("gpt-5-nano"),
			schema: jobSchema,
			prompt: `Extract job posting information from the following content.

Content:
${markdown.substring(0, 30000)}

Return structured JSON with job details.`,
			temperature: 1, // GPT-5-nano only supports temperature=1
		});

		const aiTime = ((Date.now() - startAi) / 1000).toFixed(2);

		console.log(`✅ AI extraction success in ${aiTime}s`);
		console.log("");
		console.log("📊 Extracted Data:");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("Title:", result.object.title);
		console.log("Company:", result.object.companyName);
		console.log("Location:", result.object.location.city);
		console.log("Workplace:", result.object.workplaceType || "N/A");
		console.log("Level:", result.object.experienceLevel || "N/A");
		console.log("Required Skills:", result.object.requiredSkills.slice(0, 5).join(", "));
		if (result.object.requiredSkills.length > 5) {
			console.log(`  ...and ${result.object.requiredSkills.length - 5} more`);
		}
		console.log("");
		console.log("Description (first 200 chars):");
		console.log(result.object.description.substring(0, 200) + "...");
		console.log("");

		console.log("⏱️  Timing:");
		console.log(`  Jina: ${jinaTime}s`);
		console.log(`  AI: ${aiTime}s`);
		console.log(`  Total: ${((Date.now() - startJina) / 1000).toFixed(2)}s`);
		console.log("");

		console.log("✨ Success!");

	} catch (error) {
		console.error("❌ Error:", error);
		if (error instanceof Error) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}

testScraper();
