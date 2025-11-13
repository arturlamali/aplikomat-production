//src/server/api/routers/jobs.ts
import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { unstable_cache } from "next/cache";
import type { JobSchemaRocketJobs } from "../schemas/jobs";
import { and, asc, desc, eq, gt, ilike, or, sql, between, isNull } from "drizzle-orm";
import {
	generatedCVs,
	jobs,
	linkedinCachedProfiles,
} from "~/server/db/schema.postgres";
import { generateResumeContent } from "../utils/resumeRocketJobsUtils";
import { v4 as uuidv4 } from "uuid";
import type { resumeSchema } from "../schemas/resume";
import type { linkedinProfileResponse } from "../schemas/linkedin";

type GeneratedCV = typeof generatedCVs.$inferSelect;
type ResumeContent = z.infer<typeof resumeSchema>;
type JobData = typeof jobs.$inferSelect;

export const jobsRouter = createTRPCRouter({
	searchJobs: privateProcedure
		.input(
			z.object({
				query: z.string().optional(),
				location: z.string().optional(),
				workplaceType: z
					.enum(["hybrid", "remote", "on-site", "office", "mobile"])
					.optional(),
				experienceLevel: z
					.enum(["junior", "mid", "senior", "c_level"])
					.optional(),
				workingTime: z
					.enum(["full_time", "part_time", "freelance", "internship"])
					.optional(),
				minSalary: z.number().optional(),
				cursor: z.string().nullish(),
				limit: z.number().min(1).max(100).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const {
				cursor,
				limit,
				query,
				location,
				workplaceType,
				experienceLevel,
				workingTime,
				minSalary,
			} = input;

			// Build filters
			const filters = [];

			if (query) {
				// Tokenize the query into individual words
				const searchTerms = query
					.toLowerCase()
					.split(/\s+/)
					.filter(Boolean)
					.map((term) => term.trim());

				// Handle search across multiple fields
				if (searchTerms.length > 0) {
					// Create individual word conditions
					const searchConditions = searchTerms.map((term) => {
						const likeTerm = `%${term}%`;
						return or(
							// Basic text columns
							ilike(jobs.title, likeTerm),
							ilike(jobs.companyName, likeTerm),
							ilike(jobs.city, likeTerm),
							ilike(jobs.street, likeTerm),

							// For arrays of strings, use the PostgreSQL array contains operator
							// This checks if any array element contains the search term
							sql`EXISTS (SELECT 1 FROM unnest(${jobs.requiredSkills}) skill WHERE LOWER(skill) LIKE ${likeTerm})`,
							sql`EXISTS (SELECT 1 FROM unnest(${jobs.niceToHaveSkills}) skill WHERE LOWER(skill) LIKE ${likeTerm})`,
							sql`EXISTS (SELECT 1 FROM unnest(${jobs.languages}) lang WHERE LOWER(lang::text) LIKE ${likeTerm})`,

							// Search in the employment types JSON field for type
							sql`EXISTS (
                SELECT 1 FROM jsonb_array_elements(${jobs.employmentTypes}) 
                AS emp_type 
                WHERE LOWER(emp_type->>'type') LIKE ${likeTerm}
              )`,
						);
					});

					// Combine all search conditions with AND to ensure all words must match somewhere
					filters.push(and(...searchConditions));
				}
			}

			// Location filter
			if (location) {
				const locationTerm = `%${location.toLowerCase()}%`;

				filters.push(
					or(
						ilike(jobs.city, locationTerm),
						ilike(jobs.street, locationTerm),
						sql`EXISTS (
							SELECT 1 FROM jsonb_array_elements(${jobs.multilocation}) 
							AS loc 
							WHERE LOWER(loc->>'city') LIKE ${locationTerm}
						)`,
					),
				);
			}

			if (workplaceType) {
				filters.push(eq(jobs.workplaceType, workplaceType));
			}

			if (experienceLevel) {
				filters.push(eq(jobs.experienceLevel, experienceLevel));
			}

			if (workingTime) {
				filters.push(eq(jobs.workingTime, workingTime));
			}

			// Minimum salary filter
			if (minSalary !== undefined) {
				filters.push(sql`
					EXISTS (
						SELECT 1 FROM jsonb_array_elements(${jobs.employmentTypes}) AS emp
						WHERE (emp->>'from')::numeric >= ${minSalary}
					)
				`);
			}

			// Add cursor condition if provided
			if (cursor) {
				filters.push(gt(jobs.id, cursor));
			}

			// Execute query with filters
			const jobsData = await ctx.db.query.jobs.findMany({
				where: filters.length > 0 ? and(...filters) : undefined,
				limit: limit + 1, // Fetch one extra to determine if there's a next page
				orderBy: [asc(jobs.id)],
			});

			// Check if there's a next page
			const hasNextPage = jobsData.length > limit;
			const data = hasNextPage ? jobsData.slice(0, -1) : jobsData;

			const lastItem = data.length > 0 ? data[data.length - 1] : null;

			return {
				data,
				nextCursor: hasNextPage && lastItem?.id ? lastItem.id : undefined,
				hasNextPage,
			};
		}),

	getGeneratedCVByJobId: privateProcedure
		.input(z.object({ jobId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { jobId } = input;

			console.log("🔍 Searching for CV with jobId:", jobId);

			// Strategy 1: Direct jobId match (works for RocketJobs)
			let generatedCV = await ctx.db.query.generatedCVs.findFirst({
				where: and(
					eq(generatedCVs.ownerId, ctx.user.id),
					eq(generatedCVs.jobId, jobId),
				),
			});

			if (generatedCV) {
				console.log("✅ Found CV by direct jobId match");
				return generatedCV;
			}

			// Strategy 2: Search through CVs with NULL jobId for LinkedIn source ID match
			console.log("🔍 Searching through CVs with NULL jobId for metadata match...");
			const nullJobIdCVs = await ctx.db.query.generatedCVs.findMany({
				where: and(
					eq(generatedCVs.ownerId, ctx.user.id),
					isNull(generatedCVs.jobId), // Only CVs with NULL jobId (LinkedIn jobs)
				),
			});

			// Search through CVs for LinkedIn source ID match
			generatedCV = nullJobIdCVs.find(cv => {
				const cvData = cv.data as any;
				if (cvData.sourceJobMetadata?.sourceType === "linkedin") {
					return cvData.sourceJobMetadata.sourceId === jobId;
				}
				return false;
			}) || null;

			if (generatedCV) {
				console.log("✅ Found CV by metadata search in NULL jobId CVs");
			} else {
				console.log("❌ No CV found for jobId:", jobId);
			}

			return generatedCV;
		}),

	generateCvAndSave: privateProcedure
		.input(
			z.object({
				jobId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { jobId } = input;

			const job = await ctx.db.query.jobs.findFirst({
				where: eq(jobs.id, jobId),
			});

			if (!job) {
				throw new Error("Job not found");
			}
			const linkedinProfile =
				await ctx.db.query.linkedinCachedProfiles.findFirst({
					where: eq(linkedinCachedProfiles.ownerId, ctx.user.id),
				});

			if (!linkedinProfile) {
				throw new Error("Linkedin profile not found");
			}

			const resumeContent = await generateResumeContent({
				profile: linkedinProfile.profileData as any,
				job: job,
				model: "google-gemini-2.5-exp",
				userContactData: undefined,
			});

			await ctx.db.insert(generatedCVs).values({
				id: uuidv4(),
				data: resumeContent,
				ownerId: ctx.user.id,
				jobId: jobId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			return resumeContent as typeof generatedCVs.$inferSelect;
		}),

	getAllGeneratedCVs: privateProcedure.query(async ({ ctx }) => {
		const userGeneratedCVs = await ctx.db.query.generatedCVs.findMany({
			where: eq(generatedCVs.ownerId, ctx.user.id),
			orderBy: [desc(generatedCVs.createdAt)],
		});
	
		// Enhanced logic: Handle both NULL jobIds (LinkedIn) and proper jobIds (RocketJobs)
		const cvWithJobDetails = await Promise.all(
			userGeneratedCVs.map(async (cv) => {
				// Check if CV has a jobId (RocketJobs) or is NULL (LinkedIn)
				if (cv.jobId) {
					// RocketJobs case - try to find job in database
					const job = await ctx.db.query.jobs.findFirst({
						where: eq(jobs.id, cv.jobId),
					});
		
					if (job) {
						// Job found in database - use database data
						return {
							...cv,
							jobTitle: job.title,
							companyName: job.companyName,
							sourceType: 'rocketjobs',
							isExternal: false,
						};
					}
				}

				// LinkedIn case (NULL jobId) or missing job - extract from CV metadata
				const cvData = cv.data as any;
				
				// Try to get job details from CV data
				let jobTitle = "Nieznane stanowisko";
				let companyName = "Nieznana firma";
				let sourceType = "unknown";
				let isExternal = true;

				// Check if we have sourceJobMetadata
				if (cvData.sourceJobMetadata) {
					const metadata = cvData.sourceJobMetadata;
					sourceType = metadata.sourceType || "unknown";
					
					// For LinkedIn jobs, we can extract from jobDetails
					if (cvData.jobDetails) {
						jobTitle = cvData.jobDetails.jobTitle || jobTitle;
						companyName = cvData.jobDetails.companyName || companyName;
					}
				} else if (cvData.jobDetails) {
					// Fallback to jobDetails if available
					jobTitle = cvData.jobDetails.jobTitle || jobTitle;
					companyName = cvData.jobDetails.companyName || companyName;
				}

				return {
					...cv,
					jobTitle,
					companyName,
					sourceType,
					isExternal,
				};
			}),
		);
	
		return cvWithJobDetails;
	}),

	generateCV: privateProcedure
		.input(
			z.object({
				jobId: z.string(),
				jobTitle: z.string(),
				companyName: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { jobId, jobTitle, companyName } = input;

			// Get the user's LinkedIn profile
			const linkedinProfile =
				await ctx.db.query.linkedinCachedProfiles.findFirst({
					where: eq(linkedinCachedProfiles.ownerId, ctx.user.id),
				});

			if (!linkedinProfile) {
				throw new Error("LinkedIn profile not found");
			}

			const resumeContent = await generateResumeContent({
				profile: linkedinProfile.profileData as z.infer<
					typeof linkedinProfileResponse
				>,
				job: {
					id: uuidv4(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					guid: jobId,
					slug: jobId,
					title: jobTitle,
					requiredSkills: [],
					niceToHaveSkills: [],
					workplaceType: "remote",
					workingTime: "full_time",
					experienceLevel: "mid",
					employmentTypes: [],
					categoryId: "0",
					multilocation: [],
					city: "",
					street: "",
					latitude: "0",
					longitude: "0",
					remoteInterview: "false",
					companyName: companyName,
					companyLogoThumbUrl: "",
					publishedAt: new Date().toISOString(),
					openToHireUkrainians: "false",
					languages: [],
					plan: "free",
				} satisfies JobData,
				model: "google-gemini-2.5-exp",
				userContactData: undefined,
			});

			const cvId = uuidv4();

			// Note: This function uses NULL jobId for external jobs
			await ctx.db.insert(generatedCVs).values({
				id: cvId,
				data: resumeContent,
				ownerId: ctx.user.id,
				jobId: null, // NULL for external/generated jobs
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			return { cvId };
		}),

	updateCVRating: privateProcedure
		.input(
			z.object({
				cvId: z.string(),
				didUserLikeCV: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { cvId, didUserLikeCV } = input;

			const cv = await ctx.db.query.generatedCVs.findFirst({
				where: and(
					eq(generatedCVs.id, cvId),
					eq(generatedCVs.ownerId, ctx.user.id),
				),
			});

			if (!cv) {
				throw new Error("CV not found");
			}

			await ctx.db
				.update(generatedCVs)
				.set({ didUserLikeCV })
				.where(eq(generatedCVs.id, cvId));

			return { success: true };
		}),
		
	getJobBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const { slug } = input;
			
			const job = await ctx.db.query.jobs.findFirst({
				where: eq(jobs.slug, slug),
			});

			if (!job) {
				throw new Error("Nie znaleziono oferty pracy o podanym slug");
			}

			// Przekształć dane z bazy do formatu zgodnego z LinkedIn job response
			return {
				job_title: job.title,
				company_name: job.companyName,
				job_description: "", // RocketJobs nie przechowuje pełnych opisów w bazie
				job_location: job.city,
				// Dodatkowe pola z RocketJobs
				id: job.id,
				slug: job.slug,
				title: job.title,
				companyName: job.companyName,
				city: job.city,
				requiredSkills: job.requiredSkills || [],
				niceToHaveSkills: job.niceToHaveSkills || [],
				workplaceType: job.workplaceType,
				experienceLevel: job.experienceLevel,
				employmentTypes: job.employmentTypes,
			};
		}),
});