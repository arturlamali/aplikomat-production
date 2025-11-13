import type { Config } from "drizzle-kit";
import { env } from "~/env";
export default {
	schema: "./src/server/db/schema.sqlite.ts",
	dialect: "sqlite",
	driver: "turso",
	dbCredentials: {
		url: env.DATABASE_URL_SQLITE,
		authToken: env.DATABASE_AUTH_TOKEN_SQLITE,
	},
} satisfies Config;
