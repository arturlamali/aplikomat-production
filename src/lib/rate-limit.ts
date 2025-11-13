// src/lib/rate-limit.ts
import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or Upstash for distributed rate limiting
 */
class RateLimiter {
	private store = new Map<string, RateLimitEntry>();
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor() {
		// Clean up expired entries every 5 minutes
		this.cleanupInterval = setInterval(
			() => {
				this.cleanup();
			},
			5 * 60 * 1000,
		);
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.store.entries()) {
			if (entry.resetAt < now) {
				this.store.delete(key);
			}
		}
	}

	/**
	 * Check if a request should be allowed based on rate limit
	 * @param identifier - Unique identifier (e.g., userId, IP)
	 * @param limit - Maximum number of requests
	 * @param windowMs - Time window in milliseconds
	 * @returns true if request is allowed, false otherwise
	 */
	check(identifier: string, limit: number, windowMs: number): boolean {
		const now = Date.now();
		const entry = this.store.get(identifier);

		if (!entry || entry.resetAt < now) {
			// First request or window expired
			this.store.set(identifier, {
				count: 1,
				resetAt: now + windowMs,
			});
			return true;
		}

		if (entry.count >= limit) {
			// Rate limit exceeded
			logger.warn("Rate limit exceeded", {
				identifier,
				limit,
				count: entry.count,
			});
			return false;
		}

		// Increment count
		entry.count++;
		return true;
	}

	/**
	 * Get remaining requests for an identifier
	 */
	getRemaining(identifier: string, limit: number): number {
		const entry = this.store.get(identifier);
		if (!entry || entry.resetAt < Date.now()) {
			return limit;
		}
		return Math.max(0, limit - entry.count);
	}

	/**
	 * Get time until reset in milliseconds
	 */
	getResetTime(identifier: string): number | null {
		const entry = this.store.get(identifier);
		if (!entry || entry.resetAt < Date.now()) {
			return null;
		}
		return entry.resetAt;
	}

	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
		this.store.clear();
	}
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
	// AI operations are expensive - limit to 10 per hour per user
	AI_GENERATION: {
		limit: 10,
		windowMs: 60 * 60 * 1000, // 1 hour
	},
	// Job searches - 50 per hour
	JOB_SEARCH: {
		limit: 50,
		windowMs: 60 * 60 * 1000, // 1 hour
	},
	// LinkedIn scraping - 20 per hour (API limits)
	LINKEDIN_SCRAPE: {
		limit: 20,
		windowMs: 60 * 60 * 1000, // 1 hour
	},
	// General API - 100 per 15 minutes
	API_GENERAL: {
		limit: 100,
		windowMs: 15 * 60 * 1000, // 15 minutes
	},
} as const;

/**
 * Helper function to check rate limit and throw error if exceeded
 */
export function checkRateLimit(
	userId: string,
	operation: keyof typeof RATE_LIMITS,
): void {
	const config = RATE_LIMITS[operation];
	const identifier = `${operation}:${userId}`;

	const allowed = rateLimiter.check(identifier, config.limit, config.windowMs);

	if (!allowed) {
		const resetTime = rateLimiter.getResetTime(identifier);
		const resetIn = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 0;

		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: `Przekroczono limit ${config.limit} żądań. Spróbuj ponownie za ${Math.ceil(resetIn / 60)} minut.`,
		});
	}
}

/**
 * Get rate limit info for a user
 */
export function getRateLimitInfo(
	userId: string,
	operation: keyof typeof RATE_LIMITS,
) {
	const config = RATE_LIMITS[operation];
	const identifier = `${operation}:${userId}`;

	return {
		limit: config.limit,
		remaining: rateLimiter.getRemaining(identifier, config.limit),
		resetAt: rateLimiter.getResetTime(identifier),
	};
}
