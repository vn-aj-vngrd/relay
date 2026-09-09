import "server-only";

import { and, desc, eq, lt, or } from "drizzle-orm";

import { db } from "@/db/client";
import { billingRequests, users } from "@/db/schema";
import { type AdminCursor, encodeAdminCursor } from "@/features/admin/cursor";
import {
  ADMIN_PAGE_SIZE,
  type AdminBillingRecord,
  type AdminPage,
} from "@/features/admin/records";

// Called only after admin/AAL2 authorization; proof paths and account details never enter list payloads.
export async function getAdminBillingRequests(
  cursor?: AdminCursor | null
): Promise<AdminPage<AdminBillingRecord>> {
  const rows = await db
    .select({
      id: billingRequests.id,
      email: users.email,
      status: billingRequests.status,
      amountCents: billingRequests.amountCents,
      createdAt: billingRequests.createdAt,
    })
    .from(billingRequests)
    .innerJoin(users, eq(users.id, billingRequests.userId))
    .where(
      cursor
        ? or(
            lt(billingRequests.createdAt, cursor.at),
            and(
              eq(billingRequests.createdAt, cursor.at),
              lt(billingRequests.id, cursor.id)
            )
          )
        : undefined
    )
    .orderBy(desc(billingRequests.createdAt), desc(billingRequests.id))
    .limit(ADMIN_PAGE_SIZE + 1);
  const items = rows.slice(0, ADMIN_PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > ADMIN_PAGE_SIZE && last
        ? encodeAdminCursor({ at: last.createdAt, id: last.id })
        : null,
  };
}
