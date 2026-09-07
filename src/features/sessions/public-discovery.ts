export const publicDiscoveryStatuses = ["published", "live"] as const;

export type PublicDiscoveryInput = {
  visibility: string;
  status: string;
  endsAt: Date;
  playerPriceCents: number | null;
};

/** Discovery is independent of member authorization and shared-link access. */
export function publicDiscoveryReasons(
  session: PublicDiscoveryInput,
  now: Date
) {
  const reasons: Array<
    | "private"
    | "link"
    | "draft"
    | "completed"
    | "cancelled"
    | "unpublished"
    | "expired"
    | "price"
  > = [];
  if (session.visibility !== "public") {
    reasons.push(session.visibility === "private" ? "private" : "link");
  }
  if (!publicDiscoveryStatuses.some((status) => status === session.status)) {
    reasons.push(
      session.status === "draft" ||
        session.status === "completed" ||
        session.status === "cancelled"
        ? session.status
        : "unpublished"
    );
  }
  if (session.endsAt <= now) reasons.push("expired");
  if (session.playerPriceCents === null) reasons.push("price");
  return reasons;
}

export function isPubliclyDiscoverable(
  session: PublicDiscoveryInput,
  now: Date
) {
  return publicDiscoveryReasons(session, now).length === 0;
}
