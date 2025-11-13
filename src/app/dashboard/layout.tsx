//src// src/app/dashboard/layout.tsx
"use client";

import type { ReactNode } from "react";
import { Separator } from "~/components/ui/separator"; // Assuming shadcn/ui
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"; // Assuming shadcn/ui
import { AppSidebar } from "~/components/app-sidebar"; // Assuming custom sidebar components
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "~/components/ui/sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	// Get the current pathname to create dynamic breadcrumbs
	const pathname = usePathname();

	// Parse the pathname to create breadcrumb segments
	const segments = pathname
		.split("/")
		.filter((segment) => segment)
		.map((segment) => ({
			label:
				segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
			href: `/${segment}`,
		}));

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 h-4" />
						<Breadcrumb>
							<BreadcrumbList>
								{segments.length > 0 && (
									<>
										<BreadcrumbItem className="hidden md:block">
											<BreadcrumbLink href={segments[0].href}>
												{segments[0].label}
											</BreadcrumbLink>
										</BreadcrumbItem>
										{segments.length > 1 && (
											<>
												<BreadcrumbSeparator className="hidden md:block" />
												<BreadcrumbItem>
													<BreadcrumbPage>{segments[1].label}</BreadcrumbPage>
												</BreadcrumbItem>
											</>
										)}
									</>
								)}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>
				<main className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
