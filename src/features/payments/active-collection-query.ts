import { sql } from "drizzle-orm";
import { expenses, playerPayments } from "@/db/schema";

// Used under the session lock so stale proof/review/adjustment requests cannot revive history.
export const activePaymentCondition = sql`exists (
  select 1 from ${expenses}
  where ${expenses.id} = ${playerPayments.expenseId}
  and ${expenses.archivedAt} is null
)`;
