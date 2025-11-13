"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function useTheme() {
	const [theme, setTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		// Check if user has a theme preference in localStorage
		const storedTheme = localStorage.getItem("theme") as
			| "light"
			| "dark"
			| null;
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;

		const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
		setTheme(initialTheme);

		// Apply the theme to the document
		applyTheme(initialTheme);
	}, []);

	const applyTheme = (newTheme: "light" | "dark") => {
		const root = document.documentElement;
		if (newTheme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	};

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);
		applyTheme(newTheme);
	};

	return { theme, toggleTheme };
}

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="flex items-center justify-center"
			aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
		>
			{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
		</button>
	);
}
