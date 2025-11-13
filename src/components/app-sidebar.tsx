//src/components/app-sidebar.tsx
"use client";

import { DashboardIcon } from "@radix-ui/react-icons";
import { FileOutputIcon, LifeBuoy, Moon, Send, FileText, Link } from "lucide-react";
import { NavMain } from "~/components/nav-main";
import { NavSecondary } from "~/components/nav-secondary";
import { NavUser } from "~/components/nav-user";
import { ThemeToggle } from "~/components/theme-toggle";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "~/components/ui/sidebar";
import { useUser } from "./AuthProvider/AuthProvider";
import { IconLogo, LogoWithText } from "./Logo/Logo";

const data = {
	navMain: [
		{
			title: "Panel Główny",
			url: "/dashboard",
			icon: DashboardIcon,
		},
		{
			title: "Generuj CV",
			url: "/dashboard/jobs",
			icon: FileOutputIcon,
		},
		{
			title: "Generuj CV z linku",
			url: "/dashboard/cv-from-link",
			icon: Link,
		},
		{
			title: "Moje CV",
			url: "/dashboard/cv",
			icon: FileText,
		},
	],
	navSecondary: [
		{
			title: "Support",
			url: "https://www.linkedin.com/in/arturlamali/",
			icon: LifeBuoy,
		},
		{
			title: "Feedback",
			url: "https://www.linkedin.com/in/arturlamali/",
			icon: Send,
		},
		{
			title: "Zmień motyw",
			url: "#",
			icon: Moon,
			component: ThemeToggle,
		},
	],
	// projects: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const user = useUser();
	const { state } = useSidebar();
	return (
		<Sidebar variant="inset" collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton className="bg-transparent " size="lg" asChild>
							<a href="/dashboard">
								{state === "expanded" ? (
									<LogoWithText className="rounded-lg p-3 transition-colors invert dark:invert-0" />
								) : (
									<IconLogo className="transition-colors invert dark:invert-0" />
								)}
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				{/* <NavProjects projects={data.projects} /> */}
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{
						name: user?.user?.user_metadata?.name || "",
						email: user?.user?.email || "",
						avatar: user?.user?.user_metadata?.picture || "",
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	);
}