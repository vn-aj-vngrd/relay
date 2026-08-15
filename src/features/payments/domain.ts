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
