import { PublicSessionHeader } from "@/components/shared/public-session-header";
import { getCurrentUser } from "@/features/auth/session";

export default async function PublicSessionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const [slug, user] = await Promise.all([params.then((value) => value.slug), getCurrentUser()]);
  return <><PublicSessionHeader slug={slug} signedIn={Boolean(user)} />{children}</>;
}
