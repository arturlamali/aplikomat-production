import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";

export function NavSecondary({
	items,
	...props
}: {
	items: {
		title: string;
		url: string;
		href?: string;
		icon: LucideIcon;
		component?: React.ComponentType;
	}[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild size="sm">
								{item.component ? (
									<div className="flex items-center gap-2">
										<item.icon size={16} className="shrink-0" />
										<span>{item.title}</span>
										<div className="ml-auto">
											<item.component />
										</div>
									</div>
								) : (
									<Link href={item.href || item.url}>
										<item.icon />
										<span>{item.title}</span>
									</Link>
								)}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
