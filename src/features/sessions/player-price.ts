export type PlayerPriceInput = {
  playerPriceCents: number | null;
  hasExpense?: boolean;
  priceIsFixed?: boolean;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Public summary only; never a viewer's balance or payment instructions. */
export function playerPriceDisclosure({
  playerPriceCents,
  hasExpense,
  priceIsFixed,
}: PlayerPriceInput) {
  if (playerPriceCents === null) {
    return hasExpense
      ? {
          kind: "pendingCollection" as const,
          label: "Player share pending",
          context:
            "Collection set up; a player share is not available yet. Shares are calculated for paying players when they join.",
        }
      : {
          kind: "unset" as const,
          label: "Price not set",
          context: "The host has not stated a player price yet.",
        };
  }
  if (playerPriceCents === 0)
    return { kind: "free" as const, label: "Free", context: null };
  return {
    kind: "amount" as const,
    label: `${currency.format(playerPriceCents / 100)} per player`,
    context: priceIsFixed
      ? "Fixed contribution per player. Individual agreed adjustments may differ."
      : hasExpense
        ? "Current split share; it may change with the roster. Individual amounts may differ."
        : null,
  };
}

export function playerPriceText(input: PlayerPriceInput) {
  const price = playerPriceDisclosure(input);
  return price.kind === "amount" && input.hasExpense && !input.priceIsFixed
    ? `${price.label} · Current player share`
    : price.label;
}
