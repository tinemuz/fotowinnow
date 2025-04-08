ALTER TABLE "fotowinnow_album" ALTER COLUMN "photographer_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "fotowinnow_photographer" ADD COLUMN "clerk_id" varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE "fotowinnow_photographer" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "fotowinnow_photographer" ADD COLUMN "tier" varchar(50) DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "fotowinnow_photographer" ADD COLUMN "metadata" json;--> statement-breakpoint
ALTER TABLE "fotowinnow_photographer" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "fotowinnow_album" ADD CONSTRAINT "fotowinnow_album_photographer_id_fotowinnow_photographer_id_fk" FOREIGN KEY ("photographer_id") REFERENCES "public"."fotowinnow_photographer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photographer_clerk_id_idx" ON "fotowinnow_photographer" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "photographer_email_idx" ON "fotowinnow_photographer" USING btree ("email");--> statement-breakpoint
ALTER TABLE "fotowinnow_photographer" ADD CONSTRAINT "fotowinnow_photographer_clerk_id_unique" UNIQUE("clerk_id");