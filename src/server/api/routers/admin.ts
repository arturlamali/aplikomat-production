import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { JobSchemaRocketJobs } from "../schemas/jobs";
import { v4 as uuidv4 } from "uuid";
import { jobs } from "~/server/db/schema.postgres";
import { eq, inArray } from "drizzle-orm";
import type { SQL, Placeholder } from "drizzle-orm";

// Define category ID to name mapping
const categoryIdToName: Record<string, string> = {
	"1": "Marketing",
	"2": "Marketing",
	"3": "Social media",
	"4": "Performance (SEM)",
	"5": "Public Relations",
	"6": "Content / Copywriting",
	"7": "eCommerce",
	"8": "Sprzedaż",
	"9": "Finanse",
	"10": "Analiza",
	"11": "Księgowość",
	"12": "Kontroling",
	"14": "BPO/SSC",
	"15": "Podatki",
	"16": "Audyt",
	"17": "Inne",
	"18": "Inżynieria",
	"19": "Automatyka",
	"20": "Elektronika",
	"21": "Technologia / Konstrukcje",
	"22": "Projektowanie",
	"23": "Motoryzacja",
	"24": "Inne",
	"25": "Design",
	"26": "Grafika 2D",
	"27": "Grafika 3D",
	"28": "UX/UI",
	"29": "Motion Design",
	"30": "HR",
	"31": "Recruitment",
	"32": "Leadership",
	"33": "Office",
	"34": "Research",
	"35": "Employer Branding",
	"36": "Payroll",
	"37": "Inne",
	"38": "Consulting",
	"39": "BI & Data",
	"41": "Zarządzanie",
	"42": "Media",
	"43": "Obsługa klienta",
	"44": "Inne",
	"45": "IT",
	"46": "HR",
	"47": "Logistyka",
	"48": "Logistyka",
	"49": "Spedycja",
	"50": "Administracja",
	"51": "Inne",
	"52": "Prawo",
	"53": "Zdrowie i uroda",
	"54": "Opieka medyczna",
	"55": "Farmacja",
	"56": "Rehabilitacja",
	"57": "Inne",
	"63": "Kierowca",
	"64": "Kurier",
	"65": "Sprzedaż",
	"69": "Inne",
	"71": "Praca biurowa",
	"86": "Budownictwo",
	"87": "Architektura / Projektowanie",
	"88": "Ekologiczne",
	"89": "Energetyczne",
	"90": "Infrastrukturalne",
	"91": "Instalacje",
	"92": "Mieszkaniowe i przemysłowe",
	"93": "Produkcja",
	"94": "Optymalizacja procesu produkcji",
	"95": "Pracownicy produkcyjni",
	"96": "Utrzymanie ruchu",
	"97": "Zarządzanie produkcją",
	"98": "Edukacja",
	"99": "Nauka języków obcych",
	"100": "Szkolenia / Rozwój osobisty",
	"101": "Szkolnictwo",
	"102": "Nieruchomości",
	"103": "Wynajem / Wycena",
	"104": "Zarządzanie nieruchomościami",
	"105": "Utrzymanie nieruchomości",
	"106": "Bankowość",
	"107": "Analiza / ryzyko",
	"108": "Bankowość detaliczna",
	"109": "Bankowość inwestycyjna",
	"110": "Bankowość korporacyjna / SME",
	"111": "Pośrednictwo finansowe",
	"112": "Turystyka",
	"113": "Gastronomia",
	"114": "Praca w sklepie",
	"115": "Energetyka",
	"116": "Mechanika",
	"117": "Ochrona Środowiska",
	"118": "Telekomunikacja",
	"119": "Zarządzanie flotą",
	"120": "Rynki kapitałowe",
	"121": "Inne",
	"122": "Laboratorium",
	"123": "Lekarze",
	"124": "Pielęgniarstwo",
	"125": "Sport",
	"126": "Uroda",
	"127": "Prawnicy",
	"128": "Specjaliści",
	"129": "Windykacja",
	"130": "Wsparcie usług prawnych",
	"131": "Dziennikarstwo",
	"132": "Media",
	"133": "Produkcja",
	"134": "Zarządzanie",
	"135": "Biznes / Strategia",
	"136": "Finanse",
	"137": "IT / Telekomunikacja",
	"138": "Podatki / Prawo",
	"139": "Sektor publiczny",
	"140": "Inne",
	"141": "SEO",
	"142": "Korekta i tłumaczenia",
	"143": "Przetwarzanie danych",
	"144": "Sekretariat / Recepcja",
	"145": "Stanowiska asystenckie",
	"146": "Administracja",
	"147": "Energia / Środowisko",
	"148": "Farmacja / Medycyna",
	"149": "Finanse / Bankowość / Ubezpieczenia",
	"150": "Inżynieria / Technika / Produkcja",
	"151": "IT i telekomunikacja",
	"152": "Marketing / Reklama / Media",
	"153": "Motoryzacja / Transport",
	"154": "Sprzedawcy",
	"155": "Turystyka / Hotelarstwo / Catering",
	"156": "Usługi profesjonalne",
	"157": "Inne",
	"158": "Kosmetyki / Chemia",
	"159": "Nieruchomości / Budownictwo",
	"160": "Odzież i akcesoria",
	"161": "RTV / AGD / Artykuły przemysłowe",
	"162": "Sieci handlowe",
	"163": "Wyposażenie domu",
	"164": "Energia / Środowisko",
	"165": "Farmacja / Medycyna",
	"166": "Finanse / Bankowość / Ubezpieczenia",
	"167": "Inżynieria / Technika / Produkcja",
	"168": "IT i telekomunikacja",
	"169": "Marketing / Reklama / Media",
	"170": "Motoryzacja / Transport",
	"171": "Turystyka / Hotelarstwo / Catering",
	"172": "Usługi profesjonalne",
};

