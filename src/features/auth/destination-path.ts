export function safeNextPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/home";
}

export function onboardingDestination(path: string, onboardingComplete: boolean) {
  if (onboardingComplete) return path;
  const destination = path === "/home" ? "/games/new" : path;
  return `/onboarding?next=${encodeURIComponent(destination)}`;
}

export function postSetupDestination(next: unknown) {
  const destination = safeNextPath(next);
  const params = new URLSearchParams({ tour: "1" });
  if (destination.startsWith("/games/new")) params.set("next", destination);
  return `/home?${params}`;
}

export function sharedSessionSlug(path: string) {
  const match = /^\/s\/([a-z0-9-]+)\/?$/.exec(path);
  return match?.[1] ?? null;
}
