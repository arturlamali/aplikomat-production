"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import type { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "~/server/api/root";

export default function AdminPage() {
	const [file, setFile] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<{
		inserted: number;
		updated: number;
		total: number;
	} | null>(null);

	const uploadJobsMutation = api.admin.uploadJobs.useMutation({
		onSuccess: (data) => {
			setSuccess({
				inserted: data.inserted,
				updated: data.updated,
				total: data.total,
			});
			setIsLoading(false);
			setFile(null);
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onError: (error: any) => {
			setError(error.message || "An error occurred");
			setIsLoading(false);
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
			setError(null);
			setSuccess(null);
		}
	};

	const handleUpload = async () => {
		if (!file) {
			setError("Please select a file first");
			return;
		}

		try {
			setIsLoading(true);
			const reader = new FileReader();

			reader.onload = async (e) => {
				try {
					const content = e.target?.result as string;
					const jobsData = JSON.parse(content);

					await uploadJobsMutation.mutateAsync({ jobs: jobsData });
				} catch (err) {
					setError(
						"Failed to parse JSON file. Please ensure the file contains valid JSON data.",
					);
					setIsLoading(false);
				}
			};

			reader.onerror = () => {
				setError("Error reading file");
				setIsLoading(false);
			};

			reader.readAsText(file);
		} catch (err) {
			setError("An unexpected error occurred");
			setIsLoading(false);
		}
	};

	return (
		<div className="container mx-auto py-10">
			<Card className="w-full max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>Admin Dashboard</CardTitle>
					<CardDescription>
						Upload job data to insert into the database
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						<div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-gray-400 transition-colors">
							<Upload className="h-10 w-10 text-gray-400 mb-2" />
							<label
								htmlFor="file-upload"
								className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
							>
								Select File
								<input
									id="file-upload"
									type="file"
									accept=".json"
									onChange={handleFileChange}
									className="hidden"
								/>
							</label>
							{file && (
								<p className="mt-2 text-sm text-gray-600">
									Selected: {file.name}
								</p>
							)}
						</div>

						<Button
							onClick={handleUpload}
							disabled={!file || isLoading}
							className="w-full"
						>
							{isLoading ? "Uploading..." : "Upload Jobs Data"}
						</Button>

						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{success && (
							<Alert className="bg-green-50 border-green-200">
								<CheckCircle2 className="h-4 w-4 text-green-600" />
								<AlertTitle className="text-green-800">Success</AlertTitle>
								<AlertDescription className="text-green-700">
									Jobs processed successfully. Inserted: {success.inserted},
									Updated: {success.updated}, Total: {success.total}
								</AlertDescription>
							</Alert>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
