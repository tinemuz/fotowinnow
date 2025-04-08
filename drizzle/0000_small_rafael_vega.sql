CREATE TABLE "fotowinnow_album" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_image" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"photographer_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fotowinnow_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer NOT NULL,
	"text" text NOT NULL,
	"author" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fotowinnow_image" (
	"id" serial PRIMARY KEY NOT NULL,
	"album_id" integer NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fotowinnow_photographer" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fotowinnow_comment" ADD CONSTRAINT "fotowinnow_comment_image_id_fotowinnow_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."fotowinnow_image"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fotowinnow_image" ADD CONSTRAINT "fotowinnow_image_album_id_fotowinnow_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."fotowinnow_album"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_title_idx" ON "fotowinnow_album" USING btree ("title");--> statement-breakpoint
CREATE INDEX "album_photographer_idx" ON "fotowinnow_album" USING btree ("photographer_id");--> statement-breakpoint
CREATE INDEX "comment_image_idx" ON "fotowinnow_comment" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_album_idx" ON "fotowinnow_image" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "photographer_name_idx" ON "fotowinnow_photographer" USING btree ("name");