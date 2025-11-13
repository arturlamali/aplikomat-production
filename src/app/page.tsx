//src/app/page.tsx
"use client";

import React, { useRef, useEffect } from "react";
import {
	LinkedinIcon,
	Link,
	Download,
	Sparkles,
	ArrowRight,
	CheckCircle2,
	Star,
	Loader2,
	Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { pdf } from "@react-pdf/renderer";
import { ResumePDF } from "~/components/ResumePDF";
import { type z } from "zod";
import { type linkedinJobResponse } from "~/server/api/schemas/linkedin";

import { BorderBeam } from "./landingPageComponents/BorderBeam";
import { Particles } from "./landingPageComponents/Particles";
import { StepBox } from "./landingPageComponents/StepBox";
import { TestimonialsSection } from "./landingPageComponents/TestimonialsSection";
import { JobBoardsSection } from "./landingPageComponents/JobBoardsSection";
import { EnhancedStatsSection } from "./landingPageComponents/EnhancedStatsSection";
import { CompanySection } from "./landingPageComponents/CompanySection";
import { api } from "~/trpc/react";
import { LoadingTips } from "~/components/LoadingTips";
import { ContactForm, type ContactFormData } from "~/components/ContactForm";

// Cache keys for localStorage
const CACHE_KEYS = {
	LINKEDIN_URL: "aplikomat_linkedin_url",
	JOB_URL: "aplikomat_job_url",
	CONTACT_DATA: "aplikomat_contact_data",
};

function App() {
	// Refs for background processing
	const isJobDataPrefetching = useRef(false);
	const isGeneratingInBackground = useRef(false);

	// State for UI
	const [linkedinUrl, setLinkedinUrl] = React.useState<string>("");
	const [jobUrl, setJobUrl] = React.useState<string>("");
	const [currentStep, setCurrentStep] = React.useState(1);
	const [isGenerating, setIsGenerating] = React.useState(false);
	const [generatedPdfBase64, setGeneratedPdfBase64] = React.useState<
		string | null
	>(null);
	const [selectedModel, setSelectedModel] = React.useState<string | null>(null);
	const [showLinkedinHelper, setShowLinkedinHelper] = React.useState(false);
	const [showJobsHelper, setShowJobsHelper] = React.useState(false);
	const [profileSubmitted, setProfileSubmitted] = React.useState(false);
	const [isProfileLoading, setIsProfileLoading] = React.useState(false);
	const [jobUrlError, setJobUrlError] = React.useState<string | null>(null);
	const [profileFetched, setProfileFetched] = React.useState(false);
	const [contactData, setContactData] = React.useState<ContactFormData>({
		email: "",
		phone: "",
		location: "",
	});
	const [contactDataSubmitted, setContactDataSubmitted] = React.useState(false);
	const [resumeData, setResumeData] = React.useState<any>(null);
	const [isPreGenerating, setIsPreGenerating] = React.useState(false);
	const [preGeneratedResume, setPreGeneratedResume] = React.useState<any>(null);
	const [generationProgress, setGenerationProgress] = React.useState(0);
	const [isLoadingJobInBackground, setIsLoadingJobInBackground] =
		React.useState(false);

	// Load cached data on initial render
	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				// Load cached LinkedIn URL
				const cachedLinkedinUrl = localStorage.getItem(CACHE_KEYS.LINKEDIN_URL);
				if (cachedLinkedinUrl) {
					setLinkedinUrl(cachedLinkedinUrl);
				}

				// Load cached Job URL
				const cachedJobUrl = localStorage.getItem(CACHE_KEYS.JOB_URL);
				if (cachedJobUrl) {
					setJobUrl(cachedJobUrl);
				}

				// Load cached contact data
				const cachedContactData = localStorage.getItem(CACHE_KEYS.CONTACT_DATA);
				if (cachedContactData) {
					setContactData(JSON.parse(cachedContactData));
				}
			} catch (error) {
			}
		}
	}, []);

	// Save linkedinUrl to localStorage when it changes
	useEffect(() => {
		if (linkedinUrl && typeof window !== "undefined") {
			localStorage.setItem(CACHE_KEYS.LINKEDIN_URL, linkedinUrl);
		}
	}, [linkedinUrl]);

	// Save jobUrl to localStorage when it changes
	useEffect(() => {
		if (jobUrl && typeof window !== "undefined") {
			localStorage.setItem(CACHE_KEYS.JOB_URL, jobUrl);
		}
	}, [jobUrl]);

	// Save contact data to localStorage when it changes
	useEffect(() => {
		if (contactData.email || contactData.phone) {
			localStorage.setItem(
				CACHE_KEYS.CONTACT_DATA,
				JSON.stringify(contactData),
			);
		}
	}, [contactData]);

	// Start progress bar animation effect
	useEffect(() => {
		if (isGenerating && !resumeData) {
			const interval = setInterval(() => {
				setGenerationProgress((prev) => {
					if (prev >= 90) {
						clearInterval(interval);
						return prev;
					}
					return prev + (90 - prev) / 10;
				});
			}, 1000);

			return () => clearInterval(interval);
		} else if (resumeData) {
			setGenerationProgress(100);
		}
	}, [isGenerating, resumeData]);

	// Get available models
	const { data: availableModels = [] } = api.resume.getAvailableModels.useQuery(
		{},
		{
			refetchOnWindowFocus: false,
			staleTime: Infinity,
		},
	);

	// Ulepszona funkcja ekstrakcji ID z URL oferty pracy
	const extractJobId = (url: string): string => {
		if (!url) return "";

		const viewMatch = /view\/(\d+)/.exec(url);
		if (viewMatch?.[1]) return viewMatch[1];

		const viewDetailsMatch = /view-details\/(\d+)/.exec(url);
		if (viewDetailsMatch?.[1]) return viewDetailsMatch[1];

		const directIdMatch = /^(\d{9,12})$/.exec(url.trim());
		if (directIdMatch?.[1]) return directIdMatch[1];

		return "";
	};

	const isLinkedinValid = linkedinUrl.includes("linkedin.com");

	// Sprawdzenie poprawności URL oferty pracy
	const isJobUrlValid = (url: string): boolean => {
		if (!url) return false;

		const viewMatch = /view\/(\d+)/.exec(url);
		if (viewMatch?.[1]) return true;

		const viewDetailsMatch = /view-details\/(\d+)/.exec(url);
		if (viewDetailsMatch?.[1]) return true;

		const isLinkedInJobUrl = url.includes("linkedin.com/jobs");
		const hasJobId = extractJobId(url) !== "";
		const isDirectJobId = /^\d{9,12}$/.test(url.trim());

		return (isLinkedInJobUrl && hasJobId) || isDirectJobId;
	};

	// Obsługa zmiany adresu URL oferty
	const handleJobUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setJobUrl(value);
		setJobUrlError(null);

		if (value && !isJobUrlValid(value)) {
			setJobUrlError(
				"Wprowadź poprawny adres oferty z LinkedIn (np. https://www.linkedin.com/jobs/view/XXXXXXXXX)",
			);
		}

		// Rozpocznij prefetching danych oferty, gdy URL jest poprawny
		if (isJobUrlValid(value)) {
			prefetchJobData(extractJobId(value));
		}
	};

	// Funkcja do prefetching danych oferty pracy
	const prefetchJobData = async (jobId: string) => {
		if (jobId && !isJobDataPrefetching.current) {
			isJobDataPrefetching.current = true;
			try {
				await getLinkedinJobByUrl.prefetch({ id: jobId });
			} catch (error) {
			} finally {
				isJobDataPrefetching.current = false;
			}
		}
	};

	// TRPC queries and mutations
	const {
		data: profileData,
		isLoading: _isLoadingProfile,
		error: _profileError,
		isSuccess: isProfileSuccess,
	} = api.linkedinScraper.getLinkedinProfileByUrl.useQuery(
		{ url: linkedinUrl },
		{
			enabled: profileSubmitted && isLinkedinValid,
			onSuccess: () => {
				setIsProfileLoading(false);
				setProfileFetched(true);

				// Automatyczne przejście do kroku 2 po pomyślnym pobraniu profilu
				setCurrentStep(2);

				// Rozpocznij prefetching oferty pracy, jeśli URL jest już dostępny
				if (isJobUrlValid(jobUrl)) {
					prefetchJobData(extractJobId(jobUrl));
				}
			},
			onError: () => {
				setIsProfileLoading(false);
			},
			retry: 1,
			refetchOnWindowFocus: false,
			staleTime: 1000 * 60 * 60, // 1 godzina
			cacheTime: 1000 * 60 * 60 * 24, // 24 godziny
		},
	);

	// Efekt do obsługi zmiany stanu profilu
	React.useEffect(() => {
		if (profileData && isProfileSuccess) {
			setProfileFetched(true);
			setIsProfileLoading(false);
			setCurrentStep(2); // Zapewnia, że po pobraniu profilu, krok jest ustawiony na 2

			// Ustawienie domyślnych danych kontaktowych z profilu LinkedIn
			if (profileData.email || profileData.phone || profileData.location) {
				setContactData((prev) => ({
					...prev,
					email: profileData.email || prev.email,
					phone: profileData.phone || prev.phone,
					location: profileData.location || prev.location,
				}));
			}
		}
	}, [profileData, isProfileSuccess]);

	const getLinkedinJobByUrl = api.linkedinScraper.getLinkedinJobByUrl;

	const {
		data: jobData,
		isLoading: isLoadingJob,
		error: jobError,
		isSuccess: isJobSuccess,
	} = getLinkedinJobByUrl.useQuery(
		{ id: extractJobId(jobUrl) },
		{
			enabled:
				isJobUrlValid(jobUrl) && (profileFetched || isLoadingJobInBackground),
			onSuccess: () => {
				// Ustaw stan gotowości oferty
				setIsLoadingJobInBackground(false);

				// Jeśli jesteśmy w kroku 3 i mamy wybrany model, rozpocznij wstępne generowanie
				if (
					currentStep === 3 &&
					selectedModel &&
					!isGeneratingInBackground.current
				) {
					startBackgroundGeneration();
				}
			},
			onError: () => {
				setJobUrlError(
					"Nie udało się pobrać danych oferty. Sprawdź poprawność adresu URL.",
				);
				setIsLoadingJobInBackground(false);
			},
			retry: 1,
			refetchOnWindowFocus: false,
			staleTime: 1000 * 60 * 60, // 1 godzina
			cacheTime: 1000 * 60 * 60 * 24, // 24 godziny
		},
	);

	// Rozpocznij wstępne generowanie CV
	const startBackgroundGeneration = () => {
		if (
			!profileData ||
			!jobData ||
			!selectedModel ||
			isGeneratingInBackground.current
		) {
			return;
		}

		isGeneratingInBackground.current = true;
		setIsPreGenerating(true);

		const { jobTitle, companyName, jobDescription } =
			extractJobDetails(jobData);

		generateResumeMutation.mutate(
			{
				linkedinProfile: profileData,
				linkedinJob: {
					...jobData,
					job_title: jobTitle,
					company_name: companyName,
					job_description: jobDescription,
				} as z.infer<typeof linkedinJobResponse>,
				model: selectedModel,
				// Na razie bez danych kontaktowych, dodamy je później
				userContactData: {
					email: "",
					phone: "",
					location: "",
				},
			},
			{
				onSuccess: (result) => {
					setPreGeneratedResume(result);
					setIsPreGenerating(false);
					isGeneratingInBackground.current = false;
				},
				onError: (error) => {
					setIsPreGenerating(false);
					isGeneratingInBackground.current = false;
				},
			},
		);
	};

	const generateResumeMutation = api.resume.generateResume.useMutation();

	// Poprawiona funkcja sanityzacji tekstu do nazwy pliku
	const sanitizeForFileName = (text?: string, defaultValue = ""): string => {
		if (!text) return defaultValue;

		return text
			.replace(/\s+/g, "-") // Zamień spacje na myślniki
			.replace(/[/\\:*?"<>|]/g, "") // Usuń nieprawidłowe znaki plików
			.replace(/[^a-zA-Z0-9\-_]/g, "") // Usuń wszystkie inne znaki specjalne
			.toLowerCase(); // Zamień na małe litery
	};

	// Zmieniona funkcja handleGenerate - tylko pokazuje formularz i zapisuje model
	const handleGenerate = (model?: string) => {
		if (!profileData || !jobData) {
			return;
		}

		// Ustawiamy stan generowania na true - pokazuje formularz
		setIsGenerating(true);
		setSelectedModel(model ?? null);
		setGenerationProgress(5); // Rozpocznij animację paska postępu od 5%

		// Resetujemy wcześniejszy stan
		setContactDataSubmitted(false);
		setResumeData(null);

		// Sprawdź, czy mamy już wstępnie wygenerowane CV dla tego modelu
		if (preGeneratedResume && selectedModel === model) {
		} else {
			// Rozpocznij wstępne generowanie CV
			startBackgroundGeneration();
		}

	};

	const extractJobDetails = (jobData: any) => {
		// Sprawdzamy różne możliwe struktury danych z API LinkedIn

		// Sprawdzamy, czy dane są bezpośrednio w obiekcie
		if (jobData && jobData.job_title && jobData.company_name) {
			return {
				jobTitle: jobData.job_title,
				companyName: jobData.company_name,
				jobDescription: jobData.job_description || "",
			};
		}

		// Sprawdzamy, czy dane są w polu 'data'
		if (jobData && jobData.data) {
			if (jobData.data.job_title && jobData.data.company_name) {
				return {
					jobTitle: jobData.data.job_title,
					companyName: jobData.data.company_name,
					jobDescription: jobData.data.job_description || "",
				};
			}
		}

		// Jeśli nie znaleziono odpowiedniej struktury, zwracamy wartości domyślne
		return {
			jobTitle: "Stanowisko",
			companyName: "Firma",
			jobDescription: "",
		};
	};
	// Zmieniona funkcja handleContactDataSubmit - przekazuje dane kontaktowe bezpośrednio
	const handleContactDataSubmit = async (data: ContactFormData) => {

		// Sprawdź czy dane są prawidłowe
		if (!data.email || !data.phone) {
			alert("Proszę podać email i numer telefonu.");
			return;
		}

		// Zapisz dane do stanu
		setContactData(data);
		setContactDataSubmitted(true);


		// Sprawdzamy czy mamy wszystkie potrzebne dane
		if (!profileData || !jobData || !selectedModel) {
			alert("Brak wszystkich wymaganych danych. Spróbuj ponownie.");
			setIsGenerating(false);
			return;
		}

		try {
			setGenerationProgress(30); // Aktualizuj pasek postępu

			// Pobieramy dokładne dane oferty
			const { jobTitle, companyName, jobDescription } =
				extractJobDetails(jobData);

				jobTitle,
				companyName,
				jobDescription: jobDescription.slice(0, 100) + "...",
			});

			// Jeśli mamy już wstępnie wygenerowane CV, użyj go dodając dane kontaktowe
			if (preGeneratedResume && !resumeData) {
					"Używam wstępnie wygenerowanego CV i dodaję dane kontaktowe",
				);
				setGenerationProgress(60);

				// Aktualizuj dane kontaktowe w wstępnie wygenerowanym CV
				const updatedPreGenerated = {
					...preGeneratedResume,
					content: {
						...preGeneratedResume.content,
						basics: {
							...preGeneratedResume.content.basics,
							email: data.email,
							phone: data.phone,
							location:
								data.location || preGeneratedResume.content.basics.location,
						},
					},
				};

				setResumeData(updatedPreGenerated);
				setGenerationProgress(80);

				// Generujemy PDF z danymi kontaktowymi
				generatePdfWithContactData(updatedPreGenerated, data, {
					jobTitle,
					companyName,
				});
				return;
			}

			// Jeśli nie mamy wstępnie wygenerowanego CV, generujemy nowe
			setGenerationProgress(40);
			const result = await generateResumeMutation.mutateAsync({
				linkedinProfile: profileData,
				linkedinJob: {
					...jobData,
					job_title: jobTitle,
					company_name: companyName,
					job_description: jobDescription,
				} as z.infer<typeof linkedinJobResponse>,
				model: selectedModel,
				userContactData: {
					email: data.email,
					phone: data.phone,
					location: data.location || "",
				},
			});

			setGenerationProgress(80);

			// Zapisujemy dane z API
			setResumeData(result);

			// Generujemy PDF z danymi kontaktowymi - przekazujemy dane kontaktowe bezpośrednio
			generatePdfWithContactData(result, data, { jobTitle, companyName });
		} catch (error) {
			alert("Wystąpił błąd podczas generowania CV. Spróbuj ponownie.");
			setIsGenerating(false);
			setGenerationProgress(0);
		}
	};

	const generatePdfWithContactData = async (
		result: any,
		contactFormData: ContactFormData,
		jobDetails?: { jobTitle: string; companyName: string },
	) => {
		try {
				contactFormData,
				jobDetails,
				hasResult: !!result,
			});

			// Teraz używamy przekazanych danych, a nie stanu
			if (!contactFormData.email || !contactFormData.phone) {
					"Brak wymaganych danych kontaktowych - email lub telefon",
				);
				alert("Proszę podać email i numer telefonu przed wygenerowaniem CV.");
				return;
			}

			if (!result || !result.content) {
				alert("Wystąpił błąd podczas generowania CV. Spróbuj ponownie.");
				setIsGenerating(false);
				return;
			}

			// Pobieramy dane oferty
			const jobDataObj = jobData?.data || jobData;

			const companyName =
				jobDetails?.companyName ||
				jobDataObj?.company_name ||
				(jobDataObj?.data && jobDataObj.data.company_name) ||
				"Firma";

			const jobTitle =
				jobDetails?.jobTitle ||
				jobDataObj?.job_title ||
				(jobDataObj?.data && jobDataObj.data.job_title) ||
				"Stanowisko";

			// WAŻNA ZMIANA: Sprawdzamy czy doświadczenie nie zawiera firmy, do której aplikujemy
			if (
				result.content.experience &&
				Array.isArray(result.content.experience)
			) {
				const experienceHasTargetCompany = result.content.experience.some(
					(exp: any) => exp.company === companyName,
				);

				if (experienceHasTargetCompany) {
						`BŁĄD KRYTYCZNY: CV zawiera firmę ${companyName} jako poprzedniego pracodawcę, ale to firma, do której aplikujesz!`,
					);
					alert(
						`Błąd w generowaniu CV: Twoje doświadczenie zawiera ${companyName} jako poprzedniego pracodawcę, ale to firma, do której aplikujesz! CV nie zostało wygenerowane, aby uniknąć nieporozumień.`,
					);
					setIsGenerating(false);
					return;
				}
			}

			// DRUGIE ZABEZPIECZENIE - Sprawdzamy czy wszystkie oryginalne firmy są zachowane
			if (
				result.content.experience &&
				Array.isArray(result.content.experience) &&
				profileData?.experiences
			) {
				// Minimalna ilość doświadczeń do porównania
				const minExperiences = Math.min(
					result.content.experience.length,
					profileData.experiences.length,
				);

				for (let i = 0; i < minExperiences; i++) {
					const generatedCompany = result.content.experience[i].company;
					const originalCompany = profileData.experiences[i].company;

					if (generatedCompany !== originalCompany) {
							`BŁĄD: W pozycji doświadczenia #${i + 1} nazwa firmy została zmieniona z "${originalCompany}" na "${generatedCompany}"`,
						);

						// Automatyczna korekta
						result.content.experience[i].company = originalCompany;
							`Skorygowano nazwę firmy w pozycji #${i + 1} na: ${originalCompany}`,
						);
					}
				}
			}

			// WAŻNA ZMIANA: Upewniamy się, że dane kontaktowe są uwzględnione w basic info
			const updatedContent = {
				...result.content,
				basics: {
					...result.content.basics,
					email: contactFormData.email,
					phone: contactFormData.phone,
					location: contactFormData.location || result.content.basics.location,
				},
				jobDetails: {
					jobTitle: jobTitle,
					companyName: companyName,
				},
			};

				email: updatedContent.basics.email,
				phone: updatedContent.basics.phone,
				location: updatedContent.basics.location,
			});

			// Przygotowanie nazwy pliku
			const candidateName =
				profileData?.first_name && profileData?.last_name
					? `${profileData.first_name}-${profileData.last_name}`
					: sanitizeForFileName(profileData?.first_name ?? "kandydat");

			const sanitizedName = sanitizeForFileName(candidateName);
			const sanitizedCompany = sanitizeForFileName(companyName);
			const sanitizedJobTitle = sanitizeForFileName(jobTitle);
			const fileName = `cv-${sanitizedName}-${sanitizedCompany}-${sanitizedJobTitle}.pdf`;

			setGenerationProgress(90);

			// Generowanie PDF
			const pdfBlob = await pdf(
				<ResumePDF
					data={updatedContent}
					jobTitle={jobTitle}
					companyName={companyName}
				/>,
			).toBlob();

			setGenerationProgress(100);

			// Konwersja do Base64 i pobranie
			const reader = new FileReader();
			reader.readAsDataURL(pdfBlob);
			reader.onloadend = () => {
				if (typeof reader.result === "string") {
					const base64data = reader.result.split(",")[1] ?? null;
					setGeneratedPdfBase64(base64data);
					setCurrentStep(4);
					setIsGenerating(false);

					// Automatyczne pobieranie pliku
					const link = document.createElement("a");
					link.href = `data:application/pdf;base64,${base64data}`;
					link.download = fileName;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);

					// Diagnostyka w trybie deweloperskim
					if (
						window.location.hostname === "localhost" ||
						window.location.hostname === "127.0.0.1"
					) {
						try {
							const diagnosticData = {
								timestamp: new Date().toISOString(),
								model: selectedModel,
								input: {
									profile: profileData,
									job: jobData,
									contactData: contactFormData, // Używamy przekazanych danych
								},
								output: updatedContent,
							};

							const diagnosticBlob = new Blob(
								[JSON.stringify(diagnosticData, null, 2)],
								{ type: "application/json" },
							);

							const diagnosticLink = document.createElement("a");
							diagnosticLink.href = URL.createObjectURL(diagnosticBlob);
							diagnosticLink.download = `diagnostic-${sanitizedName}-${Date.now()}.json`;
							document.body.appendChild(diagnosticLink);
							diagnosticLink.click();
							document.body.removeChild(diagnosticLink);
						} catch (diagnosticError) {
						}
					}
				}
			};
		} catch (error) {
			alert("Wystąpił błąd podczas generowania CV. Spróbuj ponownie.");
			setIsGenerating(false);
			setGenerationProgress(0);
		}
	};

	const handleProfileSubmit = () => {
		if (isLinkedinValid) {
			setProfileSubmitted(true);
			setIsProfileLoading(true);
			setProfileFetched(false);
			// Nie zmieniamy kroku, zmiana nastąpi po pobraniu profilu
		}
	};

	const handleNextStep = () => {
		if (!isJobUrlValid(jobUrl)) {
			setJobUrlError("Wprowadź poprawny adres oferty z LinkedIn");
			return;
		}

		// Zawsze pozwól przejść dalej, nawet jeśli dane są jeszcze ładowane
		setCurrentStep(3);

		// Jeśli dane oferty są jeszcze ładowane, pokazujemy odpowiedni komunikat
		if (isJobUrlValid(jobUrl) && !jobData && !isLoadingJob) {
			setIsLoadingJobInBackground(true);
			// Rozpocznij ładowanie oferty, jeśli jeszcze się nie rozpoczęło
			const jobId = extractJobId(jobUrl);
			if (jobId) {
				getLinkedinJobByUrl.fetch({ id: jobId });
			}
		}
	};

	// Renderowanie odpowiednich komponentów na podstawie currentStep
	const renderStepContent = () => {
		if (currentStep === 1) {
			return (
				<StepBox
					icon={LinkedinIcon}
					title="Połącz z LinkedIn"
					description="Wklej adres URL swojego profilu LinkedIn, aby rozpocząć"
					isActive={true}
					isCompleted={false}
				>
					<div className="relative mt-4">
						<div className="relative">
							<LinkedinIcon
								className="absolute left-3 top-[50%] flex -translate-y-[50%] items-center"
								size={20}
							/>
							<input
								type="url"
								className="relative z-10 w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white placeholder-gray-400 backdrop-blur-xs transition-all focus:border-[#9c40ff]/50 focus:outline-hidden focus:ring-2 focus:ring-[#9c40ff]/50"
								placeholder="https://linkedin.com/in/twoj-profil"
								value={linkedinUrl}
								onChange={(e) => setLinkedinUrl(e.target.value)}
								onClick={() => setShowLinkedinHelper(true)}
							/>
						</div>

						{showLinkedinHelper && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-2 text-left"
							>
								<a
									href="https://linkedin.com/in/"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0077b5]/20 px-3 py-2 text-sm text-white transition-colors hover:bg-[#0077b5]/30"
								>
									<LinkedinIcon size={16} />
									Pobierz link do swojego profilu
								</a>
								<p className="mt-1 text-xs text-gray-400">
									Kliknij, aby przejść do swojego profilu LinkedIn i skopiować
									adres URL
								</p>
							</motion.div>
						)}

						<motion.button
							className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white ${
								isLinkedinValid
									? "border border-white/10 bg-linear-to-r from-[#ffaa40] to-[#9c40ff] backdrop-blur-xs hover:from-[#9c40ff] hover:to-[#ffaa40]"
									: "cursor-not-allowed border border-white/5 bg-gray-800/50"
							}`}
							whileHover={isLinkedinValid ? { scale: 1.02 } : {}}
							whileTap={isLinkedinValid ? { scale: 0.98 } : {}}
							onClick={(e) => {
								e.preventDefault();
								handleProfileSubmit();
							}}
							disabled={!isLinkedinValid}
						>
							Rozpocznij w 30 sekund
							<ArrowRight size={20} />
						</motion.button>
					</div>
				</StepBox>
			);
		}

		if (currentStep === 2) {
			return (
				<StepBox
					icon={Link}
					title="Dodaj ogłoszenie o pracę"
					description="Wklej adres URL ogłoszenia o pracę z LinkedIn"
					isActive={true}
					isCompleted={jobData !== undefined}
				>
					<div className="relative mt-4">
						{isProfileLoading && (
							<div className="absolute right-4 top-3 z-20">
								<div className="flex items-center">
									<Loader2 className="h-5 w-5 animate-spin text-[#9c40ff]" />
									<span className="ml-2 text-xs text-gray-400">
										Pobieramy Twój profil...
									</span>
								</div>
							</div>
						)}

						<div className="relative">
							<Link
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								size={20}
							/>
							<input
								type="url"
								className={`relative z-10 w-full rounded-2xl border ${
									jobUrlError ? "border-red-500/50" : "border-white/10"
								} bg-white/5 py-3 pl-10 pr-4 text-white placeholder-gray-400 backdrop-blur-xs transition-all focus:border-indigo-500/50 focus:outline-hidden focus:ring-2 ${
									jobUrlError
										? "focus:ring-red-500/50"
										: "focus:ring-indigo-500/50"
								}`}
								placeholder="https://www.linkedin.com/jobs/view/..."
								value={jobUrl}
								onChange={handleJobUrlChange}
								onClick={() => setShowJobsHelper(true)}
							/>
						</div>

						{showJobsHelper && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-2 text-left"
							>
								<div className="text-xs text-gray-400 mb-1">
									Przykładowy format:
									https://www.linkedin.com/jobs/view/4148113299
								</div>

								{jobUrlError && (
									<div className="text-xs text-red-400 mb-2">{jobUrlError}</div>
								)}

								<a
									href="https://www.linkedin.com/jobs/"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0077b5]/20 px-3 py-2 text-sm text-white transition-colors hover:bg-[#0077b5]/30"
								>
									<Search size={16} />
									Znajdź oferty pracy na LinkedIn
								</a>
								<p className="mt-1 text-xs text-gray-400">
									Kliknij, aby przejść do wyszukiwania ofert na LinkedIn
								</p>
							</motion.div>
						)}

						<motion.button
							className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white ${
								isJobUrlValid(jobUrl) && !isProfileLoading
									? "border border-white/10 bg-linear-to-r from-indigo-600 to-indigo-500 backdrop-blur-xs hover:from-indigo-500 hover:to-indigo-600"
									: "cursor-not-allowed border border-white/5 bg-gray-800/50"
							}`}
							whileHover={
								isJobUrlValid(jobUrl) && !isProfileLoading
									? { scale: 1.02 }
									: {}
							}
							whileTap={
								isJobUrlValid(jobUrl) && !isProfileLoading
									? { scale: 0.98 }
									: {}
							}
							onClick={(e) => {
								e.preventDefault();
								if (!isJobUrlValid(jobUrl)) {
									setJobUrlError("Wprowadź poprawny adres oferty z LinkedIn");
									return;
								}
								handleNextStep();
							}}
							disabled={!isJobUrlValid(jobUrl) || isProfileLoading}
						>
							{isProfileLoading ? (
								<>
									<Loader2 className="h-5 w-5 animate-spin" />
									Ładowanie profilu...
								</>
							) : (
								<>
									Dalej
									<ArrowRight size={20} />
								</>
							)}
						</motion.button>
					</div>
				</StepBox>
			);
		}

		if (currentStep === 3) {
			return (
				<StepBox
					icon={Sparkles}
					title="Wygeneruj swoje CV"
					description="Pozwól AI stworzyć idealne CV"
					isActive={true}
					isCompleted={false}
				>
					{isLoadingJob || isLoadingJobInBackground ? (
						<div className="flex items-center justify-center py-4">
							<Loader2 className="h-8 w-8 animate-spin text-[#9c40ff]" />
							<span className="ml-2 text-gray-400">
								Pobieranie oferty pracy...
							</span>
						</div>
					) : jobError ? (
						<div className="rounded-lg bg-red-500/10 p-4 text-red-500">
							Błąd podczas pobierania oferty pracy. Spróbuj ponownie.
						</div>
					) : (
						<div className="space-y-4">
							{!isGenerating ? (
								// Stan początkowy - wyświetlanie wyboru modeli AI
								<>
									<h4 className="text-lg font-semibold text-white">
										Wybierz model AI do wygenerowania CV:
									</h4>
									{availableModels?.map((model) => (
										<motion.button
											key={model.id}
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											className={`mt-4 flex w-full flex-col items-start gap-1 rounded-2xl border border-white/10 bg-linear-to-r ${
												model.id === selectedModel
													? "from-[#9c40ff] to-[#ffaa40]"
													: "from-white/10 to-white/5"
											} p-4 text-left font-medium text-white backdrop-blur-xs transition-all hover:from-[#ffaa40] hover:to-[#9c40ff] disabled:cursor-not-allowed disabled:opacity-50`}
											onClick={(e) => {
												e.preventDefault();
												handleGenerate(model.id);
											}}
											disabled={isGenerating || !jobData || !profileData}
										>
											<div className="flex w-full items-center justify-between">
												<div className="flex items-center gap-2">
													<Sparkles size={20} />
													<span className="text-lg">{model.displayName}</span>
												</div>
											</div>
											<p className="text-sm text-white/80">
												{model.description}
											</p>
										</motion.button>
									))}
								</>
							) : (
								// Podczas generowania - formularz kontaktowy
								<div>
									<div className="mb-6 rounded-lg bg-indigo-500/10 p-4 text-center">
										<h4 className="mb-3 text-lg font-semibold text-white">
											Podaj dane kontaktowe do CV
										</h4>
										<p className="text-sm text-gray-400">
											Wprowadź swoje dane kontaktowe, które zostaną umieszczone
											w CV. Po zapisaniu danych rozpocznie się generowanie CV.
										</p>
									</div>

									{/* Pasek postępu generowania */}
									<div className="w-full bg-gray-700 rounded-full h-2 mb-6">
										<div
											className="bg-linear-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
											style={{ width: `${generationProgress}%` }}
										></div>
									</div>

									{isPreGenerating && (
										<div className="flex items-center gap-2 text-sm text-indigo-300 mb-4">
											<Loader2 className="h-4 w-4 animate-spin" />
											<span>Przygotowywanie szablonu CV w tle...</span>
										</div>
									)}

									<ContactForm
										onSubmit={handleContactDataSubmit}
										defaultValues={{
											email: contactData.email || profileData?.email || "",
											phone: contactData.phone || profileData?.phone || "",
											location:
												contactData.location || profileData?.location || "",
										}}
										isSubmitting={!!resumeData && !generatedPdfBase64}
										preGeneratedData={preGeneratedResume}
									/>

									{resumeData && !generatedPdfBase64 && (
										<div className="mt-6">
											<div className="flex items-center justify-center py-4">
												<Loader2 className="h-8 w-8 animate-spin text-[#9c40ff]" />
												<span className="ml-2 text-gray-400">
													Generowanie PDF...
												</span>
											</div>
											<LoadingTips />
										</div>
									)}

									{!resumeData && (
										<div className="mt-6">
											<LoadingTips />
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</StepBox>
			);
		}

		if (currentStep === 4) {
			return (
				<div className="rounded-2xl border border-green-500/20 bg-linear-to-br from-green-500/20 to-green-400/10 p-8 text-center backdrop-blur-xs">
					<CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
					<h3 className="mb-2 text-2xl font-bold text-green-400">
						Twoje CV jest gotowe!
					</h3>
					<p className="mb-6 text-green-300">
						Stworzyliśmy idealne CV na podstawie Twojego profilu LinkedIn i
						wymagań stanowiska
						{selectedModel && availableModels && (
							<>
								{" "}
								używając modelu{" "}
								<span className="font-semibold">
									{
										availableModels.find((m) => m.id === selectedModel)
											?.displayName
									}
								</span>
							</>
						)}
					</p>

					{/* AI Model Selection */}
					<div className="mb-6">
						<h4 className="mb-3 text-lg font-semibold text-green-400">
							Wygeneruj ponownie używając innego modelu AI:
						</h4>
						<div className="flex flex-wrap justify-center gap-3">
							{availableModels?.map((model) => (
								<motion.button
									key={model.id}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
										isGenerating ? "cursor-not-allowed opacity-50" : ""
									} ${
										selectedModel === model.id
											? "bg-green-500 text-white"
											: "bg-white/10 text-green-300 hover:bg-white/20"
									}`}
									onClick={() => handleGenerate(model.id)}
									disabled={isGenerating}
								>
									{isGenerating && selectedModel === model.id ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Generowanie...
										</>
									) : (
										<>
											<Sparkles className="h-4 w-4" />
											{model.displayName}
										</>
									)}
								</motion.button>
							))}
						</div>
					</div>

					{generatedPdfBase64 && (
						<div className="flex items-center justify-center gap-4">
							<motion.a
								href={`data:application/pdf;base64,${generatedPdfBase64}`}
								download={`cv-${sanitizeForFileName(profileData?.first_name ?? "kandydat")}${profileData?.last_name ? `-${sanitizeForFileName(profileData?.last_name ?? "")}` : ""}-${sanitizeForFileName(jobData?.company_name ?? "firma")}-${sanitizeForFileName(jobData?.job_title ?? "stanowisko")}.pdf`}
								className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600"
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Download size={20} />
								Pobierz swoje CV
							</motion.a>
						</div>
					)}
				</div>
			);
		}

		return null;
	};

	return (
		<div className="relative min-h-screen overflow-hidden bg-black text-white">
			{/* Animated background particles */}
			<Particles className="-z-10" />

			{/* Gradient orbs */}
			<div className="absolute -left-32 top-20 h-96 w-96 animate-blob rounded-full bg-[#ffaa40] opacity-20 mix-blend-multiply blur-[128px] filter" />
			<div className="animation-delay-2000 absolute -right-32 top-40 h-96 w-96 animate-blob rounded-full bg-[#9c40ff] opacity-20 mix-blend-multiply blur-[128px] filter" />
			<div className="animation-delay-4000 absolute -bottom-32 left-1/2 h-96 w-96 animate-blob rounded-full bg-[#40ffb5] opacity-20 mix-blend-multiply blur-[128px] filter" />

			{/* Main content - Uproszczona struktura */}
			<motion.div
				className="mx-auto mt-16 max-w-[80rem] px-6 text-center md:px-8"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.6 }}
			>
				{/* Announcement banner */}
				<motion.div
					className="backdrop-filter-[12px] animate-fade-in group inline-flex h-7 translate-y-[-1rem] items-center justify-between gap-1 rounded-full border border-white/5 bg-white/10 px-3 text-xs text-white opacity-0 transition-all ease-in hover:cursor-pointer hover:bg-white/20"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<span className="flex items-center gap-1">
						<Star className="h-3 w-3 text-yellow-400" />✨ Generator CV
						wspierany przez AI
					</span>
				</motion.div>

				<motion.div
					className="animate-fade-in mb-8 translate-y-[-1rem] text-center opacity-0 [--animation-delay:200ms]"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				>
					<h1 className="text-balance bg-linear-to-br from-white from-30% to-white/40 bg-clip-text py-4 text-5xl font-medium leading-none tracking-tighter text-transparent sm:text-6xl md:text-7xl">
						Aplikomat
					</h1>
					<p className="animate-fade-in mb-2 translate-y-[-1rem] text-balance text-lg tracking-tight text-gray-400 opacity-0 [--animation-delay:400ms] md:text-xl">
						Stwórz CV dopasowane do ofert pracy w kilka sekund
					</p>
				</motion.div>

				{/* Form Container - Jedno okienko zmieniające zawartość */}
				<motion.div
					className="relative mx-auto max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-8 backdrop-blur-xs [perspective:2000px]"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={`step-${currentStep}`}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
						>
							{renderStepContent()}
						</motion.div>
					</AnimatePresence>

					{/* Progress Indicator */}
					<div className="relative flex items-center justify-between pt-8">
						<div className="absolute left-0 top-1/2 z-0 h-0.5 w-full -translate-y-1/2 bg-gray-700" />
						{[
							{ step: 1, title: "Profil LinkedIn", icon: LinkedinIcon },
							{ step: 2, title: "Oferta pracy", icon: Link },
							{ step: 3, title: "Generowanie CV", icon: Sparkles },
						].map(({ step, title, icon: Icon }) => (
							<div
								key={step}
								className="relative z-10 flex flex-col items-center gap-2"
							>
								<motion.div
									className={`flex h-12 w-12 items-center justify-center rounded-full ${
										currentStep > step
											? "bg-green-500"
											: currentStep === step
												? "bg-linear-to-r from-indigo-600 to-indigo-500"
												: "bg-gray-700"
									}`}
									initial={false}
									animate={{
										scale: currentStep === step ? 1.1 : 1,
									}}
									whileHover={{ scale: 1.05 }}
								>
									{currentStep > step ? (
										<CheckCircle2 className="h-6 w-6 text-white" />
									) : (
										<Icon className="h-6 w-6 text-white" />
									)}
								</motion.div>
								<p
									className={`text-sm font-medium ${
										currentStep >= step ? "text-white" : "text-gray-500"
									}`}
								>
									{title}
								</p>
							</div>
						))}
					</div>
				</motion.div>

				{/* Features */}
				<motion.div
					className="mt-24 grid gap-8 md:grid-cols-3"
					initial="hidden"
					animate="visible"
					variants={{
						visible: {
							transition: {
								staggerChildren: 0.1,
							},
						},
					}}
				>
					{[
						{
							title: "Zwiększ swoje szanse na pracę",
							description:
								"Twoje CV zoptymalizowane pod systemy ATS z najlepszym możliwym wynikiem",
						},
						{
							title: "Oszczędź godziny pracy",
							description:
								"Twoja idealna CV gotowa w minutę zamiast spędzania godzin na formatowaniu",
						},
						{
							title: "Rozpocznij bez rejestracji",
							description:
								"Wklej link do profilu LinkedIn i stwórz CV w mniej niż 60 sekund",
						},
					].map((feature, index) => (
						<motion.div
							key={index}
							className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xs"
							variants={{
								hidden: { opacity: 0, y: 20 },
								visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
							}}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							transition={{ duration: 0.2 }}
						>
							<BorderBeam className="opacity-0 transition-opacity group-hover:opacity-100" />
							<h3 className="mb-2 text-lg font-semibold text-white">
								{feature.title}
							</h3>
							<p className="text-gray-400">{feature.description}</p>
						</motion.div>
					))}
				</motion.div>

				{/* Company Section */}
				<CompanySection />

				{/* Job Boards Section */}
				<JobBoardsSection />

				{/* Testimonials Section */}
				<TestimonialsSection />

				{/* Enhanced Stats Section */}
				<EnhancedStatsSection />
			</motion.div>
		</div>
	);
}

export default App;
