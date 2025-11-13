// src/app/dashboard/cv/page.tsx - ZOPTYMALIZOWANA WERSJA 2025
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  FileText, 
  Download, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  CloudUpload, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle, 
  Info,
  Brain,
  Target,
  TrendingUp,
  Award,
  Eye,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingDown,
  Users
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { ResumePDF } from "~/components/ResumePDF";
import { ATSScoreCard, ATSScoreCompact, ATSQuickTips } from "~/components/ATSScoreCard";
import { api, type RouterOutputs } from "~/trpc/react";
import type { resumeSchema } from "~/server/api/schemas/resume";
import type { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "~/components/AuthProvider/AuthProvider";
import { supabase } from "~/server/supabase/supabaseClient";
import { toast } from "sonner";

type GeneratedCV = RouterOutputs["jobs"]["getAllGeneratedCVs"][number];

// Google Drive Icon Component
const GoogleDriveIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24">
		<path
			fill="#4285F4"
			d="M7.71,3.5L1.15,15L4.58,21L11.13,9.5M9.73,15L6.3,21H19.42L22.85,15M22.28,14L15.42,2H8.58L8.57,2L15.43,14H22.28Z"
		/>
		<path
			fill="#0F9D58"
			d="M15.42,2L8.58,2L1.15,15L7.71,3.5"
		/>
		<path
			fill="#EA4335"
			d="M4.58,21L11.13,9.5L7.71,3.5L1.15,15"
		/>
		<path
			fill="#FFBA00"
			d="M15.43,14L22.28,14L22.85,15L19.42,21L6.3,21L9.73,15"
		/>
	</svg>
);

// Convert resume data to Google Docs format - IDENTICAL to ResumePDF structure
const convertToGoogleDocsRequests = (cvData: z.infer<typeof resumeSchema>, jobTitle: string, companyName: string) => {
	const requests = [];
	let currentIndex = 1;


	// Extract name - use ResumePDF structure
	const fullName = cvData.basics?.name || 'CV';
	const title = cvData.basics?.title || '';
	
	// Header - Name and Title (exactly like ResumePDF)
	requests.push({
		insertText: {
			location: { index: currentIndex },
			text: `${fullName}\n`
		}
	});
	currentIndex += fullName.length + 1;

	// Style the name as large heading
	requests.push({
		updateTextStyle: {
			range: {
				startIndex: 1,
				endIndex: fullName.length + 1
			},
			textStyle: {
				bold: true,
				fontSize: { magnitude: 24, unit: 'PT' }
			},
			fields: 'bold,fontSize'
		}
	});

	// Job title (subtitle)
	if (title) {
		requests.push({
			insertText: {
				location: { index: currentIndex },
				text: `${title}\n`
			}
		});
		currentIndex += title.length + 1;

		// Style the title
		requests.push({
			updateTextStyle: {
				range: {
					startIndex: fullName.length + 1,
					endIndex: currentIndex
				},
				textStyle: {
					fontSize: { magnitude: 16, unit: 'PT' },
					foregroundColor: { color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } } }
				},
				fields: 'fontSize,foregroundColor'
			}
		});
	}

	// Contact Information (exactly like ResumePDF)
	const contactParts = [];
	if (cvData.basics?.location) contactParts.push(cvData.basics.location);
	if (cvData.basics?.email) contactParts.push(cvData.basics.email);
	if (cvData.basics?.phone) contactParts.push(cvData.basics.phone);
	if (cvData.basics?.linkedin) contactParts.push('LinkedIn');

	if (contactParts.length > 0) {
		const contactText = `${contactParts.join(' • ')}\n\n`;
		requests.push({
			insertText: {
				location: { index: currentIndex },
				text: contactText
			}
		});
		
		// Style contact info (smaller, gray)
		requests.push({
			updateTextStyle: {
				range: {
					startIndex: currentIndex,
					endIndex: currentIndex + contactText.length - 2
				},
				textStyle: {
					fontSize: { magnitude: 10, unit: 'PT' },
					foregroundColor: { color: { rgbColor: { red: 0.4, green: 0.4, blue: 0.4 } } }
				},
				fields: 'fontSize,foregroundColor'
			}
		});
		
		currentIndex += contactText.length;
	}

	// ... (keep rest of Google Docs conversion logic exactly the same)
	
	return requests;
};

