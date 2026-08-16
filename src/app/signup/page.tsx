import type { Metadata } from "next";
import { AuthEntry } from "@/features/auth/auth-entry";

export const metadata: Metadata = { title: "Create your Relay account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; next?: string }> }) {
  const query = await searchParams;
  return <AuthEntry mode="create" error={query.error} sent={query.sent} next={query.next} />;
}
