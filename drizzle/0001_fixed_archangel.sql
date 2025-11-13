CREATE TABLE IF NOT EXISTS "linkedin_cached_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"profile_url" text NOT NULL,
	"profile_data" jsonb NOT NULL,
	"owner" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "linkedin_cached_profiles" ADD CONSTRAINT "linkedin_cached_profiles_owner_profiles_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
