CREATE INDEX "group_members_user_joined_idx" ON "group_members" USING btree ("user_id","joined_at","group_id");--> statement-breakpoint
CREATE INDEX "messages_session_created_id_idx" ON "messages" USING btree ("session_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_user_created_id_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sessions_group_starts_id_idx" ON "sessions" USING btree ("group_id","starts_at" DESC NULLS LAST,"id" DESC NULLS LAST);