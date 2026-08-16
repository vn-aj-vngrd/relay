ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_message_id_user_id_reaction_pk";--> statement-breakpoint
ALTER TABLE "message_reactions" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD COLUMN "session_player_id" uuid;--> statement-breakpoint
ALTER TABLE "message_reactions" REPLICA IDENTITY FULL;--> statement-breakpoint
UPDATE "message_reactions" mr
SET "session_player_id" = sp.id
FROM "messages" msg, "session_players" sp
WHERE msg.id = mr.message_id
  AND sp.session_id = msg.session_id
  AND sp.user_id = mr.user_id;--> statement-breakpoint
DELETE FROM "message_reactions" WHERE "session_player_id" IS NULL;--> statement-breakpoint
ALTER TABLE "message_reactions" ALTER COLUMN "session_player_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_session_player_id_session_players_id_fk" FOREIGN KEY ("session_player_id") REFERENCES "public"."session_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_player_reaction_unique" UNIQUE("message_id","session_player_id","reaction");
