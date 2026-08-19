# 0018 Supabase session reminders

This migration moves reminder scheduling to Supabase Cron, which can run frequently enough on the free project to support both next-day and starting-soon in-app notifications.

## Schedule

`relay-session-reminders` runs every 15 minutes and calls `public.create_session_reminders()` with zero network hop.

The function creates:

- one `session_tomorrow` notification per authenticated going player when the session is on the next date in its stored timezone;
- one `session_starting_soon` notification per authenticated going player roughly 45–75 minutes before play.

`notifications.dedupe_key` makes every candidate idempotent across retries and overlapping cron windows.

## Authorization

The function is `SECURITY DEFINER`, uses an empty search path, fully qualifies application tables, and revokes execution from `PUBLIC`. The job runs as its database owner. Clients cannot invoke the reminder function through the Data API.

## Guest behavior

Guests do not have a persistent cross-session notification inbox, so scheduled reminders are account-only. The public game link remains their source of current information.

## Operations

Inspect the job and run history in Supabase Dashboard → Integrations → Cron. Reapplying the migration removes any existing job with the same name before scheduling one replacement.

To stop reminders without changing data:

```sql
select cron.unschedule(jobid) from cron.job where jobname = 'relay-session-reminders';
```
