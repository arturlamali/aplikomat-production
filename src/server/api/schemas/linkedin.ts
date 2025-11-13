//src/server/api/schemas/linkedin.ts
import { z } from "zod";

// FIXED: Bardziej elastyczny schemat dla oferty pracy - wszystkie pola mogą być null lub undefined
export const linkedinJobResponse = z
	.object({
		applies: z.number().optional(),
		benefits: z.array(z.unknown()).optional(),
		// FIXED: company_description może być null
		company_description: z.string().nullable().optional().default(""),
		company_id: z.string().nullable().optional(),
		company_linkedin_url: z.string().nullable().optional(),
		company_name: z.string().nullable().optional().default("Brak nazwy firmy"),
		company_public_id: z.string().nullable().optional(),
		employee_count: z.number().nullable().optional(),
		employee_range: z.string().nullable().optional(),
		experience_level: z.string().nullable().optional(),
		expired: z.string().nullable().optional(),
		follower_count: z.number().nullable().optional(),
		hiring_team: z.record(z.unknown()).optional(),
		// FIXED: Te pola już były poprawnie oznaczone jako nullable
		hq_address_line1: z.string().nullable().optional(),
		hq_address_line2: z.string().nullable().optional(),
		hq_city: z.string().nullable().optional(),
		hq_country: z.string().nullable().optional(),
		hq_full_address: z.string().nullable().optional(),
		hq_postalcode: z.string().nullable().optional(),
		hq_region: z.string().nullable().optional(),
		industries: z.array(z.string()).optional(),
		// FIXED: job_description może być null  
		job_description: z.string().nullable().optional().default(""),
		job_functions: z.array(z.unknown()).optional(),
		job_id: z.string().nullable().optional(),
		job_location: z.string().nullable().optional(),
		// FIXED: job_title może być null
		job_title: z.string().nullable().optional().default("Brak tytułu"),
		job_type: z.string().nullable().optional(),
		job_url: z.string().nullable().optional(),
		posted: z.string().nullable().optional(),
		remote_allow: z.boolean().nullable().optional(),
		salary_details: z.record(z.unknown()).nullable().optional(),
		salary_display: z.string().nullable().optional(),
		skills: z.unknown().nullable().optional(),
		specialities: z.array(z.string()).optional(),
		views: z.number().nullable().optional(),
		// Dodajemy pole data dla obsługi zagnieżdżonych danych
		data: z.record(z.unknown()).nullable().optional(),
	})
	.transform((data) => {
		// Jeśli dane są zagnieżdżone w polu data, wyciągamy najważniejsze pola
		if (data.data && typeof data.data === "object") {
			const dataObj = data.data as Record<string, unknown>;
			return {
				...data,
				job_title:
					data.job_title ||
					(dataObj.job_title && typeof dataObj.job_title === "string"
						? dataObj.job_title
						: "Brak tytułu"),
				company_name:
					data.company_name ||
					(dataObj.company_name && typeof dataObj.company_name === "string"
						? dataObj.company_name
						: "Brak nazwy firmy"),
				job_description:
					data.job_description ||
					(dataObj.job_description &&
					typeof dataObj.job_description === "string"
						? dataObj.job_description
						: ""),
				// FIXED: Dodajemy fallback dla company_description
				company_description:
					data.company_description ||
					(dataObj.company_description &&
					typeof dataObj.company_description === "string"
						? dataObj.company_description
						: ""),
			};
		}
		return data;
	});

// FIXED: Schema dla języka - obsługuje różne formaty
const languageSchema = z.object({
	name: z.string().default(""),
	proficiency: z.string().default("")
});

