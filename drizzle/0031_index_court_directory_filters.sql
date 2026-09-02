CREATE INDEX "venues_listing_environment_idx" ON "venues" USING btree ("listing_status","environment");--> statement-breakpoint
CREATE INDEX "venues_listing_parking_idx" ON "venues" USING btree ("listing_status","parking_status");--> statement-breakpoint
CREATE INDEX "venues_listing_price_idx" ON "venues" USING btree ("listing_status","price_status","price_amount_cents");