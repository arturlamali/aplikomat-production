//src/components/JobCard.tsx
import { useState } from "react";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";
import {
	MapPin,
	Briefcase,
	Clock,
	Star,
	FileText,
	ExternalLink,
} from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";
import { pdf } from "@react-pdf/renderer";
import { ResumePDF } from "~/components/ResumePDF";
import { toast } from "sonner";
type Job = RouterOutputs["jobs"]["searchJobs"]["data"][number];

interface JobCardProps {
	job: Job;
}

export function JobCard({ job }: JobCardProps) {
	const { data: generatedCV } = api.jobs.getGeneratedCVByJobId.useQuery({
		jobId: job.id,
	});

	const { mutate: generateCvAndSave, isPending } =
		api.jobs.generateCvAndSave.useMutation({
			onSuccess: () => {
				toast.success("CV wygenerowane pomyślnie");
			},
			onError: () => {
				toast.error("Wystąpił błąd podczas generowania CV");
			},
		});

	const handleCVAction = async () => {
		if (generatedCV) {
			// If CV is already generated, create and download PDF
			try {
				const pdfBlob = await pdf(
					<ResumePDF
						data={generatedCV.data}
						jobTitle={job.title}
						companyName={job.companyName}
					/>,
				).toBlob();

				const reader = new FileReader();
				reader.readAsDataURL(pdfBlob);
				reader.onloadend = () => {
					if (typeof reader.result === "string") {
						const base64data = reader.result.split(",")[1] ?? null;
						if (base64data) {
							const link = document.createElement("a");
							link.href = `data:application/pdf;base64,${base64data}`;
							link.download = `cv-${job.companyName}-${job.title}.pdf`;
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);
						}
					}
				};
			} catch (error) {
				console.error("Error generating PDF:", error);
				alert("Wystąpił błąd podczas generowania PDF. Spróbuj ponownie.");
			}
		} else {
			// If not generated yet, call the mutation and generate CV
			generateCvAndSave({ jobId: job.id });
		}
	};

	return (
		<Card className="hover:shadow-md transition-shadow overflow-hidden">
			<CardHeader className="px-5 py-3 space-y-0">
				<div className="flex items-start md:items-center">
					<div className="relative h-14 w-14 mr-5 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
						{job.companyLogoThumbUrl ? (
							<Image
								unoptimized
								src={job.companyLogoThumbUrl}
								alt={job.companyName}
								fill
								className="object-contain"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500">
								{job.companyName.charAt(0)}
							</div>
						)}
					</div>

					<div className="flex-grow">
						<h3 className="font-semibold text-lg line-clamp-1">{job.title}</h3>
						<div className="flex items-center text-sm text-muted-foreground gap-2 mt-1">
							<span>{job.companyName}</span>
							<span>•</span>
							<span className="flex items-center">
								<MapPin className="h-3.5 w-3.5 mr-1" />
								{job.city}
							</span>
						</div>
					</div>

					<div className="hidden md:flex md:flex-col md:items-end md:gap-2">
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								className="gap-1 text-xs h-9"
								onClick={handleCVAction}
								disabled={isPending}
							>
								<FileText className="h-3.5 w-3.5" />
								{isPending
									? "Generowanie..."
									: generatedCV
										? "Pobierz CV"
										: "Generuj CV ✨"}
							</Button>
							<a
								href={`https://rocketjobs.pl/oferta-pracy/${job.slug}?utm_source=aplikomat.pl&utm_medium=polecane&utm_campaign=generowanie-cv`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center gap-1 text-xs rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-3 py-1"
							>
								<ExternalLink className="h-3.5 w-3.5" />
								Aplikuj 🚀
							</a>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className="px-5 py-3">
				<div className="flex flex-wrap gap-2 mb-4">
					<Badge
						variant="outline"
						className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
					>
						<Briefcase className="h-3 w-3" />
						{job.workplaceType === "remote"
							? "Praca w pełni zdalna"
							: job.workplaceType === "hybrid"
								? "Praca hybrydowa"
								: job.workplaceType === "office"
									? "Praca stacjonarna"
									: job.workplaceType === "mobile"
										? "Praca mobilna"
										: job.workplaceType || ""}
					</Badge>
					<Badge
						variant="outline"
						className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
					>
						<Star className="h-3 w-3" />
						{job.experienceLevel === "junior"
							? "Junior"
							: job.experienceLevel === "mid"
								? "Mid"
								: job.experienceLevel === "senior"
									? "Senior"
									: job.experienceLevel === "c_level"
										? "C-Level"
										: job.experienceLevel || ""}
					</Badge>
					{job.employmentTypes &&
						job.employmentTypes.length > 0 &&
						job.employmentTypes[0] && (
							<Badge
								variant="outline"
								className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
							>
								<Clock className="h-3 w-3" />
								{job.employmentTypes[0].type === "permanent"
									? "Umowa o pracę"
									: job.employmentTypes[0].type === "b2b"
										? "B2B"
										: job.employmentTypes[0].type === "mandate_contract"
											? "Umowa zlecenie"
											: job.employmentTypes[0].type === "any"
												? "Dowolna Umowa"
												: job.employmentTypes[0].type === "freelance"
													? "Freelance"
													: job.employmentTypes[0].type === "internship"
														? "Praktyka / Staż"
														: job.employmentTypes[0].type || ""}
							</Badge>
						)}
					{job.employmentTypes &&
						job.employmentTypes.length > 0 &&
						job.employmentTypes[0] &&
						job.employmentTypes[0].from && (
							<Badge
								variant="outline"
								className="flex items-center gap-1 px-2.5 py-1 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
							>
								💰 {job.employmentTypes[0].from} - {job.employmentTypes[0].to}{" "}
								{job.employmentTypes[0].currency}
							</Badge>
						)}
				</div>

				<div className="space-y-3 mt-3">
					{job.requiredSkills && job.requiredSkills.length > 0 && (
						<div>
							<p className="text-xs font-medium text-gray-500 mb-2">
								Wymagane umiejętności:
							</p>
							<div className="flex flex-wrap gap-1.5">
								{job.requiredSkills.map((skill, index) => (
									<Badge
										key={index}
										variant="secondary"
										className="text-xs px-2.5 py-1"
									>
										{skill}
									</Badge>
								))}
							</div>
						</div>
					)}

					{job.niceToHaveSkills && job.niceToHaveSkills.length > 0 && (
						<div>
							<p className="text-xs font-medium text-gray-500 mb-2">
								Mile widziane:
							</p>
							<div className="flex flex-wrap gap-1.5">
								{job.niceToHaveSkills.map((skill, index) => (
									<Badge
										key={index}
										variant="outline"
										className="text-xs px-2.5 py-1 bg-gray-50 dark:bg-gray-800"
									>
										{skill}
									</Badge>
								))}
							</div>
						</div>
					)}
				</div>
			</CardContent>

			<CardFooter className="px-5 py-3 md:hidden">
				<div className="flex justify-between w-full">
					<Button
						variant="outline"
						className="gap-1 text-xs flex-1 mr-2"
						onClick={handleCVAction}
						disabled={isPending}
					>
						<FileText className="h-3.5 w-3.5" />
						{isPending
							? "Generowanie..."
							: generatedCV
								? "Pobierz CV"
								: "Generuj CV ✨"}
					</Button>
					<a
						href={`https://rocketjobs.pl/oferta-pracy/${job.slug}?utm_source=aplikomat.pl&utm_medium=polecane&utm_campaign=generowanie-cv`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center gap-1 text-xs rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 px-3 py-2 flex-1"
						aria-label={`Aplikuj na stanowisko ${job.title} w ${job.companyName}`}
					>
						<ExternalLink className="h-3.5 w-3.5" />
						Aplikuj 🚀
					</a>
				</div>
			</CardFooter>
		</Card>
	);
}
