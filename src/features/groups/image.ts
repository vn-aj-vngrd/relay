export function groupImageUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!origin) return undefined;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${origin}/storage/v1/object/public/avatars/${encodedPath}`;
}
