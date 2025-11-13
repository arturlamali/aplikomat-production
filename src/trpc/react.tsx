"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";

import type { AppRouter } from "~/server/api/root";
import { supabase } from "~/server/supabase/supabaseClient";
import { getBaseUrl } from "./shared";

const createQueryClient = () => new QueryClient();

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		return createQueryClient();
	}
	// Browser: use singleton pattern to keep the same query client
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	return (clientQueryClientSingleton ??= createQueryClient());
};

export const api = createTRPCReact<AppRouter>({
	overrides: {
		useMutation: {
			/**
			 * This function is called whenever a `.useMutation` succeeds
			 **/
			async onSuccess(opts) {
				/**
				 * @note that order here matters:
				 * The order here allows route changes in `onSuccess` without
				 * having a flash of content change whilst redirecting.
				 **/
				// Calls the `onSuccess` defined in the `useQuery()`-options:
				await opts.originalFn();
				// Invalidate all queries in the react-query cache:

				await opts.queryClient.invalidateQueries();
			},
		},
	},
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: {
	children: React.ReactNode;
	headers: Headers;
}) {
	const queryClient = getQueryClient();

	const [trpcClient] = useState(() =>
		api.createClient({
			links: [
				loggerLink({
					enabled: (op) =>
						process.env.NODE_ENV === "development" ||
						(op.direction === "down" && op.result instanceof Error),
				}),
				httpBatchLink({
					transformer: SuperJSON,
					url: `${getBaseUrl()}/api/trpc`,
					headers: async () => {
						const heads = new Map(props.headers);
						const { data } = await supabase().auth.getSession();
						if (data.session) {
							heads.set("authorization", data.session.access_token);
						}

						heads.set("x-trpc-source", "react");

						return Object.fromEntries(heads);
					},
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<api.Provider client={trpcClient} queryClient={queryClient}>
				{props.children}
			</api.Provider>
		</QueryClientProvider>
	);
}
