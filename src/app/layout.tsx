//src/app/layout.tsx
import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";

import { CSPostHogProvider } from "~/components/PosthogProvider";
import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/components/AuthProvider/AuthProvider";
import { ErrorBoundary } from "~/components/ErrorBoundary/ErrorBoundary";
import { headers } from "next/headers";
import { getServerUser } from "~/components/AuthProvider/getServerUser";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "Aplikomat | Generator CV ze sztuczną inteligencją",
	description:
		"Generuj spersonalizowane CV za pomocą sztucznej inteligencji na podstawie profilu LinkedIn i ogłoszenia o pracę",
	openGraph: {
		images: ["https://aplikomat.vercel.app/logos/large-logo.png"],
	},
};

// Script to prevent flash of wrong theme
function ThemeScript() {
	return (
		<script
			dangerouslySetInnerHTML={{
				__html: `
					(function() {
						try {
							const storedTheme = localStorage.getItem('theme');
							const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
							const theme = storedTheme || (prefersDark ? 'dark' : 'light');

							if (theme === 'dark') {
								document.documentElement.classList.add('dark');
							} else {
								document.documentElement.classList.remove('dark');
							}
						} catch (e) {
							console.error('Failed to set initial theme', e);
						}
					})();
				`,
			}}
		/>
	);
}

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const user = await getServerUser();
	return (
		<html lang="en" className={`${GeistSans.variable} antialiased`}>
			<head>
				<ThemeScript />
			</head>
			<body>
				<Toaster richColors />
				<ErrorBoundary>
					<CSPostHogProvider>
						<TRPCReactProvider headers={await headers()}>
							<AuthProvider {...user}>{children}</AuthProvider>
						</TRPCReactProvider>
					</CSPostHogProvider>
				</ErrorBoundary>
			</body>
		</html>
	);
}
