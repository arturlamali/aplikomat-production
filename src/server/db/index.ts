import { createClient, type Client } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { env } from "~/env";
import * as PostgresSchema from "./schema.postgres";
import * as SQLiteSchema from "./schema.sqlite";
import postgres from "postgres";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	client: Client | undefined;
};
export const clientSqlite =
	globalForDb.client ??
	createClient({
		url: env.DATABASE_URL_SQLITE,
		authToken: env.DATABASE_AUTH_TOKEN_SQLITE,
	});
if (env.NODE_ENV !== "production") globalForDb.client = clientSqlite;

export const sqliteDb = drizzleLibsql(clientSqlite, { schema: SQLiteSchema });

const globalForDbPostgres = globalThis as unknown as {
	conn: postgres.Sql | undefined;
};

const conn =
	globalForDbPostgres.conn ??
	postgres(env.DATABASE_URL_SUPABASE, {
		prepare: false,
	});
if (env.NODE_ENV !== "production") globalForDbPostgres.conn = conn;

export const postgresDb = drizzlePostgres(conn, { schema: PostgresSchema });
