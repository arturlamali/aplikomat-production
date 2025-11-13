import type { Config } from "drizzle-kit";

import { env } from "~/env"; // Assuming POSTGRES_URL is added to your env schema

export default {
	schema: "./src/server/db/schema.postgres.ts",
	dialect: "postgresql",
	tablesFilter: ["*"],
	schemaFilter: ["public"],
	dbCredentials: {
		url: env.DIRECT_URL_SUPABASE, // Make sure to add POSTGRES_URL to your environment variables
	},
} satisfies Config;
