CREATE POLICY "Participants read session courts"
ON public.courts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.session_players sp WHERE sp.session_id = courts.session_id AND sp.user_id = (SELECT auth.uid()) AND sp.rsvp IN ('going', 'maybe', 'waitlisted')));
--> statement-breakpoint
CREATE POLICY "Participants read session matches"
ON public.matches FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.session_players sp WHERE sp.session_id = matches.session_id AND sp.user_id = (SELECT auth.uid()) AND sp.rsvp IN ('going', 'maybe', 'waitlisted')));
--> statement-breakpoint
CREATE POLICY "Participants read match players"
ON public.match_players FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.session_players sp ON sp.session_id = m.session_id WHERE m.id = match_players.match_id AND sp.user_id = (SELECT auth.uid()) AND sp.rsvp IN ('going', 'maybe', 'waitlisted')));
--> statement-breakpoint
CREATE POLICY "Participants read score events"
ON public.match_scores FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.matches m JOIN public.session_players sp ON sp.session_id = m.session_id WHERE m.id = match_scores.match_id AND sp.user_id = (SELECT auth.uid()) AND sp.rsvp IN ('going', 'maybe', 'waitlisted')));
--> statement-breakpoint
CREATE POLICY "Participants read session queue"
ON public.session_queue FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.session_players sp WHERE sp.session_id = session_queue.session_id AND sp.user_id = (SELECT auth.uid()) AND sp.rsvp IN ('going', 'maybe', 'waitlisted')));
--> statement-breakpoint
CREATE POLICY "Participants read session messages"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.session_players sp WHERE sp.session_id = messages.session_id AND sp.user_id = (SELECT auth.uid()) AND sp.rsvp IN ('going', 'maybe', 'waitlisted')));
--> statement-breakpoint
CREATE POLICY "Participants read message reactions"
ON public.message_reactions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages msg JOIN public.session_players sp ON sp.session_id = msg.session_id WHERE msg.id = message_reactions.message_id AND sp.user_id = (SELECT auth.uid()) AND sp.rsvp IN ('going', 'maybe', 'waitlisted')));
