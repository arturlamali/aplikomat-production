//src/app/dashboard/jobs/page.tsx
import PrivatePage from "~/components/AuthProvider/PrivatePage/PrivatePage";
import { JobSearch } from "~/components/JobSearch";

export default function JobsPage() {
	return (
		<PrivatePage>
			<div className="container mx-auto py-6 w-full">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Wyszukiwanie pracy</h1>
					<p className="text-muted-foreground mt-2">
						Znajdź idealną ofertę pracy dzięki naszemu zaawansowanemu systemowi
						filtrowania. Przeglądaj dostępne stanowiska według poziomu
						doświadczenia, rodzaju miejsca pracy i innych kryteriów.
					</p>
				</div>
				<JobSearch />
			</div>
		</PrivatePage>
	);
}
