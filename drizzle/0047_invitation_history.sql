ALTER TABLE "session_players" ADD COLUMN "invitation_received_at" timestamp with time zone;
--> statement-breakpoint
UPDATE public.session_players AS player
SET invitation_received_at = history.received_at
FROM (
  SELECT session_id, user_id, max(created_at) AS received_at
  FROM public.notifications
  WHERE type = 'session_invite'
  GROUP BY session_id, user_id
) AS history
WHERE player.session_id = history.session_id
  AND player.user_id = history.user_id;
--> statement-breakpoint
UPDATE public.session_players
SET invitation_received_at = invited_at
WHERE invitation_received_at IS NULL AND user_id IS NOT NULL
  AND rsvp = 'invited' AND role = 'player';
