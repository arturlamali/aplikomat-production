// src/env.js
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		// Database - SQLite (optional for local development)
		DATABASE_URL_SQLITE: z.string().url().optional(),
		DATABASE_AUTH_TOKEN_SQLITE: z.string().min(1).optional(),

		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),

		// Required for job search functionality
		RAPIDAPI_KEY: z.string().min(1),
		RAPIDAPI_HOST: z.string().min(1),

		// Required for LinkedIn profile scraping
		LINKEDIN_API_URL: z.string().url(),

		// Required for production database (Supabase)
		DATABASE_URL_SUPABASE: z.string().url(),
		DIRECT_URL_SUPABASE: z.string().url(),
		SUPABASE_SERVICE_KEY: z.string().min(1),

		// Optional AI providers - at least one should be configured
		OPENROUTER_API_KEY: z.string().min(1).optional(),
		GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
		ANTHROPIC_API_KEY: z.string().min(1).optional(),
		OPENAI_API_KEY: z.string().min(1).optional(),

		// Maintenance mode (optional, defaults to false)
		MAINTENANCE_MODE: z.string().transform(val => val === "true").default("false"),
		IS_IN_MAINTENANCE_MODE: z.string().transform(val => val === "true").default("false"),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// Required for Supabase authentication and database access
		NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
		RAPIDAPI_HOST: process.env.RAPIDAPI_HOST,
		LINKEDIN_API_URL: process.env.LINKEDIN_API_URL,
		DATABASE_URL_SUPABASE: process.env.DATABASE_URL_SUPABASE,
		DIRECT_URL_SUPABASE: process.env.DIRECT_URL_SUPABASE,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
		DATABASE_URL_SQLITE: process.env.DATABASE_URL_SQLITE,
		DATABASE_AUTH_TOKEN_SQLITE: process.env.DATABASE_AUTH_TOKEN_SQLITE,
		OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
		GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
		ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		MAINTENANCE_MODE: process.env.MAINTENANCE_MODE,
		IS_IN_MAINTENANCE_MODE: process.env.IS_IN_MAINTENANCE_MODE,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});