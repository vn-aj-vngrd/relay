CREATE POLICY "Players read own session membership"
ON public.session_players FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));
--> statement-breakpoint
ALTER TABLE public.courts REPLICA IDENTITY FULL;
--> statement-breakpoint
ALTER TABLE public.matches REPLICA IDENTITY FULL;
--> statement-breakpoint
ALTER TABLE public.session_queue REPLICA IDENTITY FULL;
--> statement-breakpoint
ALTER TABLE public.messages REPLICA IDENTITY FULL;
