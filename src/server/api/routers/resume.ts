// src/server/api/routers/resume.ts - FIXED VERSION
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { linkedinCachedProfiles, jobs, generatedCVs } from "~/server/db/schema.postgres";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure, privateProcedure } from "~/server/api/trpc";
import { z } from "zod";
import {
	type linkedinJobResponse,
	type linkedinProfileResponse,
} from "../schemas/linkedin";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

// ===== IMPORT ATS OPTIMIZATION =====
import { 
  extractAdvancedKeywords, 
  calculateATSScore, 
  enhancePromptWithATS,
  detectJobLanguage,
  type KeywordAnalysis,
  type ATSScore 
} from "~/lib/atsOptimization";

// ===== ENHANCED STRUCTURED SCHEMAS =====

// Enhanced experience schema with ATS-optimized fields
const experienceEntrySchema = z.object({
	title: z.string().describe("Job title that includes relevant keywords from target job"),
	company: z.string().describe("Name of the employer (NEVER change this)"),
	location: z.string().nullable().describe("Physical location where the work was performed"),
	startDate: z.string().describe("Date when employment began (YYYY-MM format)"),
	endDate: z.string().nullable().describe("Date when employment ended (YYYY-MM format), null if current"),
	description: z
		.array(z.string().min(1))
		.min(3)
		.max(4)
		.describe("3-4 responsibility bullet points with target keywords integrated naturally"),
	highlights: z
		.array(z.string().min(1))
		.min(2)
		.max(3)
		.describe("2-3 key achievements with metrics and target keywords in target language"),
	keyCompetencies: z
		.array(z.string())
		.optional()
		.describe("Key competencies/skills demonstrated in this role (using exact job keywords)")
});

// Enhanced skills schema with ATS categories
const skillsSchema = z.object({
	coreCompetencies: z
		.array(z.string())
		.min(5)
		.max(8)
		.describe("5-8 CRITICAL skills from job description using EXACT terminology"),
	technicalSkills: z
		.array(z.string())
		.min(3)
		.max(7)
		.describe("3-7 technical skills relevant to the role"),
	additionalSkills: z
		.array(z.string())
		.min(0)
		.max(5)
		.describe("0-5 supporting skills and competencies")
});

// Enhanced basics schema with keyword optimization
const basicsSchema = z.object({
	basics: z.object({
		name: z.string().describe("Full name (NEVER change this)"),
		title: z.string().describe("Professional title incorporating 1-2 critical keywords from job"),
		summary: z.string().min(150).max(500).describe("Professional summary with 5-7 critical keywords naturally integrated"),
		location: z.string().optional(),
		email: z.string().optional(),
		phone: z.string().optional(),
		linkedin: z.string().optional(),
	}),
});

// ===== AI MODEL CONFIGURATION =====
const AI_MODELS = {
	"google-gemini-2.0-flash": {
		provider: "google" as const,
		displayName: "Google Gemini",
		description: "Szybki i dokładny model do generowania CV",
		modelId: "gemini-2.0-flash" as const,
	},
	"open-ai-o3-mini": {
		provider: "openai" as const,
		displayName: "o3-mini",
		description: "Zaawansowany model od OpenAI",
		modelId: "o3-mini" as const,
	},
	"anthropic-claude-3.5 haiku": {
		provider: "anthropic" as const,
		displayName: "Claude 3.5 Haiku",
		description: "Szybki model od Anthropic",
		modelId: "Claude 3.5 Haiku" as const,
	},
} as const;

type AIModelId = keyof typeof AI_MODELS;

const getAiModel = (modelId: string) => {
	const modelKey = modelId as AIModelId;
	const modelConfig = AI_MODELS[modelKey] ?? AI_MODELS["google-gemini-2.0-flash"];

	switch (modelConfig.provider) {
		case "google":
			return google("gemini-2.0-flash-001");
		case "openai":
			return openai("gpt-4o-mini");
		case "anthropic":
			return anthropic("claude-3-5-sonnet-20240620");
		default:
			return google("gemini-2.0-flash-001");
	}
};

