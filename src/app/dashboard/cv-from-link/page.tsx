//src/app/dashboard/cv-from-link/page.tsx
import PrivatePage from "~/components/AuthProvider/PrivatePage/PrivatePage";
import { GenerateCVFromLink } from "~/components/GenerateCVFromLink";

export default function CVFromLinkPage() {
	return (
		<PrivatePage>
			<div className="container mx-auto py-6 w-full max-w-4xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Generuj CV z linku</h1>
					<p className="text-muted-foreground mt-2">
						Podaj link do oferty pracy z LinkedIn lub RocketJobs, a my wygenerujemy 
						dla Ciebie CV idealnie dopasowane do tego stanowiska.
					</p>
					<div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
						<p className="text-sm text-blue-800 dark:text-blue-200">
							<strong>Wspieramy:</strong> linkedin.com i rocketjobs.pl
						</p>
					</div>
				</div>
				<GenerateCVFromLink />
			</div>
		</PrivatePage>
	);
}