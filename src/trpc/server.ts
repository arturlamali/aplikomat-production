import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { unstable_cache } from "next/cache";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { appRouter } from "~/server/api/root";
import { createCallerFactory, createTRPCContext } from "~/server/api/trpc";
import { getServerQueryClient } from "./getServerQueryClient";

export const getCachedTRPCContext = cache(
	(cookieStore: ReadonlyRequestCookies, _headers: Headers) => {
		return createTRPCContext(cookieStore, { headers: _headers });
	},
);

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
// const createContext = cache(() => {
//   const heads = new Headers(headers());
//   heads.set("x-trpc-source", "rsc");
//   const cookieStore = cookies();

//   return getCachedTRPCContext(cookieStore, heads);
// });

// const getQueryClient = cache(createQueryClient);
// const caller = createCaller(createContext);

export const createApi = async () => {
	const heads = new Headers(await headers());
	const cookieStore = await cookies();

	heads.set("x-trpc-source", "rsc");

	const caller = createCallerFactory(appRouter);

	return caller(() => getCachedTRPCContext(cookieStore, heads));
};

export const cacheWithCookies =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
		<T extends (...args: any[]) => any>(
			func: (_api: ReturnType<typeof createApi>) => T,
			keyParts?: Parameters<typeof unstable_cache>[1],
			options?: Parameters<typeof unstable_cache>[2],
		) =>
		async (...args: Parameters<T>) => {
			const createApiCache = createApi();

			return unstable_cache(
				func(createApiCache),
				keyParts,
				options,
			)(...args) as ReturnType<T>;
		};

const caller = async (cookieStore: ReadonlyRequestCookies, headers: Headers) =>
	createCallerFactory(appRouter)(
		await getCachedTRPCContext(cookieStore, headers),
	);

export const getHydrationHelpers = async (
	cookieStore: ReadonlyRequestCookies,
	headers: Headers,
) =>
	createHydrationHelpers<typeof appRouter>(
		await caller(cookieStore, headers),
		getServerQueryClient,
	);
