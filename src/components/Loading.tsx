//src/components/Loading.tsx
import React from "react";
import { Loader, type LucideProps } from "lucide-react";
import { cn } from "~/lib/utils";

export const Spinner = ({ className, ...props }: LucideProps) => (
	<Loader
		className={cn("h-5 w-5 animate-spin text-gray-500", className)}
		{...props}
	/>
);

export const LoadingScreen = () => {
	return (
		<div className="absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center">
			<Spinner className="h-10 w-10 " />
		</div>
	);
};
