//src/server/api/utils/resumeRocketJobsUtils.ts
import type { jobs, linkedinCachedProfiles } from "~/server/db/schema.postgres";

import { z } from "zod";
import { generateObject } from "ai";
import { createOpenRouter, openrouter } from "@openrouter/ai-sdk-provider";

import { env } from "~/env";

// Create OpenRouter client provider directly
const openRouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
});
const model = openRouter("", {});
// Removed getChatModel helper as we'll use provider.chat(model) directly

type ProfileType = typeof linkedinCachedProfiles.$inferSelect.profileData;
type JobSchema = typeof jobs.$inferSelect;

// Add helper type for profile.languages property
type LanguagesData =
	| string
	| string[]
	| { language?: string; fluency?: string; name?: string }[];

const formatDateFromLinkedIn = (
	dateRange: string,
	isEndDate: boolean,
	isCurrent: boolean,
): string | null => {
	if (!dateRange) return isEndDate && isCurrent ? null : "2023-01"; // Default fallback

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	// Obsluga przypadku "Present"
	if (isEndDate && (isCurrent || dateRange.includes("Present"))) {
		return null;
	}

	// Próba wydobycia dat z formatu "MMM YYYY - MMM YYYY" lub podobnych
	const dateMatches = dateRange.match(
		/(\w+)\s+(\d{4})\s*-\s*(\w+)?\s*(\d{4})?/,
	);
	if (dateMatches) {
		const [_, startMonth, startYear, endMonth, endYear] = dateMatches;

		// Konwersja nazwy miesiąca na liczbę
		const monthMap: Record<string, string> = {
			jan: "01",
			feb: "02",
			mar: "03",
			apr: "04",
			may: "05",
			jun: "06",
			jul: "07",
			aug: "08",
			sep: "09",
			oct: "10",
			nov: "11",
			dec: "12",
			sty: "01",
			lut: "02",
			marzec: "03", // Changed to avoid duplicate key
			kwi: "04",
			maj: "05",
			cze: "06",
			lip: "07",
			sie: "08",
			wrz: "09",
			paź: "10",
			lis: "11",
			gru: "12",
		};

		// Wybierz odpowiednią datę w zależności od tego czy chcemy początkową czy końcową
		if (isEndDate) {
			if (!endYear) return null; // jeśli brak roku końcowego, to prawdopodobnie "Present"
			const month = endMonth
				? monthMap[endMonth.toLowerCase().substring(0, 3)] || "01"
				: "01";
			return `${endYear}-${month}`;
		}

		const month = startMonth
			? monthMap[startMonth.toLowerCase().substring(0, 3)] || "01"
			: "01";
		return `${startYear}-${month}`;
	}

	// Jeśli nie udało się sparsować daty, próbujemy wydobyć sam rok
	const yearMatch = dateRange.match(/(\d{4})/g);
	if (yearMatch) {
		return isEndDate
			? yearMatch.length > 1
				? `${yearMatch[1]}-01`
				: null
			: `${yearMatch[0]}-01`;
	}

	// Fallback
	return isEndDate && isCurrent
		? null
		: `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
};

const generateExperienceSection = async ({
	profile,
	job,
}: {
	profile: ProfileType;
	job: JobSchema;
}) => {
	try {
		// Extract keywords (z zabezpieczeniem przed undefined)
		const keywords = job.requiredSkills?.join(", ");

		// Zapisujemy nazwę firmy, do której aplikujemy, aby chronić przed nadpisaniem
		const targetCompanyName = job.companyName || "";
		const targetJobTitle = job.title || "";
		console.log(`Firma docelowa (aplikacja): ${targetCompanyName}`);
		console.log(`Stanowisko docelowe (aplikacja): ${targetJobTitle}`);

		const experiences = await Promise.all(
			profile.experiences.map(async (exp, index) => {
				try {
					const originalCompanyName = exp.company || "";
					const originalTitle = exp.title || "";
					const isCurrent =
						exp.is_current || exp.date_range?.includes("Present") || false;

					console.log(`[${index}] Przetwarzanie doświadczenia:`, {
						title: originalTitle,
						company: originalCompanyName,
						isCurrent: isCurrent,
						dateRange: exp.date_range,
					});

					// Format dates - better support for existing dates
					const formattedStartDate =
						exp.start_month && exp.start_year
							? `${exp.start_year}-${String(exp.start_month).padStart(2, "0")}`
							: formatDateFromLinkedIn(exp.date_range || "", false, isCurrent);

					const formattedEndDate = isCurrent
						? null
						: exp.end_month && exp.end_year
							? `${exp.end_year}-${String(exp.end_month).padStart(2, "0")}`
							: formatDateFromLinkedIn(exp.date_range || "", true, isCurrent);

					console.log(`[${index}] Przetworzone daty:`, {
						startDate: formattedStartDate,
						endDate: formattedEndDate,
					});

					const { object } = await generateObject({
						model: model,
						schema: experienceEntrySchema,
						prompt: `As a professional resume optimizer, transform this experience into a Polish resume entry tailored for the target job.

CANDIDATE EXPERIENCE:
Title: ${originalTitle}
Company: ${originalCompanyName}
Period: ${exp.date_range || ""}
Is Current Position: ${isCurrent ? "Yes" : "No"}
Description: ${exp.description || ""}
Skills: ${exp.skills || ""}

TARGET JOB:
Title: ${targetJobTitle} (NOTE: This is the position the candidate is APPLYING for)
Company: ${targetCompanyName} (IMPORTANT: This is the company the candidate is APPLYING to, not where they worked)

JOB KEYWORDS: ${keywords}

CRITICAL RULES:
1. DO NOT TRANSLATE original job title "${originalTitle}" to "Kierownik działu marketingu" or similar generic titles.
2. KEEP ORIGINAL JOB TITLE ESSENCE. Only adjust formality or polish translation if necessary.
3. COMPANY NAME MUST REMAIN EXACTLY "${originalCompanyName}" - DO NOT CHANGE IT UNDER ANY CIRCUMSTANCES.
4. If position is current (${isCurrent}), endDate must be null.
5. Use exact dates as provided: startDate=${formattedStartDate}, endDate=${formattedEndDate || "null"}
6. BE FACTUAL - DON'T MAKE UP METRICS OR ACHIEVEMENTS WITHOUT EVIDENCE.
7. NEVER use the target company name "${targetCompanyName}" in place of the original company.

FORMATTING INSTRUCTIONS:
- Output must be in Polish
- Create 3 bullet points starting with strong past-tense verbs
- Include metrics ONLY if mentioned in original description
- Keep technical terms in English if commonly used in Polish IT
- Create 2-3 highlights showcasing key achievements (based on facts only)

FORMAT: Generate valid JSON object following experienceEntrySchema.`,
					});

					// Głębokie zabezpieczenie przed nadpisaniem danych
					const correctedObject = { ...object };

					// 1. Sprawdź i przywróć oryginalną nazwę firmy, jeśli została zmieniona
					if (correctedObject.company !== originalCompanyName) {
						console.warn(
							`[${index}] KOREKTA: AI zmieniło nazwę firmy z "${originalCompanyName}" na "${correctedObject.company}". Przywracanie oryginalnej nazwy.`,
						);
						correctedObject.company = originalCompanyName;
					}

					// 2. Sprawdź czy tytuł stanowiska nie został zamieniony na generyczny "Kierownik działu marketingu"
					const genericTitles = [
						"kierownik działu",
						"kierownik zespołu",
						"менеджер",
						"керівник",
						"kierownik marketingu",
						"head of",
						"dyrektor",
						"manager",
					];

					const isGenericTitle = genericTitles.some(
						(generic) =>
							correctedObject.title
								.toLowerCase()
								.includes(generic.toLowerCase()) &&
							!originalTitle.toLowerCase().includes(generic.toLowerCase()),
					);

					if (isGenericTitle) {
						console.warn(
							`[${index}] KOREKTA: AI zmieniło tytuł z "${originalTitle}" na generyczny "${correctedObject.title}". Przywracanie oryginalnego tytułu.`,
						);
						// Spróbuj zachować polskie znaki, ale przywróć oryginalny tytuł
						correctedObject.title = originalTitle;
					}

					// 3. Sprawdź daty - upewnij się, że data końcowa jest null dla aktualnych pozycji
					if (isCurrent && correctedObject.endDate !== null) {
						console.warn(
							`[${index}] KOREKTA: AI ustawiło datę końcową "${correctedObject.endDate}" dla aktualnej pozycji. Ustawianie na null.`,
						);
						correctedObject.endDate = null;
					}

					// 4. Sprawdź daty - upewnij się, że data początkowa jest zgodna z oryginałem
					if (
						formattedStartDate &&
						correctedObject.startDate !== formattedStartDate
					) {
						console.warn(
							`[${index}] KOREKTA: AI zmieniło datę początkową z "${formattedStartDate}" na "${correctedObject.startDate}". Przywracanie oryginalnej daty.`,
						);
						correctedObject.startDate = formattedStartDate;
					}

					// 5. Sprawdź, czy data końcowa jest zgodna z oryginałem (dla zakończonych pozycji)
					if (
						!isCurrent &&
						formattedEndDate &&
						correctedObject.endDate !== formattedEndDate
					) {
						console.warn(
							`[${index}] KOREKTA: AI zmieniło datę końcową z "${formattedEndDate}" na "${correctedObject.endDate}". Przywracanie oryginalnej daty.`,
						);
						correctedObject.endDate = formattedEndDate;
					}

					// Logowanie skorygowanych danych
					console.log(`[${index}] Dane po korekcji:`, {
						title: correctedObject.title,
						company: correctedObject.company,
						startDate: correctedObject.startDate,
						endDate: correctedObject.endDate,
					});

					return correctedObject;
				} catch (error) {
					console.error(
						`Error generating experience for ${exp.title} at ${exp.company}:`,
						error,
					);
					throw new Error(
						`Nie udało się wygenerować doświadczenia dla stanowiska ${exp.title}. Spróbuj ponownie później.`,
					);
				}
			}),
		);
		return experiences;
	} catch (error) {
		console.error("Error in generateExperienceSection:", error);
		throw new Error(
			"Wystąpił błąd podczas generowania sekcji doświadczenia. Spróbuj ponownie później.",
		);
	}
};

const generateSkillsSection = async ({
	profile,
	job,
	apiKey,
}: {
	profile: ProfileType;
	job: JobSchema;
	apiKey: string;
}) => {
	console.log("GENERATING SKILLS SECTION");
	try {
		// Extract keywords (z zabezpieczeniem przed undefined)
		const keywords = job.requiredSkills?.join(", ");

		// Parsing skills from profile to have better input
		let profileSkills: string[] = [];
		if (typeof profile.skills === "string") {
			profileSkills = profile.skills.split("|").map((s) => s.trim());
		} else if (Array.isArray(profile.skills)) {
			profileSkills = (profile.skills as unknown[]).map((s: unknown) =>
				typeof s === "string" ? s.trim() : JSON.stringify(s),
			);
		}

		console.log(
			"Extracted skills from profile:",
			profileSkills.slice(0, 10),
			"...",
		);

		const { object } = await generateObject({
			model,
			schema: z.object({
				skills: z.array(
					z.object({
						name: z.string(),
					}),
				),
			}),
			prompt: `As a resume skill optimizer, select relevant skills from the candidate's profile for the target job.

PROFILE SKILLS: ${profileSkills.join(", ")}

JOB DESCRIPTION: ${(job.title || "").slice(0, 500)} // Using job.title as placeholder for description

JOB KEYWORDS: ${keywords}

INSTRUCTIONS:
- Output must be in Polish
- Select 8-12 most relevant skills 
- IMPORTANT: Only select skills that are actually mentioned in the candidate's profile
- Keep technical skills in English (e.g., JavaScript, SEO)
- Translate soft skills to Polish
- Prioritize skills mentioned in job description
- Keep each skill concise (1-3 words)

FORMAT: Valid JSON with array of skills objects.

EXAMPLE OUTPUT:
{"skills":[{"name":"SEO"},{"name":"Content Marketing"},{"name":"Analiza danych"}]}`,
		});
		return object.skills;
	} catch (error) {
		console.error("Error in generateSkillsSection:", error);
		throw new Error(
			"Wystąpił błąd podczas generowania sekcji umiejętności. Spróbuj ponownie później.",
		);
	}
};

const generateBasicsSection = async ({
	profile,
	job,
	userContactData,
}: {
	profile: ProfileType;
	job: JobSchema;
	userContactData?: {
		email?: string;
		phone?: string;
		location?: string;
	};
}) => {
	try {
		const keywords = job.requiredSkills?.join(", ");

		const { object } = await generateObject({
			model: openRouter("anthropic/claude-3.5-sonnet"),
			schema: z.object({
				basics: z.object({
					name: z.string(),
					title: z.string(),
					summary: z.string(),
					location: z.string().optional(),
					email: z.string().optional(),
					phone: z.string().optional(),
					linkedin: z.string().optional(),
				}),
			}),
			prompt: `As a resume profile creator, craft a professional profile in Polish tailored to this job.

CANDIDATE:
Name: ${profile.first_name} ${profile.last_name}
Current Title: ${profile.headline || ""}
About: ${profile.about || ""}
Location: ${profile.location || ""}
Contact: ${profile.email || ""}, ${profile.phone || ""}
LinkedIn: ${profile.linkedin_url || ""}

TARGET JOB:
Title: ${job.title || "Stanowisko pracy"}
Company: ${job.companyName || "Firma"}
Keywords: ${keywords}

INSTRUCTIONS:
- Output must be in Polish
- Keep name unchanged as "${profile.first_name} ${profile.last_name}"
- Create relevant professional title (2-5 words)
- Write concise summary (3-4 sentences max) focusing on candidate's actual experience
- Be factual - don't exaggerate or make up skills
- Use confident, professional language
- Highlight candidate's unique value proposition based on their LinkedIn data
- Always include LinkedIn URL in the output

FORMAT: Generate valid JSON with the basics object. Include all fields.`,
		});

		const basics = { ...object.basics };

		if (basics.name !== `${profile.first_name} ${profile.last_name}`) {
			console.warn(
				`KOREKTA: AI zmieniło imię i nazwisko z "${profile.first_name} ${profile.last_name}" na "${basics.name}". Przywracanie oryginalnego.`,
			);
			basics.name = `${profile.first_name} ${profile.last_name}`;
		}

		if (userContactData?.email && userContactData.email.trim() !== "") {
			basics.email = userContactData.email;
			console.log("Zastosowano niestandardowy email:", userContactData.email);
		}

		if (userContactData?.phone && userContactData.phone.trim() !== "") {
			basics.phone = userContactData.phone;
			console.log("Zastosowano niestandardowy telefon:", userContactData.phone);
		}

		if (userContactData?.location && userContactData.location.trim() !== "") {
			basics.location = userContactData.location;
			console.log(
				"Zastosowano niestandardową lokalizację:",
				userContactData.location,
			);
		}

		if (!basics.linkedin && profile.linkedin_url) {
			basics.linkedin = profile.linkedin_url;
			console.log("Dodano brakujący URL LinkedIn");
		}

		console.log("Finalne dane podstawowe po aktualizacji:", basics);

		return basics;
	} catch (error) {
		console.error("Error in generateBasicsSection:", error);
		throw new Error(
			"Wystąpił błąd podczas generowania podstawowych informacji. Spróbuj ponownie później.",
		);
	}
};

const generateInterestsSection = async ({
	profile,
	job,
}: {
	profile: ProfileType;
	job: JobSchema;
}) => {
	try {
		// Wyciągnij potencjalne zainteresowania z opisu "about"
		const aboutText = profile.about || "";
		const potentialInterests =
			aboutText.match(
				/jazz|muzyka|music|kawa|coffee|lego|gry|games|sport|podróże|travel|książki|books|fotografia|photography|programowanie|coding|technology|projektowanie|design/gi,
			) || [];

		console.log(
			"Potencjalne zainteresowania wyciągnięte z profilu:",
			potentialInterests,
		);

		const { object } = await generateObject({
			model: model,
			schema: z.object({
				interests: z.array(z.string()),
			}),
			prompt: `As a resume consultant, create a list of interests in Polish that enhance the candidate's profile.

CANDIDATE INFO:
${profile.about || ""}
${profile.headline || ""}

DETECTED POTENTIAL INTERESTS: ${potentialInterests.join(", ")}

TARGET COMPANY:
${job.companyName || "Firma"}

INSTRUCTIONS:
- Output must be in Polish
- Select 5-6 diverse interests showing personality
- IMPORTANT: Only select interests that are mentioned or implied in the candidate's profile
- Keep brand names in original form
- Choose conversation-starter interests for interviews
- Keep each skill concise (1-3 words)
- Avoid controversial topics
- Include interests showcasing job-relevant skills

FORMAT: Return valid JSON with array of string interests.`,
		});
		return object.interests;
	} catch (error) {
		console.error("Error in generateInterestsSection:", error);
		throw new Error(
			"Wystąpił błąd podczas generowania sekcji zainteresowań. Spróbuj ponownie później.",
		);
	}
};

export const generateLanguagesSection = async ({
	profile,
}: {
	profile: ProfileType;
}) => {
	console.log("GENERATING LANGUAGES SECTION");
	try {
		// Language parsing logic remains the same
		if (
			!profile.languages ||
			(Array.isArray(profile.languages) && profile.languages.length === 0)
		) {
			console.log("Brak danych o językach w profilu");
			return [];
		}

		console.log(
			"Surowe dane o językach:",
			JSON.stringify(profile.languages, null, 2),
		);

		// Explicitly type the languages array
		let languages: { language: string; fluency: string }[] = [];
		const languagesData = profile.languages as LanguagesData;

		if (typeof languagesData === "string") {
			console.log("Języki są w formacie string:", languagesData);
			const langArray = languagesData.split(",");
			languages = langArray.map((lang: string) => ({
				language: lang.trim(),
				fluency: "Biegły", // Default fluency for string format
			}));
		} else if (Array.isArray(languagesData)) {
			console.log(
				"Języki są w formacie tablicy, długość:",
				languagesData.length,
			);

			languages = languagesData
				.map((lang, index): { language: string; fluency: string } | null => {
					console.log(`Analizuję język [${index}]:`, typeof lang, lang);

					if (typeof lang === "string") {
						return {
							language: lang.trim(),
							fluency: "Biegły", // Default fluency
						};
					}
					if (typeof lang === "object" && lang !== null) {
						const langObj = lang as Record<string, unknown>;

						const possibleLanguageKeys = [
							"language",
							"name",
							"lang",
							"languageName",
						];
						const possibleFluencyKeys = ["fluency", "proficiency", "level"];

						let language = "Nieznany";
						let fluency: string | undefined = undefined; // Initialize as potentially undefined

						for (const key of possibleLanguageKeys) {
							if (langObj[key] && typeof langObj[key] === "string") {
								language = (langObj[key] as string).trim();
								break;
							}
						}

						for (const key of possibleFluencyKeys) {
							if (langObj[key] && typeof langObj[key] === "string") {
								fluency = (langObj[key] as string).trim();
								break;
							}
						}

						if (language === "Nieznany" && Object.keys(langObj).length > 0) {
							const firstKey = Object.keys(langObj)[0];
							if (firstKey && typeof langObj[firstKey] === "string") {
								language = firstKey.trim();
								if (typeof langObj[firstKey] === "string") {
									fluency = (langObj[firstKey] as string).trim();
								}
							}
						}

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

						// Determine final fluency safely
						let finalFluency = "Podstawowa"; // Start with default
						if (typeof fluency === "string") {
							// Only work with fluency if it's a string
							const lowerFluency = fluency.toLowerCase();
							// Try direct match first, then lowercase match
							const mapped = fluencyMap[fluency] ?? fluencyMap[lowerFluency];
							// Assign mapped value if found, otherwise the original (guaranteed string) fluency
							finalFluency = mapped ?? fluency;
						}
						// If fluency was not a string, finalFluency remains "Podstawowa"

						return { language, fluency: finalFluency };
					}
					return null;
				})
				.filter(
					(lang): lang is { language: string; fluency: string } =>
						lang !== null,
				); // Type guard filter
		}

		console.log("Przetworzone języki:", languages);
		return languages;
	} catch (error) {
		console.error("Error in generateLanguagesSection:", error);
		return []; // Return empty array on error
	}
};

// Weryfikacja wygenerowanych danych przed zwróceniem
const validateGeneratedResume = (
	resume: Record<string, unknown>,
	profile: ProfileType,
	job: JobSchema,
) => {
	console.log("VALIDATING GENERATED RESUME");

	const targetCompany = job.companyName;
	let issues = 0;

	// 1. Sprawdź doświadczenie - nazwy firm i tytułów
	if (resume.experience && Array.isArray(resume.experience)) {
		resume.experience.forEach((exp: Record<string, unknown>, index: number) => {
			// Sprawdź, czy firma docelowa nie pojawiła się w doświadczeniu
			const originalExp = profile.experiences[index];
			if (!originalExp) return;

			if (
				exp.company === targetCompany &&
				originalExp.company !== targetCompany
			) {
				console.error(
					`BŁĄD KRYTYCZNY: Firma ${targetCompany} pojawiła się w doświadczeniu na pozycji ${index}, choć powinna być ${originalExp.company}`,
				);
				exp.company = originalExp.company;
				issues++;
			}

			// Sprawdź, czy tytuł nie został zmieniony na generyczny
			const genericTitles = [
				"kierownik działu",
				"kierownik zespołu",
				"менеджер",
				"керівник",
				"kierownik marketingu",
				"head of",
				"dyrektor",
				"manager",
			];

			const isGenericTitle = genericTitles.some(
				(generic) =>
					typeof exp.title === "string" &&
					exp.title.toLowerCase().includes(generic.toLowerCase()) &&
					originalExp.title &&
					!originalExp.title.toLowerCase().includes(generic.toLowerCase()),
			);

			if (isGenericTitle) {
				console.error(
					`BŁĄD: Tytuł stanowiska w doświadczeniu ${index} został zmieniony na generyczny: ${exp.title}`,
				);
				exp.title = originalExp.title;
				issues++;
			}

			// Sprawdź, czy daty są zachowane prawidłowo
			const isCurrent =
				originalExp.is_current ||
				originalExp.date_range?.includes("Present") ||
				false;
			if (isCurrent && exp.endDate !== null) {
				console.error(
					`BŁĄD: Data końcowa dla aktualnej pozycji ${index} powinna być null, ale jest: ${exp.endDate}`,
				);
				exp.endDate = null;
				issues++;
			}
		});
	}

	console.log(
		`Walidacja zakończona, znaleziono ${issues} problemów, które zostały naprawione.`,
	);
	return { ...resume, validationIssues: issues };
};

export const generateResumeContent = async ({
	profile,
	job,
	model = "anthropic/claude-3.5-sonnet",
	apiKey,
	userContactData,
}: {
	profile: ProfileType;
	job: JobSchema;
	model: string;
	apiKey: string;
	userContactData?: {
		email?: string;
		phone?: string;
		location?: string;
	};
}) => {
	// Zapisujemy nazwę firmy docelowej (do której aplikujemy)
	const targetCompany = job.companyName || "Brak nazwy firmy";

	const [basics, experience, skills, interests, languages] = await Promise.all([
		generateBasicsSection({ profile, job, apiKey, userContactData }),
		generateExperienceSection({ profile, job, apiKey }),
		generateSkillsSection({ profile, job, apiKey }),
		generateInterestsSection({ profile, job, apiKey }),
		generateLanguagesSection({ profile, apiKey }),
	]);

	// Przygotuj dane edukacji
	const education = profile.educations.map((edu) => ({
		school: edu.school,
		degree: edu.degree,
		field: edu.field_of_study,
		startDate:
			edu.start_month && edu.start_year
				? `${edu.start_month} ${edu.start_year}`
				: "Brak daty",
		endDate:
			edu.end_year && edu.end_month
				? `${edu.end_month} ${edu.end_year}`
				: undefined,
		activities: edu.activities,
	}));

	// Przygotuj dane CV
	const resumeData = {
		basics,
		experience,
		education,
		skills,
		interests,
		languages,
		jobDetails: {
			jobTitle: job.title || "Stanowisko",
			companyName: targetCompany,
		},
	};

	const validatedResumeData = validateGeneratedResume(resumeData, profile, job);

	return validatedResumeData;
};

const experienceEntrySchema = z.object({
	title: z.string().describe("Job title or role at the company"),
	company: z.string().describe("Name of the employer or organization"),
	location: z
		.string()
		.nullable()
		.describe("Physical location where the work was performed"),
	startDate: z.string().describe("Date when employment began"),
	endDate: z
		.string()
		.nullable()
		.describe("Date when employment ended, if applicable"),
	description: z
		.array(z.string())
		.describe(
			"List of responsibilities and achievements in bullet point format",
		),
	highlights: z
		.array(z.string())
		.describe("Key accomplishments or notable projects during tenure"),
});
