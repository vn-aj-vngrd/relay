export type PlayersSearchParams = Record<string, string | string[] | undefined>;

/** Keep roster intent and unrelated query values when following a legacy link. */
export function playersDestination(
  base: string,
  params: PlayersSearchParams = {}
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value)
      ? value
      : value === undefined
        ? []
        : [value]) {
      query.append(key, item);
    }
  }
  query.set("panel", "players");
  return `${base}/play?${query}`;
}

export function rosterPanelUrl(href: string, open: boolean) {
  const url = new URL(href);
  if (open) url.searchParams.set("panel", "players");
  else if (url.searchParams.get("panel") === "players")
    url.searchParams.delete("panel");
  return `${url.pathname}${url.search}${url.hash}`;
}
