const paymentProofTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validatePaymentProof(file: { type: string; size: number }) {
  if (!paymentProofTypes.has(file.type))
    return "Upload one JPG, PNG, or WebP image.";
  if (file.size > 5 * 1024 * 1024) return "Keep payment proof under 5 MB.";
  return null;
}

export function collectFromPlayers(
  players: Array<{ id: string; userId: string | null }>,
  hostId: string
): string[] {
  return players
    .filter((player) => player.userId !== hostId)
    .map((player) => player.id);
}

export function disclosedPlayerTotal(
  payments: Array<{ sessionPlayerId: string; amountCents: number }>
): number | null {
  const totals = new Map<string, number>();
  for (const payment of payments)
    totals.set(
      payment.sessionPlayerId,
      (totals.get(payment.sessionPlayerId) ?? 0) + payment.amountCents
    );
  const amounts = [...totals.values()].filter((amount) => amount > 0);
  return amounts.length ? Math.max(...amounts) : null;
}

export function resolvedPlayerPrice(
  payments: Array<{ sessionPlayerId: string; amountCents: number }>,
  currentPriceCents: number | null
): number | null {
  return disclosedPlayerTotal(payments) ?? (currentPriceCents === 0 ? 0 : null);
}

export type Contribution = {
  contributionMode?: "split" | "fixed";
  fixedRateCents?: number | null;
  totalCents: number;
};

function fixedContributionRate(collection: Contribution) {
  if (
    !Number.isInteger(collection.fixedRateCents) ||
    (collection.fixedRateCents ?? 0) <= 0
  )
    throw new Error("A fixed contribution needs a positive rate");
  return collection.fixedRateCents!;
}

export function collectionShares(
  collection: Contribution,
  playerIds: string[]
) {
  if (collection.contributionMode === "fixed") {
    const rate = fixedContributionRate(collection);
    return Object.fromEntries([...new Set(playerIds)].map((id) => [id, rate]));
  }
  return splitExpense(collection.totalCents, playerIds);
}

export function collectionPlayerPrice(
  collections: Contribution[],
  payments: Array<{ sessionPlayerId: string; amountCents: number }>
) {
  if (
    collections.length &&
    collections.every((collection) => collection.contributionMode === "fixed")
  )
    return collections.reduce(
      (sum, collection) => sum + fixedContributionRate(collection),
      0
    );
  return disclosedPlayerTotal(payments);
}

export function hasPaymentHistory(payment: {
  status: string;
  proofStoragePath?: string | null;
  reviewNote?: string | null;
}) {
  return (
    payment.status === "sent" ||
    payment.status === "confirmed" ||
    Boolean(payment.proofStoragePath || payment.reviewNote)
  );
}

export function splitExpense(
  totalCents: number,
  playerIds: string[],
  overrides: Record<string, number> = {}
): Record<string, number> {
  if (!Number.isInteger(totalCents) || totalCents < 0)
    throw new Error("Total must be a nonnegative integer");
  const uniquePlayers = [...new Set(playerIds)];
  if (uniquePlayers.length === 0) return {};
  const fixedTotal = uniquePlayers.reduce(
    (sum, id) => sum + (overrides[id] ?? 0),
    0
  );
  if (fixedTotal > totalCents) throw new Error("Overrides exceed the total");
  const flexible = uniquePlayers.filter((id) => overrides[id] === undefined);
  if (flexible.length === 0 && fixedTotal !== totalCents)
    throw new Error("Overrides must add up to the total");
  const remaining = totalCents - fixedTotal;
  const base =
    flexible.length > 0 ? Math.floor(remaining / flexible.length) : 0;
  let remainder = flexible.length > 0 ? remaining % flexible.length : 0;
  return Object.fromEntries(
    uniquePlayers.map((id) => [
      id,
      overrides[id] ?? base + (remainder-- > 0 ? 1 : 0),
    ])
  );
}
