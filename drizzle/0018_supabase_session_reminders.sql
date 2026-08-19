CREATE EXTENSION IF NOT EXISTS pg_cron;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.create_session_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inserted_count integer;
BEGIN
  WITH candidates AS (
    SELECT
      sp.user_id,
      s.id AS session_id,
      'session_tomorrow'::text AS notification_type,
      jsonb_build_object('startsAt', s.starts_at) AS payload,
      'session-tomorrow:' || s.id::text || ':' || sp.user_id::text AS dedupe_key
    FROM public.sessions s
    JOIN public.session_players sp ON sp.session_id = s.id
    WHERE s.status IN ('published', 'live')
      AND sp.rsvp = 'going'
      AND sp.user_id IS NOT NULL
      AND (s.starts_at AT TIME ZONE s.timezone)::date = (now() AT TIME ZONE s.timezone)::date + 1

    UNION ALL

    SELECT
      sp.user_id,
      s.id AS session_id,
      'session_starting_soon'::text AS notification_type,
      jsonb_build_object('startsAt', s.starts_at) AS payload,
      'session-starting-soon:' || s.id::text || ':' || sp.user_id::text AS dedupe_key
    FROM public.sessions s
    JOIN public.session_players sp ON sp.session_id = s.id
    WHERE s.status = 'published'
      AND sp.rsvp = 'going'
      AND sp.user_id IS NOT NULL
      AND s.starts_at >= now() + interval '45 minutes'
      AND s.starts_at < now() + interval '75 minutes'
  )
  INSERT INTO public.notifications (user_id, session_id, type, payload, dedupe_key)
  SELECT user_id, session_id, notification_type, payload, dedupe_key
  FROM candidates
  ON CONFLICT (dedupe_key) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_session_reminders() FROM PUBLIC;--> statement-breakpoint
DO $$
DECLARE
  existing_job bigint;
BEGIN
  SELECT jobid INTO existing_job FROM cron.job WHERE jobname = 'relay-session-reminders' LIMIT 1;
  IF existing_job IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job);
  END IF;
  PERFORM cron.schedule(
    'relay-session-reminders',
    '*/15 * * * *',
    'SELECT public.create_session_reminders()'
  );
END;
$$;
