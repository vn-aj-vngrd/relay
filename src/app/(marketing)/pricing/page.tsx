import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { Brand } from "@/components/shared/brand";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { getBillingOffer } from "@/features/billing/catalog";
import {
  PlanCards,
  PlanComparison,
  PricingQuestions,
} from "@/features/billing/plan-comparison";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare Relay Free, Plus and Pro: monthly hosted games, total photo storage, included features and manual monthly billing.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Relay pricing",
    description:
      "Hosting plans for your next pickleball game. Compare monthly games and total photo storage.",
    url: "/pricing",
    type: "website",
  },
};

export default async function PricingPage() {
  await connection();
  const [offer, user] = await Promise.all([
    getBillingOffer(),
    getCurrentUser(),
  ]);
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="safe-top border-b border-line bg-surface">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Brand />
          <nav
            aria-label="Pricing navigation"
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm"
          >
            {user ? (
              <>
                <Link
                  href="/settings/plan"
                  className="pressable inline-flex min-h-11 items-center rounded-lg px-3 font-medium text-muted hover:text-ink"
                >
                  Plan & billing
                </Link>
                <ButtonLink href="/home" className="min-h-11">
                  Open app
                </ButtonLink>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="pressable inline-flex min-h-11 items-center rounded-lg px-3 font-medium text-muted hover:text-ink"
                >
                  Log in
                </Link>
                <ButtonLink href="/signup" className="min-h-11">
                  Sign up
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 sm:py-16"
      >
        <section aria-labelledby="pricing-title">
          <h1
            id="pricing-title"
            className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Start free. Host more when you need to.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            One personal plan for the host. Your players can join, RSVP and play
            without a paid subscription.
          </p>
          <div className="mt-8">
            <PlanCards {...offer} />
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">
            Free games reset on the 1st of each month in Philippine time. Paid
            plans include the stated games for each one-calendar-month term.
            Photo storage does not reset monthly. Coming soon plans cannot be
            purchased yet.
          </p>
        </section>
        <PlanComparison catalog={offer.catalog} />
        <PricingQuestions />
        <section
          className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8"
          aria-labelledby="pricing-start-title"
        >
          <div>
            <h2 id="pricing-start-title" className="text-xl font-semibold">
              Your next game can start with Free.
            </h2>
            <p className="mt-2 text-sm text-muted">
              Create the plan, share the link, and bring your players together.
            </p>
          </div>
          <ButtonLink href="/games/new">Create game</ButtonLink>
        </section>
      </main>
      <footer className="border-t border-line px-4 py-8">
        <nav
          aria-label="Footer"
          className="mx-auto flex max-w-6xl flex-wrap gap-6 text-sm text-muted"
        >
          <Link href="/help">Help Center</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          {user ? <Link href="/settings/plan">Plan & billing</Link> : null}
        </nav>
      </footer>
    </div>
  );
}
