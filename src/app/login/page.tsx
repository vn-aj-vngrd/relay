import type { Metadata } from "next";
import { AuthEntry } from "@/features/auth/auth-entry";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; next?: string }> }) {
  const query = await searchParams;
  return <AuthEntry mode="signin" error={query.error} sent={query.sent} next={query.next} />;
}