// ===== DATE FORMATTING =====
const formatDateFromLinkedIn = (
	dateRange: string,
	isEndDate: boolean,
	isCurrent: boolean,
): string | null => {
	if (!dateRange) return isEndDate && isCurrent ? null : "2023-01";

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	if (isEndDate && (isCurrent || dateRange.includes("Present"))) {
		return null;
	}

	const dateMatches = dateRange.match(/(\w+)\s+(\d{4})\s*-\s*(\w+)?\s*(\d{4})?/);
	if (dateMatches) {
		const [_, startMonth, startYear, endMonth, endYear] = dateMatches;

		const monthMap: Record<string, string> = {
			jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
			jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
			sty: "01", lut: "02", mar: "03", kwi: "04", maj: "05", cze: "06",
			lip: "07", sie: "08", wrz: "09", paź: "10", lis: "11", gru: "12",
		};

		if (isEndDate) {
			if (!endYear) return null;
			const month = monthMap[endMonth!.toLowerCase().substring(0, 3)] || "01";
			return `${endYear}-${month}`;
		} else {
			const month = monthMap[startMonth!.toLowerCase().substring(0, 3)] || "01";
			return `${startYear}-${month}`;
		}
	}

	const yearMatch = dateRange.match(/(\d{4})/g);
	if (yearMatch) {
		return isEndDate
			? yearMatch.length > 1 ? `${yearMatch[1]}-01` : null
			: `${yearMatch[0]}-01`;
	}

	return isEndDate && isCurrent
		? null
		: `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
};

// ===== ENHANCED AI GENERATION FUNCTIONS =====

// Enhanced experience generation with ATS optimization
const generateExperienceSection = async ({
	profile,
	job,
	model,
	detectedLanguage,
	keywordAnalysis
}: {
	profile: z.infer<typeof linkedinProfileResponse>;
	job: z.infer<typeof linkedinJobResponse>;
	model: string;
	detectedLanguage: string;
	keywordAnalysis: KeywordAnalysis;
}) => {
	console.log("🔄 Generating ATS-optimized experience section");
	try {
		const criticalKeywords = keywordAnalysis.keywords
			.filter(k => k.importance === 'critical')
			.map(k => k.keyword)
			.slice(0, 10);
			
		const highKeywords = keywordAnalysis.keywords
			.filter(k => k.importance === 'high')
			.map(k => k.keyword)
			.slice(0, 15);

		const targetCompanyName = job.company_name || "";
		const targetJobTitle = job.job_title || "";
		const isPolish = detectedLanguage === "pl";

		console.log(`🎯 ATS Keywords - Critical: ${criticalKeywords.join(', ')}`);
		console.log(`🎯 ATS Keywords - High: ${highKeywords.join(', ')}`);

		const experiences = await Promise.all(
			profile.experiences.map(async (exp) => {
				try {
					const originalCompanyName = exp.company || "";
					const originalTitle = exp.title || "";
					const isCurrent = exp.is_current || exp.date_range?.includes("Present") || false;

					const formattedStartDate = exp.start_month && exp.start_year
						? `${exp.start_year}-${String(exp.start_month).padStart(2, "0")}`
						: formatDateFromLinkedIn(exp.date_range || "", false, isCurrent);

					const formattedEndDate = isCurrent
						? null
						: exp.end_month && exp.end_year
							? `${exp.end_year}-${String(exp.end_month).padStart(2, "0")}`
							: formatDateFromLinkedIn(exp.date_range || "", true, isCurrent);

					// ✅ ATS-OPTIMIZED PROMPT
					const enhancedPrompt = `Transform this LinkedIn experience into an ATS-optimized ${isPolish ? 'Polish' : 'English'} resume entry.

CANDIDATE EXPERIENCE:
Title: ${originalTitle}
Company: ${originalCompanyName}
Period: ${exp.date_range || ""}
Current: ${isCurrent ? "Yes" : "No"}
Description: ${exp.description || ""}
Skills: ${exp.skills || ""}

TARGET JOB:
Title: ${targetJobTitle} 
Company: ${targetCompanyName}

🎯 ATS CRITICAL KEYWORDS (MUST USE): ${criticalKeywords.join(', ')}
🎯 ATS HIGH PRIORITY KEYWORDS: ${highKeywords.join(', ')}

ATS OPTIMIZATION RULES:
1. Write EVERYTHING in perfect ${isPolish ? 'Polish' : 'English'}
2. NEVER change company name "${originalCompanyName}"
3. Use EXACT keywords from the critical list (don't paraphrase)
4. Integrate 3-5 critical keywords naturally into descriptions
5. Repeat important keywords 2x across different bullet points
6. Include both acronyms and full forms (e.g., "SEO" and "search engine optimization")
7. Place keywords in first half of bullet points when possible

STRUCTURE REQUIREMENTS:
- Job title: Keep essence but optimize for target role
- Company context: Brief impressive stats about company
- Descriptions: 3-4 bullets with keyword integration and quantified achievements
- Highlights: 2-3 major achievements with metrics and keywords

KEYWORD PLACEMENT:
- Description bullets: Naturally weave in critical keywords
- Achievement highlights: Include relevant technical/industry terms
- Use action verbs with keywords: "Led SEO optimization resulting in..."

Generate compelling content that passes ATS screening while remaining truthful and natural.`;

					const { object } = await generateObject({
						model: getAiModel(model),
						schema: experienceEntrySchema,
						prompt: enhancedPrompt,
					});

					// Data integrity checks
					const correctedObject = { 
						...object,
						company: originalCompanyName, // Always preserve original
						startDate: formattedStartDate || object.startDate,
						endDate: isCurrent ? null : (formattedEndDate || object.endDate),
					};

					console.log(`✅ Generated ATS-optimized experience for ${originalTitle}`);
					return correctedObject;

				} catch (error) {
					console.error(`❌ Error generating experience for ${exp.title}:`, error);
					
					// Fallback
					return {
						title: exp.title || "Position",
						company: exp.company || "Company",
						location: exp.location || null,
						startDate: exp.start_year ? `${exp.start_year}-01` : "2023-01",
						endDate: exp.is_current ? null : (exp.end_year ? `${exp.end_year}-12` : "2024-01"),
						description: [exp.description || `Worked as ${exp.title} at ${exp.company}`],
						highlights: ["Key achievement from this role"],
						keyCompetencies: keywordAnalysis.keywords.filter(k => k.importance === 'critical').map(k => k.keyword).slice(0, 3)
					};
				}
			}),
		);
		return experiences;
	} catch (error) {
		console.error("❌ Error in generateExperienceSection:", error);
		throw new Error("Failed to generate experience section");
	}
};

// Enhanced skills generation with ATS categorization
const generateSkillsSection = async ({
	profile,
	job,
	model,
	detectedLanguage,
	keywordAnalysis
}: {
	profile: z.infer<typeof linkedinProfileResponse>;
	job: z.infer<typeof linkedinJobResponse>;
	model: string;
	detectedLanguage: string;
	keywordAnalysis: KeywordAnalysis;
}) => {
	console.log("🔄 Generating ATS-optimized skills section");
	try {
		const criticalKeywords = keywordAnalysis.keywords.filter(k => k.importance === 'critical');
		const technicalKeywords = keywordAnalysis.keywords.filter(k => k.category === 'technical');
		const isPolish = detectedLanguage === "pl";

		let profileSkills: string[] = [];
		if (typeof profile.skills === "string") {
			profileSkills = profile.skills.split("|").map((s) => s.trim());
		} else if (Array.isArray(profile.skills)) {
			profileSkills = profile.skills.map((s) =>
				typeof s === "string" ? s.trim() : JSON.stringify(s),
			);
		}

		const { object } = await generateObject({
			model: getAiModel(model),
			schema: skillsSchema,
			prompt: `Create ATS-optimized skills sections for ${isPolish ? 'Polish' : 'English'} resume.

PROFILE SKILLS: ${profileSkills.join(", ")}
CRITICAL JOB KEYWORDS: ${criticalKeywords.map(k => k.keyword).join(', ')}
TECHNICAL KEYWORDS: ${technicalKeywords.map(k => k.keyword).join(', ')}
JOB DESCRIPTION: ${(job.job_description || "").slice(0, 500)}

ATS OPTIMIZATION RULES:
1. coreCompetencies: MUST include critical keywords using EXACT terminology from job
2. technicalSkills: Include relevant technical skills from both profile and job keywords  
3. additionalSkills: Supporting skills that add value
4. Keep technical terms in English (JavaScript, SEO, etc.)
5. Translate soft skills to ${isPolish ? 'Polish' : 'English'}
6. Prioritize skills mentioned in job description
7. Only select skills candidate actually possesses or can demonstrate

CRITICAL: The coreCompetencies section is most important for ATS - include all critical job keywords that match candidate's profile.

Generate skills in ${isPolish ? 'Polish' : 'English'} where appropriate.`,
		});
		
		return object;
	} catch (error) {
		console.error("❌ Error in generateSkillsSection:", error);
		return {
			coreCompetencies: ["Marketing", "SEO", "Analytics"],
			technicalSkills: ["Google Analytics", "JavaScript"],
			additionalSkills: ["Project Management"]
		};
	}
};

// Enhanced basics generation with keyword optimization
const generateBasicsSection = async ({
	profile,
	job,
	model,
	userContactData,
	detectedLanguage,
	keywordAnalysis
}: {
	profile: z.infer<typeof linkedinProfileResponse>;
	job: z.infer<typeof linkedinJobResponse>;
	model: string;
	userContactData?: {
		email?: string;
		phone?: string;
		location?: string;
	};
	detectedLanguage: string;
	keywordAnalysis: KeywordAnalysis;
}) => {
	console.log("🔄 Generating ATS-optimized basics section");
	try {
		const criticalKeywords = keywordAnalysis.keywords
			.filter(k => k.importance === 'critical')
			.map(k => k.keyword)
			.slice(0, 8);
		const isPolish = detectedLanguage === "pl";

		const { object } = await generateObject({
			model: getAiModel(model),
			schema: basicsSchema,
			prompt: `Create ATS-optimized professional profile in ${isPolish ? 'Polish' : 'English'}.

CANDIDATE:
Name: ${profile.first_name} ${profile.last_name}
Headline: ${profile.headline || ""}
About: ${profile.about || ""}
Location: ${profile.location || ""}
LinkedIn: ${profile.linkedin_url || ""}

TARGET JOB:
Title: ${job.job_title || "Position"}
Company: ${job.company_name || "Company"}

🎯 CRITICAL KEYWORDS TO INTEGRATE: ${criticalKeywords.join(', ')}

ATS OPTIMIZATION RULES:
1. Write in perfect ${isPolish ? 'Polish' : 'English'}
2. Keep name unchanged as "${profile.first_name} ${profile.last_name}"
3. Professional title: Include 1-2 critical keywords naturally
4. Summary: Integrate 5-7 critical keywords naturally throughout 150-500 characters
5. Keywords should flow naturally, not feel stuffed
6. Use both acronyms and full terms where appropriate
7. Start summary with strongest keyword match

KEYWORD INTEGRATION STRATEGY:
- Title: Natural integration of role-relevant keywords
- Summary: Distribute keywords across different sentences
- Focus on candidate's real strengths that match job requirements
- Maintain professional, confident tone

Generate compelling ${isPolish ? 'Polish' : 'English'} content optimized for ATS scanning.`,
		});

		const basics = { ...object.basics };

		// Override with user contact data if provided
		if (userContactData?.email?.trim()) basics.email = userContactData.email;
		if (userContactData?.phone?.trim()) basics.phone = userContactData.phone;
		if (userContactData?.location?.trim()) basics.location = userContactData.location;
		if (!basics.linkedin && profile.linkedin_url) basics.linkedin = profile.linkedin_url;

		return basics;
	} catch (error) {
		console.error("❌ Error in generateBasicsSection:", error);
		return {
			name: `${profile.first_name} ${profile.last_name}`,
			title: profile.headline || "Professional",
			summary: profile.about || "Experienced professional with proven track record.",
			location: profile.location || userContactData?.location,
			email: userContactData?.email,
			phone: userContactData?.phone,
			linkedin: profile.linkedin_url,
		};
	}
};

// Keep original interests and languages functions (they're fine as-is)
const generateInterestsSection = async ({
	profile,
	job,
	model,
	detectedLanguage,
}: {
	profile: z.infer<typeof linkedinProfileResponse>;
	job: z.infer<typeof linkedinJobResponse>;
	model: string;
	detectedLanguage: string;
}) => {
	console.log("🔄 Generating interests section");
	try {
		const isPolish = detectedLanguage === "pl";

		const interestsSchema = z.object({
			interests: z
				.array(z.string().min(1).max(30))
				.min(5)
				.max(7)
				.describe("5-7 diverse interests in target language (max 30 chars each)"),
		});

		const { object } = await generateObject({
			model: getAiModel(model),
			schema: interestsSchema,
			prompt: `Create interests list in ${isPolish ? 'Polish' : 'English'}.

CANDIDATE INFO:
${profile.about || ""}
${profile.headline || ""}

TARGET COMPANY: ${job.company_name || "Company"}

RULES:
1. Write in ${isPolish ? 'Polish' : 'English'}
2. Create 5-7 diverse interests
3. Base on candidate's profile hints
4. Keep brand names in original form
5. Make them conversation starters
6. Keep each interest 1-3 words

Generate natural ${isPolish ? 'Polish' : 'English'} interests.`,
		});
		return object.interests || [];
	} catch (error) {
		console.error("❌ Error in generateInterestsSection:", error);
		return detectedLanguage === "pl" 
			? ["Technologie", "Innowacje", "Uczenie się"]
			: ["Technology", "Innovation", "Learning"];
	}
};

const generateLanguagesSection = async ({
	profile,
}: {
	profile: z.infer<typeof linkedinProfileResponse>;
}) => {
	console.log("🔄 Processing languages section");
	try {
		if (!profile.languages || profile.languages.length === 0) {
			return [];
		}

		let languages = [];

		if (typeof profile.languages === "string") {
			languages = profile.languages.split(",").map((lang) => ({
				language: lang.trim(),
				fluency: "Biegły",
			}));
		} else if (Array.isArray(profile.languages)) {
			languages = profile.languages
				.map((lang) => {
					if (typeof lang === "string") {
						return { language: lang.trim(), fluency: "Biegły" };
					} else if (typeof lang === "object" && lang !== null) {
						const langObj = lang as Record<string, any>;
						let language = "Unknown";
						let fluency = "Basic";

						// Find language name
						const languageKeys = ["language", "name", "lang", "languageName"];
						for (const key of languageKeys) {
							if (langObj[key] && typeof langObj[key] === "string") {
								language = langObj[key].trim();
								break;
							}
						}

						// Find fluency level
						const fluencyKeys = ["fluency", "proficiency", "level"];
						for (const key of fluencyKeys) {
							if (langObj[key] && typeof langObj[key] === "string") {
								fluency = langObj[key].trim();
								break;
							}
						}

						// Map English fluency levels to Polish
						const fluencyMap: Record<string, string> = {
							elementary: "Podstawowa",
							"elementary proficiency": "Podstawowa",
							"limited working": "Ograniczona",
							"limited working proficiency": "Ograniczona",
							"professional working": "Zawodowa",
							"professional working proficiency": "Zawodowa",
							"full professional": "Biegła",
							"full professional proficiency": "Biegła",
							"native or bilingual": "Ojczysty",
							"native or bilingual proficiency": "Ojczysty",
							native: "Ojczysty",
						};

						const normalizedFluency = fluency.toLowerCase();
						if (fluencyMap[normalizedFluency]) {
							fluency = fluencyMap[normalizedFluency];
						}

						return { language, fluency };
					}
					return null;
				})
				.filter(Boolean);
		}

		return languages;
	} catch (error) {
		console.error("❌ Error in generateLanguagesSection:", error);
		return [];
	}
};

// ===== ENHANCED MAIN RESUME GENERATION =====
const generateResumeContent = async ({
	profile,
	job,
	model = "google-gemini-2.0-flash",
	userContactData,
}: {
	profile: z.infer<typeof linkedinProfileResponse>;
	job: z.infer<typeof linkedinJobResponse>;
	model: string;
	userContactData?: {
		email?: string;
		phone?: string;
		location?: string;
	};
}) => {
	console.log("🚀 Starting AI-powered ATS-optimized resume generation");

	// ✅ AI-POWERED LANGUAGE DETECTION
	const detectedLanguage = await detectJobLanguage(job.job_description || "", job.job_title || "");
	console.log(`🌍 AI detected language: ${detectedLanguage}`);

	// ✅ AI-POWERED KEYWORD EXTRACTION
	const keywordAnalysis = await extractAdvancedKeywords(
		job.job_description || "", 
		job.job_title || ""
	);
	
	console.log(`🎯 AI extracted ${keywordAnalysis.keywords.length} keywords for ATS optimization`);
	console.log(`🔑 Critical keywords: ${keywordAnalysis.keywords.filter(k => k.importance === 'critical').map(k => k.keyword).join(', ')}`);

	const targetCompany = job.company_name || job.data?.company_name || "Company";

	// Generate all sections with AI-powered ATS optimization
	const [basics, experience, skills, interests, languages] = await Promise.all([
		generateBasicsSection({ profile, job, model, userContactData, detectedLanguage, keywordAnalysis }),
		generateExperienceSection({ profile, job, model, detectedLanguage, keywordAnalysis }),
		generateSkillsSection({ profile, job, model, detectedLanguage, keywordAnalysis }),
		generateInterestsSection({ profile, job, model, detectedLanguage }),
		generateLanguagesSection({ profile }),
	]);

	// Education processing (unchanged)
	const education = profile.educations.map((edu) => ({
		school: edu.school || "",
		degree: edu.degree || "",
		field: edu.field_of_study || "",
		startDate: edu.start_month && edu.start_year
			? `${edu.start_month} ${edu.start_year}`
			: "",
		endDate: edu.end_year ? `${edu.end_month || ""} ${edu.end_year}` : undefined,
		activities: edu.activities || "",
	}));

	// ✅ AI-POWERED ATS SCORE CALCULATION
	const preliminaryResumeData = {
		basics,
		experience,
		education,
		skills,
		interests,
		languages,
		jobDetails: {
			jobTitle: job.job_title || "Position",
			companyName: targetCompany,
		},
		metadata: {
			language: detectedLanguage,
			version: "2025.1",
			template: "modern",
			createdAt: new Date().toISOString(),
		},
	};

	const atsScore = await calculateATSScore(preliminaryResumeData, keywordAnalysis);
	console.log(`📊 AI calculated ATS Score: ${atsScore.overallScore}/100`);
	console.log(`📈 Keyword Match: ${atsScore.keywordMatch}/100`);
	console.log(`🎯 Missing Keywords: ${atsScore.missingKeywords.join(', ')}`);

	// Final resume data with ATS analysis
	const resumeData = {
		...preliminaryResumeData,
		atsAnalysis: {
			score: atsScore,
			keywordAnalysis: keywordAnalysis,
			optimization: {
				keywordDensity: atsScore.keywordMatch,
				titleOptimization: atsScore.titleMatch,
				experienceRelevance: atsScore.experienceRelevance,
			}
		},
	};

	return resumeData;
};

// ===== ENHANCED TRPC ROUTER =====
export const resumeRouter = createTRPCRouter({
	generateResume: publicProcedure
		.input(
			z.object({
				linkedinProfile: z.custom<z.infer<typeof linkedinProfileResponse>>(),
				linkedinJob: z.custom<z.infer<typeof linkedinJobResponse>>(),
				model: z.string().optional(),
				userContactData: z
					.object({
						email: z.string().optional(),
						phone: z.string().optional(),
						location: z.string().optional(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const modelId = input.model ?? "google-gemini-2.0-flash";

			const resumeContent = await generateResumeContent({
				profile: input.linkedinProfile,
				job: input.linkedinJob,
				model: modelId,
				userContactData: input.userContactData,
			});

			if (!resumeContent) {
				throw new Error("Failed to generate resume content");
			}

			return {
				content: resumeContent,
				modelUsed: {
					id: modelId,
					...AI_MODELS[modelId as AIModelId],
				},
				jobDetails: {
					jobTitle: input.linkedinJob.job_title || "Position",
					companyName: input.linkedinJob.company_name || "Company",
				},
				language: resumeContent.metadata?.language || "en",
				atsScore: resumeContent.atsAnalysis?.score, // Include ATS score in response
			};
		}),

	getAvailableModels: publicProcedure.query(() => {
		return Object.entries(AI_MODELS).map(([id, config]) => ({
			id,
			...config,
		}));
	}),

	// Enhanced generateResumeFromUrlAndSave with ATS scoring
	generateResumeFromUrlAndSave: privateProcedure
		.input(
			z.object({
				jobUrl: z.string(),
				jobType: z.enum(["linkedin", "rocketjobs"]),
				userContactData: z
					.object({
						email: z.string().optional(),
						phone: z.string().optional(),
						location: z.string().optional(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { jobUrl, jobType, userContactData } = input;

			const linkedinProfile = await ctx.db.query.linkedinCachedProfiles.findFirst({
				where: eq(linkedinCachedProfiles.ownerId, ctx.user.id),
			});

			if (!linkedinProfile) {
				throw new Error("LinkedIn profile not found. Please add your LinkedIn profile first.");
			}

			let jobData: any;
			let jobMetadata: {
				sourceType: "linkedin" | "rocketjobs";
				sourceId: string;
				sourceUrl: string;
			};

			if (jobType === "linkedin") {
				const idMatch = jobUrl.match(/\/jobs\/view\/(\d+)/);
				if (!idMatch?.[1]) {
					throw new Error("Invalid LinkedIn URL format");
				}

				const linkedinJobId = idMatch[1];
				jobMetadata = {
					sourceType: "linkedin",
					sourceId: linkedinJobId,
					sourceUrl: jobUrl,
				};

				const cleanJobUrl = `https://www.linkedin.com/jobs/view/${linkedinJobId}/`;
				const requestUrl = `${env.LINKEDIN_API_URL}/get-job-details?job_url=${encodeURIComponent(cleanJobUrl)}&include_skills=false&include_hiring_team=false`;
				
				const response = await fetch(requestUrl, {
					method: "GET",
					headers: {
						"x-rapidapi-host": env.RAPIDAPI_HOST,
						"x-rapidapi-key": env.RAPIDAPI_KEY,
					},
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`Failed to fetch LinkedIn job data: ${response.status} - ${errorText}`);
				}

				const rawData = await response.json();
				jobData = rawData.data || rawData;
			} else if (jobType === "rocketjobs") {
				const slugMatch = jobUrl.match(/\/oferta-pracy\/([^/?]+)/);
				if (!slugMatch?.[1]) {
					throw new Error("Invalid RocketJobs URL format");
				}

				const job = await ctx.db.query.jobs.findFirst({
					where: eq(jobs.slug, slugMatch[1]),
				});

				if (!job) {
					throw new Error("Job not found in database");
				}

				jobMetadata = {
					sourceType: "rocketjobs",
					sourceId: job.id,
					sourceUrl: jobUrl,
				};

				jobData = {
					job_title: job.title,
					company_name: job.companyName,
					job_description: `Position: ${job.title}\n\nCompany: ${job.companyName}\n\nLocation: ${job.city}\n\nRequired skills: ${(job.requiredSkills || []).join(", ")}\n\nNice to have: ${(job.niceToHaveSkills || []).join(", ")}\n\nWork type: ${job.workplaceType}\n\nExperience level: ${job.experienceLevel}`,
					job_location: job.city,
					company_description: `Company hiring for ${job.title} position`,
				};
			} else {
				throw new Error("Unsupported job type");
			}

			if (!jobData) {
				throw new Error("Failed to fetch job data");
			}

			const normalizedJobData = {
				job_title: jobData.job_title || jobData.title || "Position",
				company_name: jobData.company_name || jobData.companyName || "Company",
				job_description: jobData.job_description || "",
				job_location: jobData.job_location || jobData.city || "",
				company_description: jobData.company_description || "",
			};

			console.log("🔥 Normalized job data:", normalizedJobData);

			// ✅ GENERATE WITH AI-POWERED ATS OPTIMIZATION
			const resumeContent = await generateResumeContent({
				profile: linkedinProfile.profileData as z.infer<typeof linkedinProfileResponse>,
				job: normalizedJobData as z.infer<typeof linkedinJobResponse>,
				model: "google-gemini-2.0-flash",
				userContactData,
			});

			if (!resumeContent) {
				throw new Error("Failed to generate resume content");
			}

			console.log("🎉 AI-optimized CV generated, saving to database...");
			console.log(`📊 Final ATS Score: ${resumeContent.atsAnalysis?.score.overallScore}/100`);

			const dbJobId = jobType === "linkedin" ? null : jobMetadata.sourceId;
			const cvId = uuidv4();
			
			const cvDataWithMetadata = {
				...resumeContent,
				sourceJobMetadata: jobMetadata,
			};
			
			await ctx.db.insert(generatedCVs).values({
				id: cvId,
				data: cvDataWithMetadata,
				ownerId: ctx.user.id,
				jobId: dbJobId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			console.log("✅ AI-optimized CV saved to database with ID:", cvId);

			return {
				id: cvId,
				data: cvDataWithMetadata,
				jobTitle: normalizedJobData.job_title,
				companyName: normalizedJobData.company_name,
				createdAt: new Date().toISOString(),
				modelUsed: {
					id: "google-gemini-2.0-flash",
					...AI_MODELS["google-gemini-2.0-flash"],
				},
				language: resumeContent.metadata?.language || "en",
				atsScore: resumeContent.atsAnalysis?.score, // Include ATS score
			};
		}),

	// ✅ NEW: Get ATS analysis for existing CV
	getATSAnalysis: privateProcedure
		.input(z.object({ cvId: z.string() }))
		.query(async ({ input, ctx }) => {
			const cv = await ctx.db.query.generatedCVs.findFirst({
				where: eq(generatedCVs.id, input.cvId),
			});

			if (!cv || cv.ownerId !== ctx.user.id) {
				throw new Error("CV not found");
			}

			// Return existing ATS analysis if available
			if (cv.data?.atsAnalysis) {
				return cv.data.atsAnalysis;
			}

			// If no ATS analysis exists, return null (legacy CV)
			return null;
		}),
});