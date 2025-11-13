// src/middleware.ts
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const url = request.nextUrl;

	// Posthog  -----------------------------------------------------------------
	if (url.pathname.startsWith("/ingest-internal-service/")) {
		const posthogUrl = request.nextUrl.clone();
		const hostname = posthogUrl.pathname.startsWith(
			"/ingest-internal-service/static/",
		)
			? "eu-assets.i.posthog.com"
			: "eu.i.posthog.com";
		const requestHeaders = new Headers(request.headers);

		requestHeaders.set("host", hostname);

		posthogUrl.protocol = "https";
		posthogUrl.hostname = hostname;
		posthogUrl.port = "443";
		posthogUrl.pathname = posthogUrl.pathname.replace(
			/^\/ingest-internal-service/,
			"",
		);

		return NextResponse.rewrite(posthogUrl, {
			headers: requestHeaders,
		});
	}
	// Posthog end ------------------------------------------------------------------------------

	// Maintenance mode ------------------------------------------------------------------------------
	// Check for maintenance mode using environment variables
	// In edge runtime, we need to use process.env directly, not the env.js file
	let isInMaintenanceMode = false;

	if (process.env.VERCEL_ENV) {
		// On Vercel, use Edge Config if available
		try {
			const { get } = await import("@vercel/edge-config");
			isInMaintenanceMode = await get("isInMaintenanceMode") || false;
		} catch (error) {
			// Fallback to environment variables
			isInMaintenanceMode = process.env.IS_IN_MAINTENANCE_MODE === "true" || 
								 process.env.MAINTENANCE_MODE === "true";
		}
	} else {
		// Local development - use environment variables
		isInMaintenanceMode = process.env.IS_IN_MAINTENANCE_MODE === "true" || 
							 process.env.MAINTENANCE_MODE === "true";
	}

	// If in maintenance mode, point the url pathname to the maintenance page
	if (isInMaintenanceMode && url.pathname === "/") {
		url.pathname = "/maintenance";
		return NextResponse.rewrite(url);
	}
	// Maintenance mode end ------------------------------------------------------------------------------

	return NextResponse.next({
		request,
	});
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		"/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
	],
};