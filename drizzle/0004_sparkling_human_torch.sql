CREATE TABLE IF NOT EXISTS "generated_cvs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"owner_id" uuid NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_cvs" ADD CONSTRAINT "generated_cvs_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