// Define types for employment types based on schema
type EmploymentType = {
	from: number | null;
	to: number | null;
	currency: string;
	type: string;
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
};

// Define types for multilocation based on schema
type Location = {
	city: string | null;
	slug: string | null;
	street: string | null;
	latitude: number | null;
	longitude: number | null;
};

// Define types for our job data
type JobDataBase = {
	guid: string;
	slug: string;
	title: string;
	requiredSkills: string[] | [];
	niceToHaveSkills: string[] | [];
	workplaceType: string;
	workingTime: string;
	experienceLevel: string;
	employmentTypes: EmploymentType[];
	categoryId: string;
	categoryName: string;
	multilocation: Location[] | [];
	city: string;
	street: string;
	latitude: string;
	longitude: string;
	remoteInterview: string;
	companyName: string;
	companyLogoThumbUrl: string;
	publishedAt: string;
	openToHireUkrainians: string;
	languages: string[];
	plan: string;
	updatedAt: string;
};

type JobToUpdate = JobDataBase & { id: string };
type JobToInsert = JobDataBase & { id: string; createdAt: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asDbInsertType = (data: any) => data;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asDbUpdateType = (data: any) => data;

export const adminRouter = createTRPCRouter({
	uploadJobs: privateProcedure
		.input(
			z.object({
				jobs: z.array(JobSchemaRocketJobs),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const { db } = ctx;
				const BATCH_SIZE = 100;

				// Extract all guids from input jobs
				const inputGuids = input.jobs.map((job) => job.guid);

				// Fetch all existing jobs with these guids in a single query
				const existingJobs = await db
					.select()
					.from(jobs)
					.where(inArray(jobs.guid, inputGuids));

				// Create a map for quick lookup
				const existingJobsMap = new Map(
					existingJobs.map((job) => [job.guid, job]),
				);

				// Prepare data for bulk operations
				const jobsToUpdate: JobToUpdate[] = [];
				const jobsToInsert: JobToInsert[] = [];

				// Process each job and sort into update or insert
				for (const job of input.jobs) {
					const categoryId = job.categoryId.toString();

					// Transform the job data to match our database schema
					const jobData: JobDataBase = {
						guid: job.guid,
						slug: job.slug,
						title: job.title,
						requiredSkills: job.requiredSkills || [],
						niceToHaveSkills: job.niceToHaveSkills || [],
						workplaceType: job.workplaceType,
						workingTime: job.workingTime,
						experienceLevel: job.experienceLevel,
						employmentTypes: job.employmentTypes,
						categoryId: categoryId,
						categoryName:
							categoryIdToName[categoryId] ||
							`Unknown Category (${categoryId})`,
						multilocation: job.multilocation || [],
						city: job.city,
						street: job.street,
						latitude: job.latitude.toString(),
						longitude: job.longitude.toString(),
						remoteInterview: job.remoteInterview.toString(),
						companyName: job.companyName,
						companyLogoThumbUrl: job.companyLogoThumbUrl,
						publishedAt: job.publishedAt,
						openToHireUkrainians: job.openToHireUkrainians.toString(),
						languages: job.languages.map((lang) => {
							if (!lang) return "";
							if (typeof lang === "string") return lang;
							if (lang.code && lang.level) return `${lang.code}:${lang.level}`;
							return "";
						}),
						plan: job.plan,
						updatedAt: new Date().toISOString(),
					};

					if (existingJobsMap.has(job.guid)) {
						const existingJob = existingJobsMap.get(job.guid);
						if (existingJob) {
							// Add to update array with existing id
							jobsToUpdate.push({
								...jobData,
								id: existingJob.id,
							});
						}
					} else {
						// Add to insert array with new id
						jobsToInsert.push({
							id: uuidv4(),
							...jobData,
							createdAt: new Date().toISOString(),
						});
					}
				}

				// Perform bulk operations
				let inserted = 0;
				let updated = 0;

				// Split inserts into batches of BATCH_SIZE
				if (jobsToInsert.length > 0) {
					const insertBatches = [];
					for (let i = 0; i < jobsToInsert.length; i += BATCH_SIZE) {
						insertBatches.push(jobsToInsert.slice(i, i + BATCH_SIZE));
					}

					// Process each batch
					for (const batch of insertBatches) {
						await db.insert(jobs).values(asDbInsertType(batch));
						inserted += batch.length;
					}
				}

				// Bulk update - Drizzle doesn't directly support bulk update,
				// so we'll use a transaction with individual updates in batches
				if (jobsToUpdate.length > 0) {
					const updateBatches = [];
					for (let i = 0; i < jobsToUpdate.length; i += BATCH_SIZE) {
						updateBatches.push(jobsToUpdate.slice(i, i + BATCH_SIZE));
					}

					// Process each batch in a separate transaction
					for (const batch of updateBatches) {
						await db.transaction(async (tx) => {
							for (const job of batch) {
								const { id, ...updateData } = job;
								await tx
									.update(jobs)
									.set(asDbUpdateType(updateData))
									.where(eq(jobs.id, id));
							}
						});
						updated += batch.length;
					}
				}

				return {
					success: true,
					inserted,
					updated,
					total: input.jobs.length,
				};
			} catch (error) {
				console.error("Error processing jobs:", error);
				throw new Error("Failed to process jobs");
			}
		}),
});
