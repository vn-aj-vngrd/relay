ALTER TABLE "admin_audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venue_operating_periods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "admin_audit_logs" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "venue_operating_periods" FROM PUBLIC, anon, authenticated;
