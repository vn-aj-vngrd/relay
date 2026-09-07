import { sql } from "drizzle-orm";
import { expenses, sessions } from "@/db/schema";

// One boolean per selected session, in the existing batched query. No financial data.
export const sessionHasExpense = sql<boolean>`exists (
  select 1 from ${expenses} where ${expenses.sessionId} = ${sessions.id}
)`;

export const sessionPriceIsFixed = sql<boolean>`exists (
  select 1 from ${expenses} where ${expenses.sessionId} = ${sessions.id}
) and not exists (
  select 1 from ${expenses} where ${expenses.sessionId} = ${sessions.id} and ${expenses.contributionMode} <> 'fixed'
)`;
