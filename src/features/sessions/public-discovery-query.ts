import { and, eq, gt, inArray, isNotNull } from "drizzle-orm";
import { sessions } from "@/db/schema";
import { publicDiscoveryStatuses } from "./public-discovery";

/** SQL adapter for publicDiscoveryReasons; viewer filters are added separately. */
export function publicDiscoveryCondition(now: Date) {
  return and(
    eq(sessions.visibility, "public"),
    inArray(sessions.status, [...publicDiscoveryStatuses]),
    gt(sessions.endsAt, now),
    isNotNull(sessions.playerPriceCents)
  );
}
