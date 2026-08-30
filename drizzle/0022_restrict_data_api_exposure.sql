-- Relay serves application data through its authenticated server data layer. The browser
-- uses Supabase directly only for Auth, Storage signed URLs, Realtime Broadcast, and the
-- user's notification stream. Remove broad PostgREST reads that made link-only games,
-- chat, and full profile records enumerable with the public publishable key.

DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
--> statement-breakpoint
DROP POLICY IF EXISTS "Users update their own profile" ON public.profiles;
--> statement-breakpoint
DROP POLICY IF EXISTS "Published public and link sessions are readable" ON public.sessions;
--> statement-breakpoint
DROP POLICY IF EXISTS "Published venues are readable" ON public.venues;
--> statement-breakpoint
DROP POLICY IF EXISTS "Public venue photos are readable" ON public.venue_photos;
--> statement-breakpoint
DROP POLICY IF EXISTS "Shared links read session courts" ON public.courts;
--> statement-breakpoint
DROP POLICY IF EXISTS "Shared links read session matches" ON public.matches;
--> statement-breakpoint
DROP POLICY IF EXISTS "Shared links read session queue" ON public.session_queue;
--> statement-breakpoint
DROP POLICY IF EXISTS "Shared links read match players" ON public.match_players;
--> statement-breakpoint
DROP POLICY IF EXISTS "Shared links read session messages" ON public.messages;
--> statement-breakpoint
DROP POLICY IF EXISTS "Shared links read message reactions" ON public.message_reactions;
--> statement-breakpoint

REVOKE ALL ON TABLE
  public.profiles,
  public.venues,
  public.venue_photos,
  public.sessions,
  public.courts,
  public.matches,
  public.match_players,
  public.match_scores,
  public.session_queue,
  public.messages,
  public.message_reactions
FROM anon;
--> statement-breakpoint

-- Authenticated session collaboration uses server queries plus Broadcast invalidations,
-- not PostgREST. Keeping these grants closed prevents bulk extraction with a stolen user
-- session while notification-specific policies and grants remain unchanged.
REVOKE ALL ON TABLE
  public.profiles,
  public.venues,
  public.venue_photos,
  public.sessions,
  public.courts,
  public.matches,
  public.match_players,
  public.match_scores,
  public.session_queue,
  public.messages,
  public.message_reactions
FROM authenticated;
--> statement-breakpoint
