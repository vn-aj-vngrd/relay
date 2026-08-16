ALTER TYPE "public"."rsvp_status" ADD VALUE 'pending' BEFORE 'going';--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
