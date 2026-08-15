export function sessionSlug(title: string) {
  const words = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48) || "game";
  return `${words}-${crypto.randomUUID().replaceAll("-", "").slice(0, 6)}`;
}
