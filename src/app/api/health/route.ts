// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { env } from "~/env";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for monitoring and deployment verification
 * Returns 200 OK if the application is running and configured correctly
 */
export async function GET() {
	try {
		// Basic health check
		const healthStatus = {
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: env.NODE_ENV,
			version: process.env.npm_package_version || "unknown",
		};

		// Check critical environment variables
		const requiredEnvVars = {
			hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
			hasSupabaseAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			hasDatabaseUrl: !!env.DATABASE_URL_SUPABASE,
			hasAtLeastOneAIProvider:
				!!env.GOOGLE_GENERATIVE_AI_API_KEY ||
				!!env.ANTHROPIC_API_KEY ||
				!!env.OPENAI_API_KEY ||
				!!env.OPENROUTER_API_KEY,
		};

		// Determine overall health
		const isHealthy = Object.values(requiredEnvVars).every((val) => val === true);

		if (!isHealthy) {
			return NextResponse.json(
				{
					...healthStatus,
					status: "degraded",
					message: "Some required environment variables are missing",
					config: requiredEnvVars,
				},
				{ status: 503 }, // Service Unavailable
			);
		}

		return NextResponse.json(
			{
				...healthStatus,
				config: requiredEnvVars,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Health check failed:", error);

		return NextResponse.json(
			{
				status: "error",
				timestamp: new Date().toISOString(),
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
