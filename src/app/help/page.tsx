import type { Metadata } from "next";

import { HelpCenterContent } from "@/features/help/help-center-content";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Learn to join, host, play, coordinate repayment, and share a Relay game. Public step-by-step help for guests and account players.",
  alternates: { canonical: "/help" },
};

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
  }>;
}) {
  const params = await searchParams;
  return (
    <HelpCenterContent
      query={typeof params.q === "string" ? params.q : ""}
      category={
        typeof params.category === "string" ? params.category : undefined
      }
    />
  );
}
