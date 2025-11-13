"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullPageLoader } from "@/components/full-page-loader";
import { useUser } from "../AuthProvider";

export default function PublicPage({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const { user, isLoading } = useUser();
	const isUserDataLoaded = !isLoading;

	useEffect(() => {
		if (user && isUserDataLoaded) {
			router.push("/pricings");
		}
	}, [user, isUserDataLoaded, router]);

	if (user ?? !isUserDataLoaded) return <FullPageLoader />;

	return <>{children}</>;
}
