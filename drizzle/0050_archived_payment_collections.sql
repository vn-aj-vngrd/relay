ALTER TABLE "expenses" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "archived_by_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_archived_by_id_users_id_fk" FOREIGN KEY ("archived_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

-- Serialize every payment writer with switching and keep archived history immutable.
CREATE FUNCTION public.guard_archived_payment_collection() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE target_session uuid;
BEGIN
  IF TG_TABLE_NAME = 'player_payments' THEN
    SELECT session_id INTO target_session FROM public.expenses WHERE id = NEW.expense_id;
    PERFORM id FROM public.sessions WHERE id = target_session FOR UPDATE;
    IF EXISTS (SELECT 1 FROM public.expenses WHERE id = NEW.expense_id AND archived_at IS NOT NULL) THEN
      RAISE EXCEPTION 'This collection is closed. Reload Payments to view its history.';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF OLD.expense_id <> NEW.expense_id THEN
        RAISE EXCEPTION 'Payment records cannot move between collections.';
      END IF;
    END IF;
  ELSE
    PERFORM id FROM public.sessions WHERE id = OLD.session_id FOR UPDATE;
    IF OLD.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'Archived collections are read-only. Start a new collection instead.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER guard_archived_player_payment BEFORE INSERT OR UPDATE ON public.player_payments
FOR EACH ROW EXECUTE FUNCTION public.guard_archived_payment_collection();--> statement-breakpoint
CREATE TRIGGER guard_archived_expense BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.guard_archived_payment_collection();