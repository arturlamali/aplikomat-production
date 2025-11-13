ALTER TABLE "linkedin_cached_profiles" RENAME COLUMN "id" TO "owner_id";--> statement-breakpoint
ALTER TABLE "linkedin_cached_profiles" DROP CONSTRAINT "linkedin_cached_profiles_owner_profiles_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "linkedin_cached_profiles" ADD CONSTRAINT "linkedin_cached_profiles_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "linkedin_cached_profiles" DROP COLUMN IF EXISTS "owner";