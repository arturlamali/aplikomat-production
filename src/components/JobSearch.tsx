//src/components/JobSearch.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { MapPin, Loader2, Search, X } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Slider } from "~/components/ui/slider";
import { useDebounce } from "../hooks/useDebounce";
import { JobCard } from "./JobCard";
import {
	Card,
	CardContent,
	CardHeader,
	CardFooter,
} from "~/components/ui/card";

export function JobSearch() {
	// Input state
	const [searchInput, setSearchInput] = useState("");
	const [locationInput, setLocationInput] = useState("");

	// Debounced search state
	const [searchQuery, setSearchQuery] = useState("");
	const [location, setLocation] = useState("");

	// Filter state
	const [workplaceType, setWorkplaceType] = useState<
		"hybrid" | "remote" | "on-site" | "office" | "mobile" | undefined
	>(undefined);
	const [experienceLevel, setExperienceLevel] = useState<
		"junior" | "mid" | "senior" | "c_level" | undefined
	>(undefined);
	const [workingTime, setWorkingTime] = useState<
		"full_time" | "part_time" | "freelance" | "internship" | undefined
	>(undefined);
	const [minSalary, setMinSalary] = useState<number | undefined>(undefined);
	const [salaryValue, setSalaryValue] = useState<number[]>([0]);

	// Debounce search inputs
	const debouncedSearchInput = useDebounce(searchInput, 300);
	const debouncedLocationInput = useDebounce(locationInput, 300);

	// Update debounced search values
	useEffect(() => {
		setSearchQuery(debouncedSearchInput);
	}, [debouncedSearchInput]);

	useEffect(() => {
		setLocation(normalizeLocation(debouncedLocationInput));
	}, [debouncedLocationInput]);

	// Function to normalize location string (remove diacritics and make lowercase)
	const normalizeLocation = useCallback((loc: string): string => {
		return loc
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "");
	}, []);

	// Create ref and inView state for infinite scrolling
	const [ref, inView] = useInView({
		threshold: 0.1, // Trigger when 10% of the element is visible
		rootMargin: "100px", // Load next page when element is 100px from viewport
	});

	// Memoize query parameters to prevent unnecessary query reruns
	const queryParams = useMemo(
		() => ({
			query: searchQuery,
			location: location || undefined,
			workplaceType,
			experienceLevel,
			workingTime,
			minSalary,
			limit: 6,
		}),
		[
			searchQuery,
			location,
			workplaceType,
			experienceLevel,
			workingTime,
			minSalary,
		],
	);

	const {
		data: jobsData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		refetch,
	} = api.jobs.searchJobs.useInfiniteQuery(queryParams, {
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		enabled: true,
		refetchOnWindowFocus: false,
	});

	// Fetch next page when bottom element comes into view
	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

	// Update minSalary when slider value changes - debounced
	const debouncedSalaryValue = useDebounce(salaryValue, 300);
	useEffect(() => {
		if (debouncedSalaryValue[0] !== undefined && debouncedSalaryValue[0] > 0) {
			setMinSalary(debouncedSalaryValue[0]);
		} else {
			setMinSalary(undefined);
		}
	}, [debouncedSalaryValue]);

	const handleSearch = useCallback(() => {
		refetch();
	}, [refetch]);

	// Memoize the flattened jobs array to prevent unnecessary recomputation
	const allJobs = useMemo(
		() => jobsData?.pages.flatMap((page) => page.data) || [],
		[jobsData?.pages],
	);

	const handleGenerateCV = useCallback((jobId: string) => {
		// To be implemented - CV generation logic
		alert("Funkcjonalność generowania CV zostanie wkrótce dodana! 🚀");
	}, []);

	const clearFilters = useCallback(() => {
		setWorkplaceType(undefined);
		setExperienceLevel(undefined);
		setWorkingTime(undefined);
		setMinSalary(undefined);
		setSalaryValue([0]);
	}, []);

	// Memoize active filters state
	const hasActiveFilters = useMemo(
		() =>
			workplaceType !== undefined ||
			experienceLevel !== undefined ||
			workingTime !== undefined ||
			minSalary !== undefined,
		[workplaceType, experienceLevel, workingTime, minSalary],
	);

	return (
		<div className="space-y-6 w-full">
			<Card className="p-5">
				<CardContent className="p-0">
					<div className="flex flex-col gap-5">
						{/* Search input */}
						<div className="flex flex-col md:flex-row gap-3">
							<div className="relative flex-grow">
								<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
									<Search className="h-5 w-5 text-gray-400" />
								</div>
								<Input
									placeholder="Szukaj ofert po tytule, umiejętnościach, firmie..."
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									className="pl-10 py-6 text-base"
								/>
							</div>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
									<MapPin className="h-5 w-5 text-gray-400" />
								</div>
								<Input
									placeholder="Lokalizacja (miasto, ulica)"
									value={locationInput}
									onChange={(e) => setLocationInput(e.target.value)}
									className="pl-10 py-6 text-base"
									title="Wyszukiwanie ignoruje znaki diakrytyczne, więc 'kraków' i 'krakow' dadzą te same wyniki"
								/>
							</div>
						</div>

						{/* Filters section */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Filtry 🛠️
								</h3>
								{hasActiveFilters && (
									<Button
										variant="ghost"
										size="sm"
										onClick={clearFilters}
										className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-500"
									>
										<X className="h-3.5 w-3.5" />
										Wyczyść wszystkie filtry
									</Button>
								)}
							</div>

							{/* Salary Range Input */}
							<Card className="mb-4">
								<CardContent className="p-3">
									<div className="flex justify-between items-center mb-2">
										<h4 className="text-xs font-medium text-gray-500">
											Min. wynagrodzenie (brutto)
										</h4>
										<span className="text-sm font-medium">
											{salaryValue[0] !== undefined && salaryValue[0] > 0
												? `${salaryValue[0].toLocaleString()} PLN`
												: "Brak minimum"}
										</span>
									</div>
									<div className="pt-4 px-2">
										<Slider
											defaultValue={[0]}
											value={salaryValue}
											max={30000}
											step={1000}
											onValueChange={setSalaryValue}
										/>
									</div>
									<div className="flex justify-between mt-2 text-xs text-gray-500">
										<span>0 PLN</span>
										<span>30 000 PLN</span>
									</div>
								</CardContent>
							</Card>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
								{/* Workplace Type Filter */}
								<Card>
									<CardContent className="p-3">
										<h4 className="text-xs font-medium text-gray-500 mb-2">
											Tryb pracy
										</h4>
										<div className="flex flex-wrap gap-2">
											<Button
												variant={
													workplaceType === undefined ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkplaceType(undefined)}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Wszystkie
											</Button>
											<Button
												variant={
													workplaceType === "remote" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkplaceType("remote")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Praca w pełni zdalna
											</Button>
											<Button
												variant={
													workplaceType === "hybrid" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkplaceType("hybrid")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Praca hybrydowa
											</Button>

											<Button
												variant={
													workplaceType === "office" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkplaceType("office")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Praca stacjonarna
											</Button>
											<Button
												variant={
													workplaceType === "mobile" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkplaceType("mobile")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Praca mobilna
											</Button>
										</div>
									</CardContent>
								</Card>

								{/* Experience Level Filter */}
								<Card>
									<CardContent className="p-3">
										<h4 className="text-xs font-medium text-gray-500 mb-2">
											Poziom doświadczenia
										</h4>
										<div className="flex flex-wrap gap-2">
											<Button
												variant={
													experienceLevel === undefined
														? "secondary"
														: "outline"
												}
												size="sm"
												onClick={() => setExperienceLevel(undefined)}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Wszystkie
											</Button>
											<Button
												variant={
													experienceLevel === "junior" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setExperienceLevel("junior")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Staż / Junior
											</Button>
											<Button
												variant={
													experienceLevel === "mid" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setExperienceLevel("mid")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Specjalista / Mid
											</Button>
											<Button
												variant={
													experienceLevel === "senior" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setExperienceLevel("senior")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Starszy specjalista / Senior
											</Button>
											<Button
												variant={
													experienceLevel === "c_level"
														? "secondary"
														: "outline"
												}
												size="sm"
												onClick={() => setExperienceLevel("c_level")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Manager / C level
											</Button>
										</div>
									</CardContent>
								</Card>

								{/* Working Time Filter */}
								<Card>
									<CardContent className="p-3">
										<h4 className="text-xs font-medium text-gray-500 mb-2">
											Wymiar pracy
										</h4>
										<div className="flex flex-wrap gap-2">
											<Button
												variant={
													workingTime === undefined ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkingTime(undefined)}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Wszystkie
											</Button>
											<Button
												variant={
													workingTime === "full_time" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkingTime("full_time")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Pełny etat
											</Button>
											<Button
												variant={
													workingTime === "part_time" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkingTime("part_time")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Niepełny etat
											</Button>
											<Button
												variant={
													workingTime === "freelance" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkingTime("freelance")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Freelance
											</Button>
											<Button
												variant={
													workingTime === "internship" ? "secondary" : "outline"
												}
												size="sm"
												onClick={() => setWorkingTime("internship")}
												className="rounded-full text-xs px-3 py-1 h-auto"
											>
												Praktyka / Staż
											</Button>
										</div>
									</CardContent>
								</Card>
							</div>

							<Button onClick={handleSearch} className="w-full">
								Szukaj ofert pracy 🕵️‍♀️
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-col space-y-6 w-full">
				{isLoading ? (
					// Skeleton loading state for list view
					Array(6)
						.fill(0)
						.map((_, i) => (
							<Card key={i} className="py-2">
								<CardHeader className="p-4 pb-0">
									<div className="flex items-center">
										<Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
										<div className="ml-4 flex-grow space-y-2">
											<Skeleton className="h-5 w-3/5" />
											<Skeleton className="h-4 w-2/5" />
										</div>
										<div className="hidden md:flex gap-2">
											<Skeleton className="h-8 w-24" />
											<Skeleton className="h-8 w-24" />
										</div>
									</div>
								</CardHeader>
								<CardContent className="px-4 pb-4 pt-0">
									<div className="flex flex-wrap gap-2 py-2">
										<Skeleton className="h-6 w-16 rounded-full" />
										<Skeleton className="h-6 w-20 rounded-full" />
										<Skeleton className="h-6 w-14 rounded-full" />
									</div>
									<Skeleton className="h-4 w-full mt-2" />
									<Skeleton className="h-4 w-3/4 mt-2" />
								</CardContent>
							</Card>
						))
				) : allJobs.length > 0 ? (
					<>
						{allJobs.map((job) => (
							<JobCard key={job.id} job={job} onGenerateCV={handleGenerateCV} />
						))}

						{/* Infinite scroll trigger element */}
						{hasNextPage && (
							<div ref={ref} className="flex justify-center items-center py-4">
								{isFetchingNextPage ? (
									<div className="flex items-center gap-2">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
										<p className="text-sm text-muted-foreground">
											Ładowanie kolejnych ofert...⏳
										</p>
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										Przewiń po więcej 👇
									</p>
								)}
							</div>
						)}
					</>
				) : (
					<Card>
						<CardContent className="p-6">
							<p>
								Ups! Nie znaleziono ofert. Spróbuj zmienić zapytanie lub filtry.
								🤔
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
