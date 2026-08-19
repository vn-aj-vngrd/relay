ALTER TYPE "public"."rotation_mode" ADD VALUE 'balanced';--> statement-breakpoint
ALTER TABLE "session_players" ADD COLUMN "skill_level" text;--> statement-breakpoint
UPDATE "session_players" sp
SET "skill_level" = p."skill_level"
FROM "profiles" p
WHERE sp."user_id" = p."user_id" AND p."skill_level" IS NOT NULL;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.relay_broadcast_session_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_session_id uuid;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'sessions' THEN affected_session_id := COALESCE(NEW.id, OLD.id);
    WHEN 'session_players', 'courts', 'expenses', 'matches', 'session_queue', 'messages', 'session_pairs', 'memories'
      THEN affected_session_id := COALESCE(NEW.session_id, OLD.session_id);
    WHEN 'player_payments' THEN
      SELECT e.session_id INTO affected_session_id FROM public.expenses e
      WHERE e.id = COALESCE(NEW.expense_id, OLD.expense_id);
    WHEN 'match_players', 'match_scores' THEN
      SELECT m.session_id INTO affected_session_id FROM public.matches m
      WHERE m.id = COALESCE(NEW.match_id, OLD.match_id);
    WHEN 'session_pair_members' THEN
      SELECT p.session_id INTO affected_session_id FROM public.session_pairs p
      WHERE p.id = COALESCE(NEW.pair_id, OLD.pair_id);
    WHEN 'message_reactions' THEN
      SELECT m.session_id INTO affected_session_id FROM public.messages m
      WHERE m.id = COALESCE(NEW.message_id, OLD.message_id);
    WHEN 'memory_media', 'comments', 'reactions' THEN
      SELECT m.session_id INTO affected_session_id FROM public.memories m
      WHERE m.id = COALESCE(NEW.memory_id, OLD.memory_id);
  END CASE;

  IF affected_session_id IS NOT NULL THEN
    PERFORM realtime.send(
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP),
      'changed',
      'session:' || affected_session_id::text,
      false
    );
  END IF;
  RETURN NULL;
END;
$$;--> statement-breakpoint
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'sessions', 'session_players', 'courts', 'expenses', 'player_payments',
    'matches', 'match_players', 'match_scores', 'session_queue', 'session_pairs',
    'session_pair_members', 'messages', 'message_reactions', 'memories',
    'memory_media', 'comments', 'reactions'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS relay_session_broadcast ON public.%I', table_name);
    EXECUTE format(
      'CREATE TRIGGER relay_session_broadcast AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.relay_broadcast_session_change()',
      table_name
    );
  END LOOP;
END;
$$;