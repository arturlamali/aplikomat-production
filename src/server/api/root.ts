import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { linkedinScraperRouter } from "./routers/linkedinScraper";
import { resumeRouter } from "./routers/resume";
import { maintenanceRouter } from "./routers/maintenance";
import { jobsRouter } from "./routers/jobs";
import { adminRouter } from "./routers/admin";
import { jobScraperRouter } from "./routers/jobScraper";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	linkedinScraper: linkedinScraperRouter,
	resume: resumeRouter,
	maintenance: maintenanceRouter,
	jobs: jobsRouter,
	admin: adminRouter,
	jobScraper: jobScraperRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
