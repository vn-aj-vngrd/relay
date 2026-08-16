CREATE POLICY "Shared links read session courts"
ON public.courts FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.id = courts.session_id
    AND s.visibility IN ('public', 'link')
    AND s.status IN ('published', 'live', 'completed')
));
--> statement-breakpoint
CREATE POLICY "Shared links read session matches"
ON public.matches FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.id = matches.session_id
    AND s.visibility IN ('public', 'link')
    AND s.status IN ('published', 'live', 'completed')
));
--> statement-breakpoint
CREATE POLICY "Shared links read session queue"
ON public.session_queue FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.id = session_queue.session_id
    AND s.visibility IN ('public', 'link')
    AND s.status IN ('published', 'live', 'completed')
));
--> statement-breakpoint
CREATE POLICY "Shared links read match players"
ON public.match_players FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.matches m
  JOIN public.sessions s ON s.id = m.session_id
  WHERE m.id = match_players.match_id
    AND s.visibility IN ('public', 'link')
    AND s.status IN ('published', 'live', 'completed')
));
--> statement-breakpoint
CREATE POLICY "Shared links read session messages"
ON public.messages FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.sessions s
  WHERE s.id = messages.session_id
    AND s.visibility IN ('public', 'link')
    AND s.status IN ('published', 'live', 'completed')
));
--> statement-breakpoint
CREATE POLICY "Shared links read message reactions"
ON public.message_reactions FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.messages msg
  JOIN public.sessions s ON s.id = msg.session_id
  WHERE msg.id = message_reactions.message_id
    AND s.visibility IN ('public', 'link')
    AND s.status IN ('published', 'live', 'completed')
));