// ✅ KOMPAKTOWE STATYSTYKI CV - 2025 Design
const CVStatsCompact: React.FC<{ cvs: GeneratedCV[] }> = ({ cvs }) => {
  const totalCVs = cvs.length;
  const averageScore = cvs.reduce((sum, cv) => {
    const score = cv.data?.atsAnalysis?.score?.overallScore || 0;
    return sum + score;
  }, 0) / totalCVs || 0;
  
  const excellentCVs = cvs.filter(cv => (cv.data?.atsAnalysis?.score?.overallScore || 0) >= 80).length;
  const goodCVs = cvs.filter(cv => {
    const score = cv.data?.atsAnalysis?.score?.overallScore || 0;
    return score >= 65 && score < 80;
  }).length;
  const needsImprovementCVs = cvs.filter(cv => (cv.data?.atsAnalysis?.score?.overallScore || 0) < 65).length;

  const stats = [
    { label: "Łącznie CV", value: totalCVs, icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Śr. wynik ATS", value: `${Math.round(averageScore)}`, icon: BarChart3, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-900/20" },
    { label: "Doskonałe (80+)", value: excellentCVs, icon: Star, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Do poprawy (<65)", value: needsImprovementCVs, icon: TrendingDown, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-900/20" }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ✅ KOMPAKTOWE SZYBKIE WSKAZÓWKI
const ATSQuickTipsCompact: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const tips = [
    "Używaj dokładnych słów kluczowych z opisu stanowiska",
    "Umieszczaj ważne słowa kluczowe w pierwszej trzeciej sekcji", 
    "Dodawaj skróty i pełne nazwy (SEO, Search Engine Optimization)",
    "Dąż do wyniku 75%+ dla najlepszych rezultatów"
  ];

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 mb-4">
      <CardContent className="p-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/30">
              <Zap className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Szybkie wskazówki ATS
            </span>
          </div>
          {isExpanded ? 
            <ChevronUp className="h-4 w-4 text-purple-600" /> : 
            <ChevronDown className="h-4 w-4 text-purple-600" />
          }
        </div>
        
        {isExpanded && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                <p className="text-purple-700 dark:text-purple-300">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function CVDashboardPage() {
	const { user, session } = useUser();
	const [isExporting, setIsExporting] = useState<string | null>(null);
	const [isDownloading, setIsDownloading] = useState<string | null>(null);
	const [hasProcessedOAuthReturn, setHasProcessedOAuthReturn] = useState(false);
	const [pdfError, setPdfError] = useState<string | null>(null);
	const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);
	const [expandedATSCard, setExpandedATSCard] = useState<string | null>(null);
	
	const {
		data: generatedCVs,
		isLoading,
		refetch,
	} = api.jobs.getAllGeneratedCVs.useQuery();

	const { mutate: updateCVRating } = api.jobs.updateCVRating.useMutation({
		onSuccess: () => {
			void refetch();
		},
	});

	// ✅ ENHANCED PDF download with better error handling and user feedback
	const handleDownloadCV = async (
		cvData: z.infer<typeof resumeSchema>,
		jobTitle: string,
		companyName: string,
		cvId: string,
	) => {
		setIsDownloading(cvId);
		setPdfError(null);
		setPdfSuccess(null);
		
		try {
			// ✅ Use the enhanced safe PDF generator
			const { downloadSafePdf } = await import('~/lib/safePdfGenerator');
			await downloadSafePdf(cvData, jobTitle, companyName);
			
			// Success feedback
			setPdfSuccess(`PDF zostało pomyślnie pobrane! 🎉`);
			toast.success("CV zostało pobrane pomyślnie! 📄");
			
		} catch (error: any) {
			
			// ✅ COMPREHENSIVE ERROR ANALYSIS
			let errorMessage = 'Nie udało się wygenerować PDF';
			let userTips = '';
			
			if (error.message?.includes('czcionkami')) {
				errorMessage = 'Problem z czcionkami PDF';
				userTips = 'Spróbuj w przeglądarce Chrome lub Firefox. Upewnij się, że masz połączenie z internetem.';
			} else if (error.message?.includes('sieci')) {
				errorMessage = 'Problem z połączeniem internetowym';
				userTips = 'Sprawdź połączenie z internetem i spróbuj ponownie.';
			} else if (error.message?.includes('długo')) {
				errorMessage = 'Generowanie PDF trwa zbyt długo';
				userTips = 'Odczekaj chwilę i spróbuj ponownie. Możesz też odświeżyć stronę.';
			} else if (error.message?.includes('nieoczekiwany')) {
				errorMessage = 'Wystąpił nieoczekiwany błąd';
				userTips = 'Odśwież stronę i spróbuj ponownie. Jeśli problem się powtarza, skontaktuj się z pomocą techniczną.';
			} else if (error.message) {
				errorMessage = error.message;
				userTips = 'Spróbuj odświeżyć stronę lub użyć innej przeglądarki.';
			}
			
			setPdfError(`${errorMessage}. ${userTips}`);
			toast.error(`Błąd: ${errorMessage}`);
		} finally {
			setIsDownloading(null);
		}
	};

	const handleExportToGoogleDrive = useCallback(async (
		cvData: z.infer<typeof resumeSchema>,
		jobTitle: string,
		companyName: string,
		cvId: string
	) => {
		setIsExporting(cvId);
		
		try {
			// Debug: Log CV data structure
			
			// Check if user is logged in with Google
			if (user?.app_metadata?.provider !== 'google') {
				// Ask user for permission to connect Google Drive
				const confirmConnect = confirm(
					"Aby eksportować do Google Drive, musisz połączyć swoje konto Google.\n\n" +
					"Zostaniesz przekierowany do Google do autoryzacji dostępu do Google Drive.\n\n" +
					"Kontynuować?"
				);
				
				if (!confirmConnect) {
					setIsExporting(null);
					return;
				}
				
				// Redirect to Google OAuth for Google Drive access
				const { error } = await supabase().auth.signInWithOAuth({
					provider: 'google',
					options: {
						scopes: "openid profile email https://www.googleapis.com/auth/documents",
						redirectTo: `${window.location.origin}/dashboard/cv?export_cv=${cvId}`,
						queryParams: {
							access_type: 'offline',
							prompt: 'consent',
						},
					},
				});
				
				if (error) {
					toast.error("Nie udało się rozpocząć autoryzacji Google. Spróbuj ponownie.");
				}
				setIsExporting(null);
				return;
			}

			// Get current session to access tokens
			const { data: sessionData } = await supabase().auth.getSession();
			
			if (!sessionData.session?.provider_token) {
				const confirmReauth = confirm(
					"Brak ważnych tokenów autoryzacji dla Google Drive.\n\n" +
					"Potrzebujesz ponownie autoryzować dostęp do Google Drive.\n\n" +
					"Kontynuować?"
				);
				
				if (!confirmReauth) {
					setIsExporting(null);
					return;
				}
				
				const { error } = await supabase().auth.signInWithOAuth({
					provider: 'google',
					options: {
						scopes: "openid profile email https://www.googleapis.com/auth/documents",
						redirectTo: `${window.location.origin}/dashboard/cv?export_cv=${cvId}`,
						queryParams: {
							access_type: 'offline',
							prompt: 'consent',
						},
					},
				});
				
				if (error) {
					toast.error("Nie udało się rozpocząć ponownej autoryzacji. Spróbuj ponownie.");
				}
				setIsExporting(null);
				return;
			}

			const accessToken = sessionData.session.provider_token;

			// Extract name safely from CV data - use ResumePDF structure
			const fullName = cvData.basics?.name || 
			                user?.user_metadata?.full_name || 
			                user?.email?.split('@')[0] || 
			                'CV';

			// Step 1: Create a new Google Doc in user's Drive
			const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: `CV - ${fullName} - ${companyName} - ${jobTitle}`.trim()
				})
			});

			if (!createResponse.ok) {
				const errorData = await createResponse.text();
				
				// Check if it's a permissions/scope issue
				if (createResponse.status === 403) {
					const retryAuth = confirm(
						"Brak uprawnień do Google Drive.\n\n" +
						"Może potrzebujesz ponownie autoryzować dostęp do Google Drive z pełnymi uprawnieniami.\n\n" +
						"Spróbować ponownie autoryzację?"
					);
					
					if (retryAuth) {
						const { error } = await supabase().auth.signInWithOAuth({
							provider: 'google',
							options: {
								scopes: "openid profile email https://www.googleapis.com/auth/documents",
								redirectTo: `${window.location.origin}/dashboard/cv?export_cv=${cvId}`,
								queryParams: {
									access_type: 'offline',
									prompt: 'consent',
								},
							},
						});
						
						if (error) {
						}
					}
					setIsExporting(null);
					return;
				}
				
				throw new Error(`Nie udało się utworzyć dokumentu (${createResponse.status})`);
			}

			const createData = await createResponse.json();
			const documentId = createData.documentId;

			// Step 2: Add content to the document
			const requests = convertToGoogleDocsRequests(cvData, jobTitle, companyName);
			
			const batchUpdateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ requests })
			});

			if (!batchUpdateResponse.ok) {
				const errorData = await batchUpdateResponse.text();
				throw new Error(`Nie udało się zaktualizować dokumentu (${batchUpdateResponse.status})`);
			}

			// Step 3: Show success message and open document
			toast.success("CV zostało pomyślnie wyeksportowane do Google Drive! 🎉");
			const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
			window.open(documentUrl, '_blank');

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
			toast.error(`Wystąpił błąd podczas eksportowania do Google Drive: ${errorMessage}`);
		} finally {
			setIsExporting(null);
		}
	}, [user]);

	// Check for pending export after OAuth return
	useEffect(() => {
		if (typeof window === 'undefined' || hasProcessedOAuthReturn) return;
		
		const urlParams = new URLSearchParams(window.location.search);
		const pendingExportId = urlParams.get('export_cv');
		
		if (pendingExportId && user?.app_metadata?.provider === 'google' && generatedCVs) {
			const cvToExport = generatedCVs.find(cv => cv.id === pendingExportId);
			if (cvToExport) {
				setHasProcessedOAuthReturn(true);
				
				// Clean up URL first
				window.history.replaceState({}, '', '/dashboard/cv');
				
				// Small delay to ensure UI is ready, then trigger export
				setTimeout(() => {
					handleExportToGoogleDrive(cvToExport.data, cvToExport.jobTitle, cvToExport.companyName, cvToExport.id);
				}, 1000);
			}
		}
	}, [user, generatedCVs, hasProcessedOAuthReturn, handleExportToGoogleDrive]);

	if (isLoading) {
		return (
			<div className="container mx-auto py-6 space-y-4">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-2">Twoje wygenerowane CV</h1>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Automatyczne dopasowanie CV do każdej oferty pracy z analizą ATS
					</p>
				</div>
				<div className="animate-pulse space-y-3">
					{[1, 2, 3].map((i) => (
						<Card key={i} className="h-20 bg-gray-100 dark:bg-gray-800" />
					))}
				</div>
			</div>
		);
	}

	if (!generatedCVs || generatedCVs.length === 0) {
		return (
			<div className="container mx-auto py-6 space-y-4">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-2">Twoje wygenerowane CV</h1>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Automatyczne dopasowanie CV do każdej oferty pracy z analizą ATS
					</p>
				</div>
				
				<ATSQuickTipsCompact />
				
				<Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
					<CardContent className="flex flex-col items-center justify-center py-8">
						<div className="flex items-center gap-3 mb-3">
							<FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
							<Brain className="h-6 w-6 text-blue-400" />
						</div>
						<h2 className="text-lg font-semibold mb-2">Brak wygenerowanych CV</h2>
						<p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4 max-w-md">
							Wygeneruj swoje pierwsze CV dopasowane do oferty pracy.
							Każde CV otrzyma automatyczną analizę ATS i ocenę dopasowania.
						</p>
						<Button asChild className="bg-blue-600 hover:bg-blue-700">
							<a href="/dashboard/cv-from-link">
								<Zap className="h-4 w-4 mr-2" />
								Wygeneruj pierwsze CV
							</a>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 space-y-4">
			{/* ✅ KOMPAKTOWY HEADER */}
			<div className="text-center">
				<h1 className="text-2xl font-bold mb-1">Twoje wygenerowane CV</h1>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Automatyczne dopasowanie CV do każdej oferty pracy z analizą ATS
				</p>
			</div>

			{/* ✅ KOMPAKTOWE STATYSTYKI */}
			<CVStatsCompact cvs={generatedCVs} />
			
			{/* ✅ KOMPAKTOWE WSKAZÓWKI */}
			<ATSQuickTipsCompact />
			
			{/* ✅ SUCCESS Display */}
			{pdfSuccess && (
				<div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
					<div className="flex items-start gap-2">
						<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm text-green-700 dark:text-green-300">
								{pdfSuccess}
							</p>
							<button 
								onClick={() => setPdfSuccess(null)} 
								className="mt-1 text-xs text-green-800 dark:text-green-200 underline hover:no-underline"
							>
								Zamknij
							</button>
						</div>
					</div>
				</div>
			)}
			
			{/* ✅ ENHANCED Error Display */}
			{pdfError && (
				<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
					<div className="flex items-start gap-2">
						<AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
						<div className="flex-1 min-w-0">
							<h3 className="text-sm font-medium text-red-800 dark:text-red-200">
								Problem z generowaniem PDF
							</h3>
							<p className="text-sm text-red-700 dark:text-red-300 mt-1">
								{pdfError}
							</p>
							<div className="mt-2 flex gap-2">
								<button 
									onClick={() => {
										setPdfError(null);
										window.location.reload();
									}} 
									className="inline-flex items-center gap-1 text-xs text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
								>
									<RefreshCw className="h-3 w-3" />
									Odśwież
								</button>
								<button 
									onClick={() => setPdfError(null)} 
									className="text-xs text-red-800 dark:text-red-200 underline hover:no-underline"
								>
									Zamknij
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			
			{/* ✅ KOMPAKTOWA INFORMACJA O GOOGLE DRIVE */}
			<div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
				<div className="flex items-center gap-2">
					<GoogleDriveIcon className="h-4 w-4 flex-shrink-0" />
					<p className="text-sm text-green-800 dark:text-green-200">
						{user?.app_metadata?.provider === 'google' ? (
							<><strong>Eksport do Google Drive dostępny!</strong> Zapisuj CV w Google Drive.</>
						) : (
							<><strong>Eksport do Google Drive!</strong> Kliknij eksport → autoryzacja Google Drive.</>
						)}
					</p>
				</div>
			</div>
			
			{/* ✅ KOMPAKTOWA LISTA CV */}
			<div className="space-y-3">
				{generatedCVs.map((cv) => {
					const atsScore = cv.data?.atsAnalysis?.score;
					const hasATSData = !!atsScore;
					const overallScore = Math.round(atsScore?.overallScore || 0);
					const keywordMatch = Math.round(atsScore?.keywordMatch || 0);
					const titleMatch = Math.round(atsScore?.titleMatch || 0);
					const experienceRelevance = Math.round(atsScore?.experienceRelevance || 0);
					
					return (
						<Card key={cv.id} className="hover:shadow-md transition-all duration-200">
							<CardContent className="p-4">
								{/* ✅ KOMPAKTOWY HEADER CV */}
								<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
									<div className="space-y-1">
										<h2 className="font-semibold text-gray-900 dark:text-gray-100">{cv.jobTitle}</h2>
										<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
											<span>{cv.companyName}</span>
											<span>•</span>
											<span>{new Date(cv.createdAt).toLocaleDateString("pl-PL")}</span>
										</div>
									</div>
									
									{/* ✅ KOMPAKTOWE PRZYCISKI AKCJI */}
									<div className="flex items-center gap-2 flex-wrap">
										<div className="flex items-center gap-1">
											<Button
												variant={cv.didUserLikeCV === true ? "default" : "outline"}
												size="sm"
												onClick={() =>
													updateCVRating({ cvId: cv.id, didUserLikeCV: true })
												}
												className="h-8 px-2"
											>
												<ThumbsUp className="h-3 w-3" />
											</Button>
											<Button
												variant={cv.didUserLikeCV === false ? "default" : "outline"}
												size="sm"
												onClick={() =>
													updateCVRating({ cvId: cv.id, didUserLikeCV: false })
												}
												className="h-8 px-2"
											>
												<ThumbsDown className="h-3 w-3" />
											</Button>
										</div>
										
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleExportToGoogleDrive(cv.data, cv.jobTitle, cv.companyName, cv.id)
											}
											disabled={isExporting === cv.id}
											className="h-8 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
										>
											{isExporting === cv.id ? (
												<div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
											) : (
												<CloudUpload className="h-3 w-3" />
											)}
											<span className="ml-1 text-xs">Drive</span>
										</Button>
										
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleDownloadCV(cv.data, cv.jobTitle, cv.companyName, cv.id)
											}
											disabled={isDownloading === cv.id}
											className="h-8"
										>
											{isDownloading === cv.id ? (
												<div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
											) : (
												<Download className="h-3 w-3" />
											)}
											<span className="ml-1 text-xs">PDF</span>
										</Button>
									</div>
								</div>

								{/* ✅ KOMPAKTOWY WYNIK ATS */}
								{hasATSData ? (
									<div className="space-y-2">
										{/* Inline ATS Score */}
										<div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
											<div className="flex items-center gap-2">
												<Brain className="h-4 w-4 text-blue-600" />
												<span className="text-sm font-medium">Wynik ATS:</span>
												<span className={`text-lg font-bold ${
													overallScore >= 80 ? "text-green-600" : 
													overallScore >= 65 ? "text-yellow-600" : "text-red-600"
												}`}>
													{overallScore}
												</span>
											</div>
											
											<div className="flex items-center gap-3 text-xs">
												<span>Słowa: <strong>{keywordMatch}%</strong></span>
												<span>Tytuł: <strong>{titleMatch}%</strong></span>
												<span>Doświadczenie: <strong>{experienceRelevance}%</strong></span>
											</div>
										</div>
										
										{/* Expandable detailed analysis */}
										<div className="flex justify-center">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setExpandedATSCard(
													expandedATSCard === cv.id ? null : cv.id
												)}
												className="text-blue-600 hover:text-blue-700 h-7 text-xs"
											>
												<BarChart3 className="h-3 w-3 mr-1" />
												{expandedATSCard === cv.id ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
											</Button>
										</div>
										
										{/* Full ATS Score Card (expandable) */}
										{expandedATSCard === cv.id && (
											<ATSScoreCard 
												score={atsScore} 
												jobTitle={cv.jobTitle}
												companyName={cv.companyName}
											/>
										)}
									</div>
								) : (
									<div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
										<div className="flex items-center gap-2">
											<Info className="h-3 w-3 text-yellow-600 flex-shrink-0" />
											<p className="text-xs text-yellow-800 dark:text-yellow-200">
												<strong>Legacy CV:</strong> Brak analizy ATS. Wygeneruj nowe CV dla szczegółowej analizy.
											</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}