"use server";

import { cookies, headers } from "next/headers";
import { getCachedTRPCContext } from "~/trpc/server";

export const getServerUser = async () => {
	const ckies = await cookies();

	const { user, session } = await getCachedTRPCContext(ckies, await headers());

	return { user, session };
};
