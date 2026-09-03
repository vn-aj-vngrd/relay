CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"destination_key" text NOT NULL,
	"push_subscription_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_delivery_destination_unique" UNIQUE("notification_id","channel","destination_key")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"email_categories" jsonb NOT NULL,
	"push_categories" jsonb NOT NULL,
	"day_before_reminder" boolean DEFAULT true NOT NULL,
	"hour_before_reminder" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" time,
	"quiet_hours_end" time,
	"time_zone" text DEFAULT 'Asia/Manila' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"device_label" text,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_push_subscription_id_push_subscriptions_id_fk" FOREIGN KEY ("push_subscription_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_delivery_pending_idx" ON "notification_deliveries" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_delivery_channel_valid" CHECK ("channel" IN ('email', 'push'));--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_delivery_status_valid" CHECK ("status" IN ('pending', 'sending', 'sent', 'failed', 'suppressed'));--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_delivery_attempts_valid" CHECK ("attempts" BETWEEN 0 AND 10);--> statement-breakpoint
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "notification_preferences" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "push_subscriptions" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "notification_deliveries" FROM anon, authenticated;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.queue_notification_deliveries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_deliveries (notification_id, channel, destination_key)
  VALUES (NEW.id, 'email', 'account-email')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notification_deliveries (notification_id, channel, destination_key, push_subscription_id)
  SELECT NEW.id, 'push', subscription.id::text, subscription.id
  FROM public.push_subscriptions subscription
  WHERE subscription.user_id = NEW.user_id
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.queue_notification_deliveries() FROM PUBLIC;--> statement-breakpoint
DROP TRIGGER IF EXISTS queue_notification_deliveries ON public.notifications;--> statement-breakpoint
CREATE TRIGGER queue_notification_deliveries
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.queue_notification_deliveries();