// FIXED: Elastyczna schema dla profilu LinkedIn
export const linkedinProfileResponse = z.object({
	about: z.string().nullable().optional().default(""),
	city: z.string().nullable().optional().default(""),
	company: z.string().nullable().optional().default(""),
	company_description: z.string().nullable().optional().default(""),
	company_domain: z.string().nullable().optional().default(""),
	company_employee_range: z.string().nullable().optional().default(""),
	company_industry: z.string().nullable().optional().default(""),
	company_linkedin_url: z.string().nullable().optional().default(""),
	company_logo_url: z.string().nullable().optional().default(""),
	company_website: z.string().nullable().optional().default(""),
	company_year_founded: z.number().nullable().optional(),
	connection_count: z.number().nullable().optional(),
	country: z.string().nullable().optional().default(""),
	current_company_join_month: z.number().nullable().optional(),
	current_company_join_year: z.number().nullable().optional(),
	current_job_duration: z.string().nullable().optional().default(""),
	
	// FIXED: Educations - wszystkie pola nullable
	educations: z
		.array(
			z.object({
				activities: z.string().nullable().optional().default(""),
				date_range: z.string().nullable().optional().default(""),
				degree: z.string().nullable().optional().default(""),
				end_month: z.union([z.string(), z.number()]).nullable().optional(),
				end_year: z.union([z.number(), z.string()]).nullable().optional(),
				field_of_study: z.string().nullable().optional().default(""),
				school: z.string().nullable().optional().default(""),
				school_id: z.string().nullable().optional().default(""),
				school_linkedin_url: z.string().nullable().optional().default(""),
				school_logo_url: z.string().nullable().optional().default(""),
				start_month: z.union([z.string(), z.number()]).nullable().optional(),
				start_year: z.union([z.number(), z.string()]).nullable().optional(),
			}),
		)
		.default([]),
	
	email: z.string().nullable().optional().default(""),
	
	// FIXED: Experiences - wszystkie pola nullable  
	experiences: z
		.array(
			z.object({
				company: z.string().nullable().optional().default(""),
				company_id: z.string().nullable().optional().default(""),
				company_linkedin_url: z.string().nullable().optional().default(""),
				company_logo_url: z.string().nullable().optional().default(""),
				date_range: z.string().nullable().optional().default(""),
				description: z.string().nullable().optional().default(""),
				duration: z.string().nullable().optional().default(""),
				end_month: z.union([z.number(), z.string()]).nullable().optional(),
				end_year: z.union([z.number(), z.string()]).nullable().optional(),
				is_current: z.boolean().nullable().optional().default(false),
				job_type: z.string().nullable().optional().default(""),
				location: z.string().nullable().optional().default(""),
				skills: z.string().nullable().optional().default(""),
				start_month: z.union([z.number(), z.string()]).nullable().optional(),
				start_year: z.union([z.number(), z.string()]).nullable().optional(),
				title: z.string().nullable().optional().default(""),
			}),
		)
		.default([]),
	
	first_name: z.string().nullable().optional().default(""),
	follower_count: z.number().nullable().optional().default(0),
	full_name: z.string().nullable().optional().default(""),
	headline: z.string().nullable().optional().default(""),
	hq_city: z.string().nullable().optional().default(""),
	hq_country: z.string().nullable().optional().default(""),
	hq_region: z.string().nullable().optional().default(""),
	job_title: z.string().nullable().optional().default(""),
	
	// FIXED: Languages - obsługa różnych formatów z API
	languages: z.union([
		// Format 1: Array obiektów {name, proficiency}
		z.array(languageSchema),
		// Format 2: String oddzielony przecinkami "Italian, Spanish"
		z.string(),
		// Format 3: Array stringów ["Italian", "Spanish"]  
		z.array(z.string())
	]).nullable().optional().default([])
	.transform((languages) => {
		if (!languages) return [];
		
		// Jeśli to string, rozdziel na array obiektów
		if (typeof languages === 'string') {
			return languages.split(',').map(lang => ({
				name: lang.trim(),
				proficiency: "Biegły"
			}));
		}
		
		// Jeśli to array stringów, przekształć na array obiektów  
		if (Array.isArray(languages) && languages.length > 0 && typeof languages[0] === 'string') {
			return languages.map(lang => ({
				name: lang,
				proficiency: "Biegły"
			}));
		}
		
		// Jeśli to już array obiektów, zwróć bez zmian
		return languages as Array<{name: string, proficiency: string}>;
	}),
	
	last_name: z.string().nullable().optional().default(""),
	linkedin_url: z.string().nullable().optional().default(""),
	location: z.string().nullable().optional().default(""),
	phone: z.string().nullable().optional().default(""),
	profile_id: z.string().nullable().optional().default(""),
	profile_image_url: z.string().nullable().optional().default(""),
	public_id: z.string().nullable().optional().default(""),
	school: z.string().nullable().optional().default(""),
	
	// FIXED: Skills - obsługa różnych formatów
	skills: z.union([
		z.string(),
		z.array(z.string()),
		z.array(z.object({
			name: z.string(),
			level: z.string().optional()
		}))
	]).nullable().optional().default("")
	.transform((skills) => {
		if (!skills) return "";
		if (typeof skills === 'string') return skills;
		if (Array.isArray(skills)) {
			return skills.map(skill => 
				typeof skill === 'string' ? skill : skill.name
			).join('|');
		}
		return "";
	}),
	
	state: z.string().nullable().optional().default(""),
	urn: z.string().nullable().optional().default(""),
});