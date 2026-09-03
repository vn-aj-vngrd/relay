# Notification delivery preferences

Adds account-level email and push preferences, private browser push subscriptions, and an idempotent delivery outbox.

All three tables have RLS enabled with no Data API policies. Relay reads and mutates them only through authenticated server routes and actions using the server database connection. Push endpoints and encryption keys are therefore never readable through Supabase’s browser client.

A security-definer trigger queues one email delivery and one delivery per currently registered push subscription whenever an in-app notification is created. The application dispatcher checks the user’s latest preferences, current session state, quiet hours, and channel policy immediately before sending. In-app notification creation never waits for an external provider.

Apply this migration before enabling `NOTIFICATION_DELIVERY_ENABLED`. Configure a scheduled POST to `/api/notifications/dispatch` with the bearer dispatch secret only after Resend and/or VAPID credentials are present.
