// src/server/scrapers/JinaReader.ts
import { logger } from "~/lib/logger";

/**
 * Jina AI Reader - converts any URL to clean, LLM-ready Markdown
 *
 * FREE tier: 10M tokens/month
 * Pricing: $0.02 per 1M tokens after free tier
 *
 * @see https://jina.ai/reader
 */
export class JinaReader {
	private readonly BASE_URL = "https://r.jina.ai";

	/**
	 * Convert URL to clean Markdown
	 */
	async urlToMarkdown(url: string): Promise<string> {
		logger.info("Jina AI Reader: Converting URL to Markdown", { url });

		try {
			const jinaUrl = `${this.BASE_URL}/${url}`;

			const response = await fetch(jinaUrl, {
				headers: {
					"Accept": "text/plain",
					"X-Return-Format": "markdown",
				},
			});

			if (!response.ok) {
				throw new Error(`Jina Reader failed: ${response.status} ${response.statusText}`);
			}

			const markdown = await response.text();

			logger.info("Jina AI Reader: Success", {
				url,
				markdownLength: markdown.length,
			});

			return markdown;
		} catch (error) {
			logger.error("Jina AI Reader: Failed to convert URL", error, { url });
			throw error;
		}
	}

	/**
	 * Convert URL to clean Markdown with additional options
	 */
	async urlToMarkdownWithOptions(
		url: string,
		options?: {
			timeout?: number;
			includeImages?: boolean;
			includeLinks?: boolean;
		},
	): Promise<string> {
		logger.info("Jina AI Reader: Converting URL with options", { url, options });

		try {
			const jinaUrl = `${this.BASE_URL}/${url}`;
			const headers: Record<string, string> = {
				"Accept": "text/plain",
				"X-Return-Format": "markdown",
			};

			if (options?.timeout) {
				headers["X-Timeout"] = options.timeout.toString();
			}

			if (options?.includeImages !== undefined) {
				headers["X-With-Images-Summary"] = options.includeImages.toString();
			}

			if (options?.includeLinks !== undefined) {
				headers["X-With-Links-Summary"] = options.includeLinks.toString();
			}

			const response = await fetch(jinaUrl, { headers });

			if (!response.ok) {
				throw new Error(`Jina Reader failed: ${response.status} ${response.statusText}`);
			}

			const markdown = await response.text();

			logger.info("Jina AI Reader: Success with options", {
				url,
				markdownLength: markdown.length,
			});

			return markdown;
		} catch (error) {
			logger.error("Jina AI Reader: Failed to convert URL with options", error, {
				url,
				options,
			});
			throw error;
		}
	}
}

// Export singleton instance
export const jinaReader = new JinaReader();
