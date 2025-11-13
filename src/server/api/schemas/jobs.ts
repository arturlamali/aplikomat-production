//src/server/api/schemas/jobs.ts
import { z } from "zod";
// curl --location 'https://api.rocketjobs.pl/v2/user-panel/offers/active'
export const JobSchemaRocketJobs = z.object({
	guid: z.string(),
	slug: z.string(),
	title: z.string(),
	requiredSkills: z.array(z.string()).nullable(),
	niceToHaveSkills: z.array(z.string()).nullable(),
	workplaceType: z.enum(["hybrid", "remote", "office", "mobile"]), // Add other types as necessary
	workingTime: z.enum(["full_time", "part_time", "freelance", "internship"]), // Add other types as necessary
	experienceLevel: z.enum(["junior", "mid", "senior", "c_level"]), // Add other levels as necessary
	employmentTypes: z.array(
		z.object({
			from: z.number().nullable(),
			to: z.number().nullable(),
			currency: z.string(),
			type: z.enum([
				"permanent",
				"b2b",
				"mandate_contract",
				"any",
				"freelance",
				"internship",
				"contract",
			]), // Add other types as necessary
			unit: z.string(),
			gross: z.boolean(),
			fromChf: z.number().nullable(),
			fromEur: z.number().nullable(),
			fromGbp: z.number().nullable(),
			fromPln: z.number().nullable(),
			fromUsd: z.number().nullable(),
			toChf: z.number().nullable(),
			toEur: z.number().nullable(),
			toGbp: z.number().nullable(),
			toPln: z.number().nullable(),
			toUsd: z.number().nullable(),
		}),
	),
	categoryId: z.number(),
	multilocation: z
		.array(
			z.object({
				city: z.string().nullable(),
				slug: z.string().nullable(),
				street: z.string().nullable(),
				latitude: z.number().nullable(),
				longitude: z.number().nullable(),
			}),
		)
		.nullable(),
	city: z.string(),
	street: z.string(),
	latitude: z.string(),
	longitude: z.string(),
	remoteInterview: z.boolean(),
	companyName: z.string(),
	companyLogoThumbUrl: z.string(),
	publishedAt: z.string(),
	openToHireUkrainians: z.boolean(),
	languages: z.array(
		z
			.object({
				code: z.string(),
				level: z.string(),
			})
			.optional(),
	),
	plan: z.string(),
});
