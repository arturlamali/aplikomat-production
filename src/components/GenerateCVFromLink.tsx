//src/components/GenerateCVFromLink.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { ExternalLink, Loader2, CheckCircle, XCircle, Link as LinkIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";

interface JobLinkForm {
	jobUrl: string;
	email?: string;
	phone?: string;
	location?: string;
}

type JobType = "linkedin" | "rocketjobs" | "unknown";

const detectJobType = (url: string): JobType => {
	if (url.includes("linkedin.com/jobs")) {
		return "linkedin";
	}
	if (url.includes("rocketjobs.pl/oferta-pracy")) {
		return "rocketjobs";
	}
	return "unknown";
};

const extractJobId = (url: string, type: JobType): string | null => {
	try {
		if (type === "linkedin") {
			// Clean LinkedIn URL by removing tracking parameters
			const cleanUrl = url.split('?')[0]; // Remove query parameters
			// Extract ID from LinkedIn URL: https://www.linkedin.com/jobs/view/123456789
			const match = cleanUrl.match(/\/jobs\/view\/(\d+)/);
			return match?.[1] || null;
		}
		if (type === "rocketjobs") {
			// Extract slug from RocketJobs URL: https://rocketjobs.pl/oferta-pracy/company-name--job-title-location
			const match = url.match(/\/oferta-pracy\/([^/?]+)/);
			return match?.[1] || null;
		}
		return null;
	} catch {
		return null;
	}
};

