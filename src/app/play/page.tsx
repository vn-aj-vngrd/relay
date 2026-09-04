import type { Metadata } from "next";

import { PublicQuickPlay } from "@/features/matches/public-quick-play";

export const metadata: Metadata = {
  title: "Quick Play — Free pickleball scorekeeper",
  description:
    "Use a free pickleball scorekeeper and rotation manager in your browser. Add players, manage up to six courts, switch scoreboards, and keep score without an account.",
  alternates: { canonical: "/play" },
  openGraph: {
    title: "Free pickleball scorekeeper and rotation manager",
    description:
      "Add players, run court rotations, and keep score from one phone—no account required.",
    url: "/play",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Relay pickleball scorekeeper",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free pickleball scorekeeper and rotation manager",
    description:
      "Add players, manage courts and rotations, and keep score from one phone.",
    images: ["/opengraph-image"],
  },
};

export default function QuickPlayPage() {
  return <PublicQuickPlay />;
}
