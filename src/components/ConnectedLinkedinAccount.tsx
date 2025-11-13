// src/components/ConnectedLinkedinAccount.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
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
import { ExclamationTriangleIcon, ArrowDownIcon } from "@radix-ui/react-icons";
import { LinkedinIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

interface LinkedinProfileForm {
	linkedinUrl: string;
}

const LinkedinProfileSkeleton = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Skeleton className="h-6 w-[200px]" />
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center space-x-2">
							<Skeleton className="h-4 w-[150px]" />
							<Skeleton className="h-4 w-[250px]" />
						</div>
						<div className="flex items-center space-x-2">
							<Skeleton className="h-4 w-[150px]" />
							<Skeleton className="h-4 w-[200px]" />
						</div>
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<Skeleton className="h-10 w-full" />
			</CardFooter>
		</Card>
	);
};

export const ConnectedLinkedinAccount = () => {
	const [showLinkedinHelper, setShowLinkedinHelper] = useState(false);

	const { data: profileData, isLoading: isLoadingProfile } =
		api.linkedinScraper.getLinkedinProfileByCurrentUser.useQuery();

	const { mutate: updateProfile, isPending: isUpdatingProfile } =
		api.linkedinScraper.updateLinkedinProfileByCurrentUser.useMutation();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LinkedinProfileForm>();

	const onSubmit = (data: LinkedinProfileForm) => {
		updateProfile({ url: data.linkedinUrl });
	};

	const hasProfileData = profileData?.profileData;

	if (isLoadingProfile) {
		return <LinkedinProfileSkeleton />;
	}

	return (
		<Card className={!hasProfileData ? "border-2 border-amber-400" : ""}>
			<CardHeader>
				<CardTitle>Twój profil LinkedIn</CardTitle>
				{!hasProfileData && (
					<CardDescription className="text-amber-600">
						Hej 👋 Wygląda na to, że brakuje nam danych z Twojego LinkedIn!
					</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				{hasProfileData ? (
					<div className="space-y-2">
						<p>
							<span className="font-medium">Aktualny URL profilu:</span>{" "}
							{profileData.profileUrl}
						</p>
						<p>
							<span className="font-medium">Ostatnia aktualizacja:</span>{" "}
							{profileData.updatedAt
								? new Date(profileData.updatedAt).toLocaleString("pl-PL", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})
								: "Brak danych o aktualizacji"}
						</p>
					</div>
				) : (
					<Alert className="bg-amber-50 border-amber-400">
						<ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
						<AlertTitle className="text-amber-800 text-lg font-semibold">
							Potrzebujemy Twojej pomocy! 👇
						</AlertTitle>
						<AlertDescription className="text-amber-700">
							<p className="mb-3">
								Wygląda na to, że nie mamy jeszcze danych z Twojego profilu
								LinkedIn. Uzupełnij je, aby w pełni korzystać z możliwości
								aplikacji! ✨
							</p>
							<p>
								Wklej poniżej link do swojego profilu LinkedIn i kliknij
								"Pobierz dane profilu", a my zajmiemy się resztą. 💪
							</p>
						</AlertDescription>
						<div className="flex justify-center mt-4">
							<ArrowDownIcon className="h-6 w-6 text-amber-600 animate-bounce" />
						</div>
					</Alert>
				)}
			</CardContent>
			<CardFooter
				className={
					!hasProfileData
						? "bg-amber-50 pt-3 pb-4 border-t border-amber-200"
						: ""
				}
			>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="flex w-full flex-col space-y-4"
				>
					<div className="flex flex-col space-y-1.5">
						<Input
							id="linkedinUrl"
							placeholder="Wklej link do profilu LinkedIn (np. https://www.linkedin.com/in/twojanazwa)"
							{...register("linkedinUrl", {
								required: "Podaj link do swojego profilu LinkedIn, proszę 🙏",
							})}
							className={
								!hasProfileData
									? "border-amber-400 focus-visible:ring-amber-500"
									: ""
							}
							onClick={() => setShowLinkedinHelper(true)}
							onFocus={() => setShowLinkedinHelper(true)}
						/>
						{errors.linkedinUrl && (
							<p className="text-sm text-red-500">
								{errors.linkedinUrl.message}
							</p>
						)}

						{/* ✅ LINKEDIN HELPER - jak w landing page */}
						<AnimatePresence>
							{showLinkedinHelper && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="mt-2 text-left"
								>
									<a
										href="https://linkedin.com/in/"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-[#0077b5]/20 px-3 py-2 text-sm text-blue-800 dark:text-blue-200 transition-colors hover:bg-[#0077b5]/30"
									>
										<LinkedinIcon size={16} />
										Pobierz link do swojego profilu
									</a>
									<p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
										Kliknij, aby przejść do swojego profilu LinkedIn i skopiować
										adres URL
									</p>
									<button
										type="button"
										onClick={() => setShowLinkedinHelper(false)}
										className="mt-2 text-xs text-gray-500 dark:text-gray-400 underline hover:no-underline"
									>
										Ukryj
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					<Button
						type="submit"
						disabled={isUpdatingProfile}
						className={!hasProfileData ? "bg-amber-600 hover:bg-amber-700" : ""}
					>
						{isUpdatingProfile
							? "Pobieram dane... ⏳"
							: "Odśwież dane profilu (Działa raz na 24h)"}
					</Button>
				</form>
			</CardFooter>
		</Card>
	);
};