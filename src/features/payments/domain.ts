const paymentProofTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validatePaymentProof(file: { type: string; size: number }) {
  if (!paymentProofTypes.has(file.type)) return "Upload one JPG, PNG, or WebP image.";
  if (file.size > 5 * 1024 * 1024) return "Keep payment proof under 5 MB.";
  return null;
}

export function collectFromPlayers(players: Array<{ id: string; userId: string | null }>, hostId: string): string[] {
  return players.filter((player) => player.userId !== hostId).map((player) => player.id);
}

export function splitExpense(totalCents: number, playerIds: string[], overrides: Record<string, number> = {}): Record<string, number> {
  if (!Number.isInteger(totalCents) || totalCents < 0) throw new Error("Total must be a nonnegative integer");
  const uniquePlayers = [...new Set(playerIds)];
  if (uniquePlayers.length === 0) return {};
  const fixedTotal = uniquePlayers.reduce((sum, id) => sum + (overrides[id] ?? 0), 0);
  if (fixedTotal > totalCents) throw new Error("Overrides exceed the total");
  const flexible = uniquePlayers.filter((id) => overrides[id] === undefined);
  if (flexible.length === 0 && fixedTotal !== totalCents) throw new Error("Overrides must add up to the total");
  const remaining = totalCents - fixedTotal;
  const base = flexible.length > 0 ? Math.floor(remaining / flexible.length) : 0;
  let remainder = flexible.length > 0 ? remaining % flexible.length : 0;
  return Object.fromEntries(uniquePlayers.map((id) => [id, overrides[id] ?? base + (remainder-- > 0 ? 1 : 0)]));
}
