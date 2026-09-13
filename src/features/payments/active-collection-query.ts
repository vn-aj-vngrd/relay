import { sql } from "drizzle-orm";
import { expenses, playerPayments } from "@/db/schema";

// Used under the session lock so stale proof/review/adjustment requests cannot revive history.
// Qualify inner columns with a SQL alias: relational reads rewrite Column objects
// to the outer payment alias, including columns nested inside this subquery.
export const activePaymentCondition = sql`exists (
  select 1 from ${expenses} as active_expense
  where active_expense.id = ${playerPayments.expenseId}
  and active_expense.archived_at is null
)`;
