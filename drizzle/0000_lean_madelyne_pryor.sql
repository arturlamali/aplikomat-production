CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"phone_number" text,
	"contact_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
