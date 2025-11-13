//src/app/new/page.tsx
"use client";

import { supabase } from "~/server/supabase/supabaseClient";
import { BorderBeam } from "../landingPageComponents/BorderBeam";
import { CompanySection } from "../landingPageComponents/CompanySection";
import { EnhancedStatsSection } from "../landingPageComponents/EnhancedStatsSection";
import { JobBoardsSection } from "../landingPageComponents/JobBoardsSection";
import { Particles } from "../landingPageComponents/Particles";
import { TestimonialsSection } from "../landingPageComponents/TestimonialsSection";
import { motion, AnimatePresence } from "framer-motion";
import {
	Star,
	LinkedinIcon,
	UploadCloudIcon,
	LogInIcon,
	ArrowRight,
	X,
	UserPlus,
} from "lucide-react";
import { useState } from "react";

// Google Icon Component
const GoogleIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24">
		<path
			fill="#4285F4"
			d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
		/>
		<path
			fill="#34A853"
			d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
		/>
		<path
			fill="#FBBC05"
			d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
		/>
		<path
			fill="#EA4335"
			d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
		/>
	</svg>
);

// Auth Modal Component
const AuthModal = ({ 
	isOpen, 
	onClose, 
	onAuthComplete 
}: { 
	isOpen: boolean; 
	onClose: () => void;
	onAuthComplete: () => void;
}) => {
	const [isLoading, setIsLoading] = useState<string | null>(null);

	const handleSocialLogin = async (provider: 'google' | 'linkedin_oidc') => {
		setIsLoading(provider);
		try {
			const { error } = await supabase().auth.signInWithOAuth({
				provider,
				options: {
					scopes: provider === 'linkedin_oidc' ? "openid profile email" : "openid profile email",
					redirectTo: `${window.location.origin}/dashboard`,
				},
			});
			
			if (error) {
				console.error(`${provider} login error:`, error);
				setIsLoading(null);
			} else {
				onAuthComplete();
			}
		} catch (error) {
			console.error(`${provider} login error:`, error);
			setIsLoading(null);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					/>
					
					{/* Modal */}
					<motion.div
						className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/90 p-6 backdrop-blur-xl"
						initial={{ opacity: 0, scale: 0.95, y: -20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -20 }}
						transition={{ duration: 0.2 }}
					>
						<BorderBeam className="opacity-50" />
						
						{/* Header */}
						<div className="mb-6 flex items-center justify-between">
							<h3 className="text-xl font-semibold text-white">
								Załóż konto
							</h3>
							<button
								onClick={onClose}
								className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
							>
								<X size={20} />
							</button>
						</div>

						{/* Description */}
						<p className="mb-6 text-sm text-gray-400">
							Wybierz sposób logowania, aby rozpocząć tworzenie CV dopasowanego do ofert pracy.
						</p>

						{/* Social Login Buttons */}
						<div className="space-y-3">
							{/* Google Login */}
							<motion.button
								onClick={() => handleSocialLogin('google')}
								disabled={isLoading !== null}
								className="relative w-full rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
								whileHover={{ scale: isLoading ? 1 : 1.02 }}
								whileTap={{ scale: isLoading ? 1 : 0.98 }}
							>
								<div className="flex items-center gap-3">
									{isLoading === 'google' ? (
										<div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
									) : (
										<GoogleIcon className="h-5 w-5" />
									)}
									<div>
										<div className="font-medium text-white">Kontynuuj z Google</div>
										<div className="text-xs text-gray-400">Najszybsza opcja</div>
									</div>
								</div>
							</motion.button>

							{/* LinkedIn Login */}
							<motion.button
								onClick={() => handleSocialLogin('linkedin_oidc')}
								disabled={isLoading !== null}
								className="relative w-full rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
								whileHover={{ scale: isLoading ? 1 : 1.02 }}
								whileTap={{ scale: isLoading ? 1 : 0.98 }}
							>
								<div className="flex items-center gap-3">
									{isLoading === 'linkedin_oidc' ? (
										<div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />
									) : (
										<LinkedinIcon className="h-5 w-5 text-blue-400" />
									)}
									<div>
										<div className="font-medium text-white">Kontynuuj z LinkedIn</div>
										<div className="text-xs text-gray-400">Import danych z profilu</div>
									</div>
								</div>
							</motion.button>
						</div>

						{/* Terms */}
						<p className="mt-6 text-xs text-gray-500">
							Kontynuując, akceptujesz nasze{" "}
							<a href="#" className="text-white underline">Warunki użytkowania</a> i{" "}
							<a href="#" className="text-white underline">Politykę prywatności</a>.
						</p>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

export default function LandingPage() {
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

	return (
		<div className="relative min-h-screen overflow-hidden bg-black text-white">
			{/* Animated background particles */}
			<Particles className="-z-10" />

			{/* Gradient orbs */}
			<div className="absolute -left-32 top-20 h-96 w-96 animate-blob rounded-full bg-[#ffaa40] opacity-20 mix-blend-multiply blur-[128px] filter" />
			<div className="animation-delay-2000 absolute -right-32 top-40 h-96 w-96 animate-blob rounded-full bg-[#9c40ff] opacity-20 mix-blend-multiply blur-[128px] filter" />
			<div className="animation-delay-4000 absolute -bottom-32 left-1/2 h-96 w-96 animate-blob rounded-full bg-[#40ffb5] opacity-20 mix-blend-multiply blur-[128px] filter" />

			{/* Auth Modal */}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				onAuthComplete={() => setIsAuthModalOpen(false)}
			/>

			{/* Main content */}
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

				{/* New Hero Section with Options */}
				<motion.div
					className="mb-16 text-center"
					initial="hidden"
					animate="visible"
					variants={{
						hidden: {},
						visible: { transition: { staggerChildren: 0.1 } },
					}}
				>
					<motion.h1
						className="text-balance bg-linear-to-br from-white from-30% to-white/40 bg-clip-text py-4 text-5xl font-medium leading-none tracking-tighter text-transparent sm:text-6xl md:text-7xl"
						variants={{
							hidden: { opacity: 0, y: -20 },
							visible: {
								opacity: 1,
								y: 0,
								transition: { duration: 0.6, delay: 0.2 },
							},
						}}
					>
						Aplikomat
					</motion.h1>
					<motion.p
						className="mb-10 text-balance text-lg tracking-tight text-gray-400 md:text-xl"
						variants={{
							hidden: { opacity: 0, y: -20 },
							visible: {
								opacity: 1,
								y: 0,
								transition: { duration: 0.6, delay: 0.3 },
							},
						}}
					>
						Stwórz CV dopasowane do ofert pracy w kilka sekund. Wybierz sposób
						rozpoczęcia:
					</motion.p>

					<motion.div
						className="grid grid-cols-1 gap-8 md:grid-cols-2"
						variants={{
							hidden: {},
							visible: {
								transition: { staggerChildren: 0.2, delayChildren: 0.5 },
							},
						}}
					>
						{/* Option 1: Create Account (Google/LinkedIn) */}
						<motion.div
							className="group relative flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-linear-to-br from-blue-600/20 to-purple-600/20 p-8 text-center backdrop-blur-xs transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20"
							variants={{
								hidden: { opacity: 0, y: 20 },
								visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
							}}
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.98 }}
						>
							<BorderBeam className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100" />
							<div>
								<UserPlus className="mx-auto mb-4 h-12 w-12 text-blue-400" />
								<h3 className="mb-2 text-xl font-semibold text-white">
									Załóż konto
								</h3>
								<p className="mb-6 text-sm text-gray-400">
									Najszybsza opcja - Google lub LinkedIn
									<br />
									<span className="font-medium text-white/80">
										(zajmie ~30 sekund)
									</span>
								</p>
							</div>
							<motion.button
								onClick={() => setIsAuthModalOpen(true)}
								className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-500 to-purple-600 px-6 py-3 font-medium text-white transition-colors hover:from-blue-600 hover:to-purple-700"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								Rozpocznij teraz <ArrowRight size={18} />
							</motion.button>
						</motion.div>

						{/* Option 2: Upload CV / Google Login */}
						<motion.div
							className="group relative flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-linear-to-br from-purple-600/20 to-purple-800/10 p-8 text-center backdrop-blur-xs transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20"
							variants={{
								hidden: { opacity: 0, y: 20 },
								visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
							}}
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.98 }}
						>
							<BorderBeam className="opacity-0 transition-opacity group-hover:opacity-100" />
							<div>
								<UploadCloudIcon className="mx-auto mb-4 h-12 w-12 text-purple-400" />
								<h3 className="mb-2 text-xl font-semibold text-white">
									Zacznij z istniejącym CV
								</h3>
								<p className="mb-6 text-sm text-gray-400">
									Prześlij swoje obecne CV (PDF). Wymagane logowanie Google.
									<br />
									<span className="font-medium text-white/80">
										(zajmie ~3 minuty)
									</span>
								</p>
							</div>
							<motion.button
								onClick={() => setIsAuthModalOpen(true)}
								className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-purple-500 to-purple-600 px-6 py-3 font-medium text-white transition-colors hover:from-purple-600 hover:to-purple-700"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<LogInIcon size={18} /> Wgraj CV
							</motion.button>
						</motion.div>
					</motion.div>
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