//src/server/api/routers/linkedinScraper.ts
import { z } from "zod";
import { unstable_cache } from "next/cache";
import {
	createTRPCRouter,
	privateProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { linkedinProfileResponse, linkedinJobResponse } from "../schemas/linkedin";
import { env } from "~/env";
import { eq } from "drizzle-orm";
import { linkedinCachedProfiles } from "~/server/db/schema.postgres";
import { profiles } from "~/server/db/schema.postgres";
import { TRPCError } from "@trpc/server";
import { checkRateLimit } from "~/lib/rate-limit";
import { logger } from "~/lib/logger";

const ONE_DAY_IN_SECONDS = 86400;

const fetchLinkedinProfile = async (url: string) => {
	logger.info("LinkedIn Profile API: Fetching profile", { url });
	
	const response = await fetch(
		`${env.LINKEDIN_API_URL}/get-linkedin-profile?linkedin_url=${encodeURIComponent(url)}&include_skills=true&include_certifications=false&include_publications=false&include_honors=false&include_volunteers=false&include_projects=false&include_patents=false&include_courses=false&include_organizations=false&include_profile_status=false&include_company_public_url=false`,
		{
			method: "GET",
			headers: {
				"x-rapidapi-key": env.RAPIDAPI_KEY,
				"x-rapidapi-host": env.RAPIDAPI_HOST,
			},
		},
	);

	if (!response.ok) {
		const errorText = await response.text();
		logger.error("LinkedIn Profile API Error", new Error(errorText), {
			status: response.status,
			url,
		});
		throw new Error(`API request failed with status ${response.status}: ${errorText}`);
	}

	const data = (await response.json()) as {
		data: z.infer<typeof linkedinProfileResponse>;
		message?: string;
	};
	
	logger.info("LinkedIn Profile API: Success", { message: data.message || "OK" });
	const parsedData = linkedinProfileResponse.parse(data.data);
	return parsedData;
};

const fetchLinkedinProfileByUrlCached = async (url: string) => {
	return unstable_cache(
		() => fetchLinkedinProfile(url),
		[`linkedin-profile-${url}`],
		{ revalidate: ONE_DAY_IN_SECONDS },
	)();
};

const fetchLinkedinJob = async (id: string) => {
	try {
		logger.info("LinkedIn Job API: Fetching job", { jobId: id });

		// Clean URL construction
		const jobUrl = `https://www.linkedin.com/jobs/view/${id}/`;
		const requestUrl = `${env.LINKEDIN_API_URL}/get-job-details?job_url=${encodeURIComponent(jobUrl)}&include_skills=false&include_hiring_team=false`;

		logger.debug("LinkedIn Job API: Request URL", { requestUrl });

		const response = await fetch(requestUrl, {
			method: "GET",
			headers: {
				"x-rapidapi-host": env.RAPIDAPI_HOST,
				"x-rapidapi-key": env.RAPIDAPI_KEY,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			logger.error("LinkedIn Job API: Request failed", new Error(errorText), {
				status: response.status,
				statusText: response.statusText,
				jobId: id,
			});

			// Specific error handling for subscription issues
			if (response.status === 403) {
				throw new Error(`LinkedIn API access denied (403). Check your RapidAPI subscription and key.`);
			}

			throw new Error(`API request failed with status ${response.status}: ${errorText}`);
		}

		const rawData = await response.json();
		logger.debug("LinkedIn Job API: Response received", { message: rawData.message });

		// Parse the response structure
		if (!rawData.data) {
			logger.error("LinkedIn Job API: No data field in response", new Error("Invalid API response"), {
				availableKeys: Object.keys(rawData),
			});
			throw new Error("Invalid API response: missing data field");
		}

		const jobData = rawData.data;
		logger.debug("LinkedIn Job API: Job data extracted", {
			jobTitle: jobData.job_title,
			companyName: jobData.company_name,
			descriptionLength: jobData.job_description?.length || 0,
		});

		// Parse and validate with schema
		const parsedJob = linkedinJobResponse.parse(jobData);
		return parsedJob;

	} catch (error) {
		logger.error("LinkedIn Job API: Error in fetchLinkedinJob", error, { jobId: id });
		throw error;
	}
};

export const linkedinScraperRouter = createTRPCRouter({
	getLinkedinProfileByUrl: publicProcedure
		.input(z.object({ url: z.string() }))
		.query(async ({ input }) => {
			return unstable_cache(
				() => fetchLinkedinProfile(input.url),
				[`linkedin-profile-${input.url}`],
				{ revalidate: ONE_DAY_IN_SECONDS },
			)();
		}),

	getLinkedinJobByUrl: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			return unstable_cache(
				() => fetchLinkedinJob(input.id),
				[`linkedin-job-${input.id}`],
				{ revalidate: ONE_DAY_IN_SECONDS },
			)();
		}),
		
	getLinkedinProfileByCurrentUser: privateProcedure.query(async ({ ctx }) => {
		const linkedinProfile = await ctx.db.query.linkedinCachedProfiles.findFirst(
			{
				where: eq(linkedinCachedProfiles.ownerId, ctx.user.id),
			},
		);

		if (!linkedinProfile) {
			return null;
		}

		return linkedinProfile;
	}),
	
	updateLinkedinProfileByCurrentUser: privateProcedure
		.input(z.object({ url: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Rate limiting for LinkedIn scraping
			checkRateLimit(ctx.user.id, "LINKEDIN_SCRAPE");

			logger.info("Updating LinkedIn profile", {
				userId: ctx.user.id,
				url: input.url,
			});

			const linkedinProfile = await fetchLinkedinProfileByUrlCached(input.url);
			logger.debug("LinkedIn profile fetched", { hasProfile: !!linkedinProfile });
			
			if (!linkedinProfile) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Nie udało się pobrać profilu LinkedIn, sprawdź czy podany link jest poprawny",
				});
			}

			await ctx.db
				.insert(linkedinCachedProfiles)
				.values({
					ownerId: ctx.user.id,
					profileUrl: input.url,
					profileData: linkedinProfile,
				})
				.onConflictDoUpdate({
					target: [linkedinCachedProfiles.ownerId],
					set: {
						profileData: linkedinProfile,
						profileUrl: input.url,
						ownerId: ctx.user.id,
					},
				});

			return null;
		}),
});