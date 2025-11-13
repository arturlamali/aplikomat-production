"use client";

import { type ReactNode } from "react";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { SuspendedPostHogPageView } from "./PostHogPageView";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "https://www.aplikomat.pl/ingest-internal-service",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug(); // debug mode in development
    },
  });
}

export function CSPostHogProvider({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PostHogProvider>
  );
}
