import { drizzle } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { activePaymentCondition } from "./active-collection-query";

const db = drizzle.mock({ schema });
describe("active payment collection queries", () => {
  it("keeps expense columns in the subquery when Drizzle aliases a relational payment read", () => {
    const { sql } = db.query.playerPayments
      .findFirst({ where: activePaymentCondition })
      .toSQL();
    expect(sql).not.toContain('"playerPayments"."archived_at"');
    expect(sql).toContain('active_expense.id = "playerPayments"."expense_id"');
    expect(sql).toContain("active_expense.archived_at is null");
  });
  it("also correlates correctly in a payment update", () => {
    const { sql } = db
      .update(schema.playerPayments)
      .set({ status: "sent" })
      .where(activePaymentCondition)
      .toSQL();
    expect(sql).toContain('active_expense.id = "player_payments"."expense_id"');
    expect(sql).toContain("active_expense.archived_at is null");
  });
});
