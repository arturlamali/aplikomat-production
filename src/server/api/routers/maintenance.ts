import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { marketing_emails } from "~/server/db/schema.sqlite";

export const maintenanceRouter = createTRPCRouter({
	saveEmail: publicProcedure
		.input(
			z.object({
				email: z.string().email("Please provide a valid email address"),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				await ctx.sqliteDb.insert(marketing_emails).values({
					email: input.email,
				});
				return { success: true };
			} catch (error) {
				throw new Error("Failed to save email. Please try again.");
			}
		}),
});