export const GenerateCVFromLink = () => {
	const router = useRouter();
	const [step, setStep] = useState<"input" | "fetching" | "generating" | "error">("input");
	const [jobData, setJobData] = useState<any>(null);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [cvGenerationTriggered, setCvGenerationTriggered] = useState(false);
	
	// Stable job identification state
	const [jobParams, setJobParams] = useState<{
		type: JobType;
		id: string;
		url: string;
	} | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
	} = useForm<JobLinkForm>();

	const jobUrl = watch("jobUrl");

	// LinkedIn job query - STABLE with useCallback
	const linkedInQueryEnabled = useCallback(() => {
		return jobParams?.type === "linkedin" && Boolean(jobParams.id) && !cvGenerationTriggered;
	}, [jobParams?.type, jobParams?.id, cvGenerationTriggered]);

	const { 
		data: linkedinJob,
		isFetching: linkedinLoading,
		error: linkedinError,
	} = api.linkedinScraper.getLinkedinJobByUrl.useQuery(
		{ id: jobParams?.id || "0" },
		{ 
			enabled: linkedInQueryEnabled(),
			retry: 1, // Limit retries to prevent infinite loops
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			staleTime: 5 * 60 * 1000, // 5 minutes
		}
	);

	// RocketJobs job query - STABLE  
	const rocketJobsQueryEnabled = useCallback(() => {
		return jobParams?.type === "rocketjobs" && Boolean(jobParams.id) && !cvGenerationTriggered;
	}, [jobParams?.type, jobParams?.id, cvGenerationTriggered]);

	const { 
		data: rocketJob,
		isFetching: rocketLoading,
		error: rocketError,
	} = api.jobs.getJobBySlug.useQuery(
		{ slug: jobParams?.id || "none" },
		{ 
			enabled: rocketJobsQueryEnabled(),
			retry: 1,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			staleTime: 5 * 60 * 1000,
		}
	);

	// Generate and save CV mutation
	const { mutate: generateAndSaveCV, isPending: isGenerating } = api.resume.generateResumeFromUrlAndSave.useMutation({
		onSuccess: (data) => {
			console.log("✅ CV generated and saved successfully:", data.id);
			toast.success("CV zostało wygenerowane i zapisane! 🎉");
			
			// Clear job params to disable queries
			setJobParams(null);
			
			// Small delay to ensure proper state cleanup before navigation
			setTimeout(() => {
				router.push("/dashboard/cv");
			}, 1000);
		},
		onError: (error) => {
			console.error("❌ CV generation error:", error);
			toast.error(`Błąd podczas generowania CV: ${error.message}`);
			setStep("error");
			setErrorMessage(error.message);
			setCvGenerationTriggered(false); // Reset for potential retry
		}
	});

	// Effect to handle job data fetching completion and automatic CV generation
	useEffect(() => {
		if (!jobParams || cvGenerationTriggered) return;

		const currentJobData = jobParams.type === "linkedin" ? linkedinJob : rocketJob;
		const isLoading = jobParams.type === "linkedin" ? linkedinLoading : rocketLoading;
		const error = jobParams.type === "linkedin" ? linkedinError : rocketError;

		// Handle errors
		if (error) {
			console.error(`❌ Error fetching ${jobParams.type} job:`, error);
			setErrorMessage(error.message);
			setStep("error");
			setCvGenerationTriggered(false); // Reset flag on error
			return;
		}

		// Handle successful data fetch
		if (currentJobData && !isLoading && !cvGenerationTriggered) {
			console.log("📄 Job data received, triggering CV generation:", {
				type: jobParams.type,
				title: currentJobData.job_title || currentJobData.title,
				company: currentJobData.company_name || currentJobData.companyName
			});
			
			setJobData(currentJobData);
			setStep("generating");
			setCvGenerationTriggered(true);

			// Trigger CV generation
			generateAndSaveCV({
				jobUrl: jobParams.url,
				jobType: jobParams.type,
				userContactData: undefined, // Use LinkedIn profile data
			});
		}
	}, [jobParams, linkedinJob, rocketJob, linkedinLoading, rocketLoading, linkedinError, rocketError, cvGenerationTriggered, generateAndSaveCV]);

	const handleUrlSubmit = () => {
		const type = detectJobType(jobUrl);
		const id = extractJobId(jobUrl, type);

		if (type === "unknown") {
			toast.error("Niepoznany format URL. Wspieramy tylko LinkedIn i RocketJobs.");
			return;
		}

		if (!id) {
			toast.error("Nie udało się wyodrębnić ID oferty z podanego URL.");
			return;
		}

		console.log("🚀 Starting job data fetch:", { type, id, url: jobUrl });
		
		// Reset previous state
		setJobData(null);
		setErrorMessage("");
		setCvGenerationTriggered(false);
		
		// Set job parameters - this will trigger the appropriate query
		setJobParams({ type, id, url: jobUrl });
		setStep("fetching");
	};

	const resetForm = () => {
		setStep("input");
		setJobParams(null);
		setJobData(null);
		setErrorMessage("");
		setCvGenerationTriggered(false);
		setValue("jobUrl", "");
	};

	// Loading state during data fetch
	const isCurrentlyFetching = (linkedinLoading && jobParams?.type === "linkedin") || 
	                          (rocketLoading && jobParams?.type === "rocketjobs");

	// Step 1: URL Input
	if (step === "input") {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<LinkIcon className="h-5 w-5" />
						Podaj link do oferty pracy
					</CardTitle>
					<CardDescription>
						Wklej URL do oferty pracy - CV zostanie automatycznie wygenerowane i zapisane
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<Label htmlFor="jobUrl">URL oferty pracy</Label>
							<Input
								id="jobUrl"
								placeholder="https://www.linkedin.com/jobs/view/123456789 lub https://rocketjobs.pl/oferta-pracy/..."
								{...register("jobUrl", {
									required: "Podaj link do oferty pracy",
									pattern: {
										value: /(linkedin\.com\/jobs|rocketjobs\.pl\/oferta-pracy)/,
										message: "URL musi zawierać linkedin.com/jobs lub rocketjobs.pl/oferta-pracy"
									}
								})}
								className="mt-1"
							/>
							{errors.jobUrl && (
								<p className="text-sm text-red-500 mt-1">
									{errors.jobUrl.message}
								</p>
							)}
						</div>
						
						<Alert>
							<AlertTitle>🚀 Automatyczne generowanie CV</AlertTitle>
							<AlertDescription className="text-sm">
								Po podaniu linku, system automatycznie pobierze dane oferty i wygeneruje 
								spersonalizowane CV na podstawie Twojego profilu LinkedIn.
							</AlertDescription>
						</Alert>
					</div>
				</CardContent>
				<CardFooter>
					<Button 
						onClick={handleUrlSubmit} 
						className="w-full"
						disabled={!jobUrl || !!errors.jobUrl}
					>
						Wygeneruj CV automatycznie 🎯
					</Button>
				</CardFooter>
			</Card>
		);
	}

	// Step 2: Fetching job data
	if (step === "fetching" || isCurrentlyFetching) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Loader2 className="h-5 w-5 animate-spin" />
						Pobieranie danych oferty...
					</CardTitle>
					<CardDescription>
						{jobParams?.type === "linkedin" ? "Łączenie z LinkedIn API..." : "Pobieranie z RocketJobs..."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center gap-2 text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							Analizowanie oferty pracy...
						</div>
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-20 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	// Step 3: Generating CV
	if (step === "generating" || isGenerating) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Loader2 className="h-5 w-5 animate-spin" />
						Generowanie spersonalizowanego CV...
					</CardTitle>
					<CardDescription>
						Dostosowujemy Twoje CV do oferty "{jobData?.job_title || jobData?.title}" w firmie "{jobData?.company_name || jobData?.companyName}"
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center gap-2 text-sm">
							<CheckCircle className="h-4 w-4 text-green-600" />
							Dane oferty pobrane pomyślnie
						</div>
						<div className="flex items-center gap-2 text-sm">
							<Loader2 className="h-4 w-4 animate-spin" />
							Analizowanie wymagań stanowiska...
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Dopasowywanie CV do profilu LinkedIn...
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Zapisywanie wygenerowanego CV...
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Step 4: Error state
	if (step === "error") {
		const isLinkedInForbidden = errorMessage.includes("403") || errorMessage.includes("Forbidden");
		
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-red-600">
						<XCircle className="h-5 w-5" />
						{isLinkedInForbidden ? "LinkedIn API niedostępne" : "Błąd podczas pobierania oferty"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert variant="destructive">
						<AlertTitle>
							{isLinkedInForbidden ? "Problem z dostępem do LinkedIn" : "Nie udało się pobrać danych oferty"}
						</AlertTitle>
						<AlertDescription className="space-y-2">
							{isLinkedInForbidden ? (
								<div>
									<p>LinkedIn API zwrócił błąd 403 (brak dostępu). To może być spowodowane:</p>
									<ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
										<li>Wygasłym kluczem API</li>
										<li>Przekroczeniem limitów API</li>
										<li>Ograniczeniami LinkedIn dla tej oferty</li>
									</ul>
									<p className="mt-3 text-sm font-medium">
										💡 <strong>Alternatywy:</strong>
									</p>
									<ul className="list-disc ml-4 mt-1 space-y-1 text-sm">
										<li>Spróbuj oferty z <strong>RocketJobs.pl</strong></li>
										<li>Użyj wyszukiwarki ofert w zakładce "Generuj CV"</li>
									</ul>
								</div>
							) : (
								<p>{errorMessage}</p>
							)}
						</AlertDescription>
					</Alert>
				</CardContent>
				<CardFooter className="flex gap-2">
					<Button onClick={resetForm} variant="outline" className="flex-1">
						Spróbuj ponownie
					</Button>
					{isLinkedInForbidden && (
						<Button 
							onClick={() => router.push('/dashboard/jobs')} 
							className="flex-1"
						>
							Przejdź do wyszukiwarki 🔍
						</Button>
					)}
				</CardFooter>
			</Card>
		);
	}

	return null;
};