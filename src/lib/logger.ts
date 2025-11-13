// src/lib/logger.ts
import { env } from "~/env";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
	[key: string]: unknown;
}

class Logger {
	private isDevelopment: boolean;
	private isProduction: boolean;

	constructor() {
		this.isDevelopment = env.NODE_ENV === "development";
		this.isProduction = env.NODE_ENV === "production";
	}

	private formatMessage(
		level: LogLevel,
		message: string,
		context?: LogContext,
	): string {
		const timestamp = new Date().toISOString();
		const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
		return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
	}

	private shouldLog(level: LogLevel): boolean {
		// In production, only log warnings and errors
		if (this.isProduction && (level === "debug" || level === "info")) {
			return false;
		}
		return true;
	}

	debug(message: string, context?: LogContext): void {
		if (!this.shouldLog("debug")) return;

		if (this.isDevelopment) {
			console.debug(this.formatMessage("debug", message, context));
		}
	}

	info(message: string, context?: LogContext): void {
		if (!this.shouldLog("info")) return;

		console.log(this.formatMessage("info", message, context));
	}

	warn(message: string, context?: LogContext): void {
		if (!this.shouldLog("warn")) return;

		console.warn(this.formatMessage("warn", message, context));

		// TODO: Send to monitoring service (e.g., Sentry)
		// if (this.isProduction) {
		//   Sentry.captureMessage(message, { level: 'warning', extra: context });
		// }
	}

	error(message: string, error?: Error | unknown, context?: LogContext): void {
		if (!this.shouldLog("error")) return;

		const errorMessage = this.formatMessage("error", message, {
			...context,
			error: error instanceof Error ? error.message : String(error),
			stack:
				error instanceof Error && this.isDevelopment ? error.stack : undefined,
		});

		console.error(errorMessage);

		// TODO: Send to error tracking service (e.g., Sentry)
		// if (this.isProduction) {
		//   Sentry.captureException(error, { extra: { message, ...context } });
		// }
	}

	// Helper for API routes
	apiError(
		endpoint: string,
		error: Error | unknown,
		context?: LogContext,
	): void {
		this.error(`API Error in ${endpoint}`, error, context);
	}

	// Helper for AI operations
	aiError(operation: string, error: Error | unknown, context?: LogContext): void {
		this.error(`AI Operation Error: ${operation}`, error, {
			...context,
			operation,
		});
	}
}

// Export singleton instance
export const logger = new Logger();
