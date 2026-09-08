import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions } from "@/db/schema";
import { sessionHasExpense, sessionPriceIsFixed } from "./player-price-query";

/** Public pricing facts only. The caller must authorize access to the session. */
export async function getSessionPlayerPrice(sessionId: string) {
  const [price] = await db
    .select({
      playerPriceCents: sessions.playerPriceCents,
      hasExpense: sessionHasExpense,
      priceIsFixed: sessionPriceIsFixed,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return price ?? null;
}
