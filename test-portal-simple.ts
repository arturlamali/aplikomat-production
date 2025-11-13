// test-portal-simple.ts
// Simple test for portal-specific scrapers without env dependency

import { chromium } from "playwright";

const url =
	process.argv[2] ||
	"https://justjoin.it/job-offer/tesco-technology-product-manager---identity-krakow-pm";

console.log("🚀 Testing Portal-Specific Scraper (Simple)");
console.log("📍 URL:", url);
console.log("");

async function testPortalScraper() {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		console.log("⏳ Loading page...");
		const startTime = Date.now();

		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

		// Wait for content
		await page.waitForTimeout(2000);

		// Extract JSON-LD
		console.log("📚 Extracting JSON-LD...");
		const jsonLdData = await page.evaluate(() => {
			const scripts = Array.from(
				document.querySelectorAll('script[type="application/ld+json"]'),
			);

			for (const script of scripts) {
				try {
					const data = JSON.parse(script.textContent || "");
					if (data["@type"] === "JobPosting") {
						return data;
					}
				} catch (e) {
					continue;
				}
			}

			return null;
		});

		const duration = ((Date.now() - startTime) / 1000).toFixed(2);

		console.log("");
		if (jsonLdData) {
			console.log("✅ JSON-LD found in", duration, "seconds");
			console.log("");
			console.log("📊 Job Data:");
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			console.log("Title:", jsonLdData.title);
			console.log("Company:", jsonLdData.hiringOrganization?.name || "N/A");
			console.log("Location:", jsonLdData.jobLocation?.address?.addressLocality || "N/A");
			console.log("Employment Type:", jsonLdData.employmentType || "N/A");
			console.log("");
			console.log("Description (first 300 chars):");
			const desc = jsonLdData.description || "";
			const cleanDesc = desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
			console.log(cleanDesc.substring(0, 300) + "...");
			console.log("");
			console.log("💰 Cost: $0 (portal-specific, JSON-LD)");
			console.log("⏱️  Speed:", duration, "seconds");
			console.log("");
			console.log("📋 Full JSON-LD:");
			console.log(JSON.stringify(jsonLdData, null, 2));
		} else {
			console.log("⚠️  No JSON-LD found");
			console.log("Would need to fall back to AI scraper");
		}
	} catch (error) {
		console.error("❌ Error:", error);
	} finally {
		await browser.close();
	}
}

testPortalScraper();
