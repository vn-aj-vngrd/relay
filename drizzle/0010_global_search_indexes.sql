CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sessions_title_search_idx ON sessions USING gin (title extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sessions_venue_name_search_idx ON sessions USING gin (venue_name extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS sessions_venue_address_search_idx ON sessions USING gin (venue_address extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS profiles_name_search_idx ON profiles USING gin (name extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS profiles_username_search_idx ON profiles USING gin (username extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS profiles_city_search_idx ON profiles USING gin (city extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS groups_name_search_idx ON groups USING gin (name extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS groups_description_search_idx ON groups USING gin (description extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS venues_name_search_idx ON venues USING gin (name extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS venues_address_search_idx ON venues USING gin (address extensions.gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS group_members_user_search_idx ON group_members (user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS session_players_user_search_idx ON session_players (user_id);
