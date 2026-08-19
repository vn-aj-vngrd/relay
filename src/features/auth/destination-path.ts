export function safeNextPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/home";
}

export function sharedSessionSlug(path: string) {
  const match = /^\/s\/([a-z0-9-]+)\/?$/.exec(path);
  return match?.[1] ?? null;
}
