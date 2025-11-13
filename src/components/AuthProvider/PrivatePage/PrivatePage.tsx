//src/components/AuthProvider/PrivatePage/PrivatePage.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "../AuthProvider";
import { LoadingScreen } from "~/components/Loading";

export default function PrivatePage({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();

	const { user, isLoading } = useUser();

	useEffect(() => {
		if (!user && !isLoading) {
			router.push("/sign-up");
		}
	}, [user, router, isLoading]);

	if (!user || isLoading) return <LoadingScreen />;

	return <>{children}</>;
}
