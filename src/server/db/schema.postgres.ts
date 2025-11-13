//src/server/db/schema.postgres.ts
// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations, sql } from "drizzle-orm";
import {
	boolean,
	jsonb,
	pgTable,
	pgTableCreator,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import type { z } from "zod";
import type { resumeSchema } from "../api/schemas/resume";
import type { linkedinProfileResponse } from "../api/schemas/linkedin";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

export const profiles = pgTable("profiles", {
	id: uuid("id").primaryKey().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => sql`now()`),
	email: text("email").notNull(),
	fullName: text("full_name").notNull().default(""),
	avatarUrl: text("avatar_url"),
	phoneNumber: text("phone_number"),
	contactEmail: text("contact_email"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
		.notNull()
		.default(sql`now()`),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
	linkedinCachedProfile: one(linkedinCachedProfiles, {
		fields: [profiles.id],
		references: [linkedinCachedProfiles.ownerId],
	}),
	generatedCVs: many(generatedCVs),
}));

export const linkedinCachedProfiles = pgTable("linkedin_cached_profiles", {
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => sql`now()`),
	profileUrl: text("profile_url").notNull(),
	profileData: jsonb("profile_data")
		.notNull()
		.$type<z.infer<typeof linkedinProfileResponse>>(),
	ownerId: uuid("owner_id")
		.primaryKey()
		.notNull()
		.references(() => profiles.id),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
		.notNull()
		.default(sql`now()`),
});

export const linkedinCachedProfilesRelations = relations(
	linkedinCachedProfiles,
	({ one }) => ({
		owner: one(profiles, {
			fields: [linkedinCachedProfiles.ownerId],
			references: [profiles.id],
		}),
	}),
);

export const jobs = pgTable("jobs", {
	id: uuid("id").primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => sql`now()`),
	guid: text("guid").notNull(),
	slug: text("slug").notNull(),
	title: text("title").notNull(),
	requiredSkills: text("required_skills").array().notNull(),
	niceToHaveSkills: text("nice_to_have_skills").array(),
	workplaceType: text("workplace_type").notNull(),
	workingTime: text("working_time").notNull(),
	experienceLevel: text("experience_level").notNull(),
	employmentTypes: jsonb("employment_types").notNull().$type<
		Array<{
			from: number | null;
			to: number | null;
			currency: string;
			type:
				| "permanent"
				| "b2b"
				| "mandate_contract"
				| "any"
				| "freelance"
				| "internship"
				| "contract";
			unit: string;
			gross: boolean;
			fromChf: number | null;
			fromEur: number | null;
			fromGbp: number | null;
			fromPln: number | null;
			fromUsd: number | null;
			toChf: number | null;
			toEur: number | null;
			toGbp: number | null;
			toPln: number | null;
			toUsd: number | null;
		}>
	>(),
	categoryId: text("category_id").notNull(),
	categoryName: text("category_name"),
	multilocation: jsonb("multilocation").notNull().$type<
		Array<{
			city: string;
			slug: string;
			street: string;
			latitude: number;
			longitude: number;
		}>
	>(),
	city: text("city").notNull(),
	street: text("street").notNull(),
	latitude: text("latitude").notNull(),
	longitude: text("longitude").notNull(),
	remoteInterview: text("remote_interview").notNull(),
	companyName: text("company_name").notNull(),
	companyLogoThumbUrl: text("company_logo_thumb_url").notNull(),
	publishedAt: text("published_at").notNull(),
	openToHireUkrainians: text("open_to_hire_ukrainians").notNull(),
	languages: text("languages").array().notNull(),
	plan: text("plan").notNull(),
});

export const generatedCVs = pgTable("generated_cvs", {
	id: uuid("id").primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
		.notNull()
		.default(sql`now()`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
		.notNull()
		.default(sql`now()`)
		.$onUpdate(() => sql`now()`),
	// CHANGED: jobId is now nullable - allows external jobs without creating job records
	jobId: uuid("job_id"), // Removed .notNull() - now nullable!
	ownerId: uuid("owner_id")
		.notNull()
		.references(() => profiles.id),
	didUserLikeCV: boolean("did_user_like_cv"),
	data: jsonb("data").$type<z.infer<typeof resumeSchema>>().notNull(),
});

// Define relationships between tables
export const generatedCVsRelations = relations(generatedCVs, ({ one }) => ({
	owner: one(profiles, {
		fields: [generatedCVs.ownerId],
		references: [profiles.id],
	}),
	// CHANGED: Job relation is now optional since jobId can be null
	job: one(jobs, {
		fields: [generatedCVs.jobId],
		references: [jobs.id],
	}),
}));