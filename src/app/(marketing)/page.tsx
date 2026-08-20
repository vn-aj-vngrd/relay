import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand, RelayMark } from "@/components/shared/brand";
import { getCurrentUser } from "@/features/auth/session";
import { CourtFinderShowcase } from "@/features/marketing/court-finder-showcase";
import { MarketingEnhancements } from "@/features/marketing/marketing-enhancements";
import { MarketingHighlights } from "@/features/marketing/marketing-highlights";
import {
  ChatProductPreview,
  CreateProductPreview,
  HeroProductShot,
  InviteProductShot,
  LivePlayProductPreview,
  PaymentsProductPreview,
  PlaySetupProductPreview,
} from "@/features/marketing/product-previews";
import { RecapTemplatePreview } from "@/features/marketing/recap-template-preview";

export const metadata: Metadata = {
  title: "Relay — Plan pickleball with friends",
  description: "Plan a pickleball game, share the link, manage RSVPs and courts, split costs, and record scores.",
  openGraph: {
    title: "Relay — Plan pickleball with friends",
    description: "Set the time and court, then share one link for RSVPs, payments, scores, chat, and photos.",
    type: "website",
  },
};

const primaryAction =
  "pressable inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-4 text-[13px] font-semibold leading-none text-white shadow-[inset_0_1px_0_oklch(1_0_0/.22)] hover:bg-primary-hover";
const secondaryAction =
  "pressable inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d5d5cf] bg-white px-4 text-[13px] font-semibold hover:border-[#aaa9a3] hover:bg-[#f1f1ee]";

export default async function MarketingPage() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/home" : "/signup";

  return (
    <main id="main-content" className="marketing-page min-h-screen bg-[#f7f7f5] text-[#171719]">
      <MarketingEnhancements />
      <header className="sticky top-0 z-40 border-b border-[#e2e2dd] bg-[#f7f7f5]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <nav
            aria-label="Marketing navigation"
            className="hidden items-center gap-6 text-[13px] text-[#66666c] md:flex"
          >
            <a href="#highlights" className="hover:text-[#171719]">
              Highlights
            </a>
            <a href="#court-finder" className="hover:text-[#171719]">
              Court
            </a>
            <a href="#plan" className="hover:text-[#171719]">
              Plan & invite
            </a>
            <a href="#play" className="hover:text-[#171719]">
              Play
            </a>
            <a href="#payments" className="hover:text-[#171719]">
              Repay
            </a>
            <a href="#story" className="hover:text-[#171719]">
              Story
            </a>
          </nav>
          <div className="flex items-center gap-1">
            {user ? null : (
              <Link
                href="/login"
                className="pressable hidden min-h-11 items-center px-3 text-sm font-medium text-[#55555b] hover:text-[#171719] sm:inline-flex"
              >
                Log in
              </Link>
            )}
            <Link href={primaryHref} className={primaryAction}>
              {user ? "Open app" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      <section className="overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="marketing-hero-copy mx-auto max-w-[1100px] text-center">
            <p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#526415]">
              <span className="h-2 w-2 rounded-full bg-[#b7d62e]" />
              Pickleball plans in one link
            </p>
            <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-[650] leading-[.98] tracking-[-0.052em] sm:leading-[.92]">
              <span className="block">Plan the game.</span>
              <span className="block">Share the link. Play.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-[720px] text-lg leading-8 text-[#626268] sm:text-xl">
              Set the time and court, invite players, run the games, and split the cost. Friends can RSVP without an
              account.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={primaryHref} className={primaryAction}>
                {user ? "Open Relay" : "Create a game"}
                <ArrowRight aria-hidden size={16} />
              </Link>
              <a href="#highlights" className={secondaryAction}>
                See how it works
              </a>
            </div>
          </div>
          <div id="product" className="marketing-hero-product mt-16 sm:mt-20">
            <HeroProductShot />
          </div>
        </div>
      </section>

      <MarketingHighlights />

      <CourtFinderShowcase />

      <section className="border-b border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <h2 className="max-w-xl text-3xl font-[620] leading-tight tracking-[-0.038em] sm:text-5xl">
              Everything your group needs for one game.
            </h2>
            <p className="max-w-xl self-end text-base leading-7 text-[#66666c] sm:justify-self-end sm:text-lg">
              Relay does not book courts or run a league. It keeps the plan, players, games, payments, and photos in one
              place.
            </p>
          </div>
          <dl className="mt-16 grid border-y border-[#deded9] md:grid-cols-3">
            <div className="py-7 md:pr-8">
              <dt className="text-sm font-semibold">One page for the game</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                The plan, roster, payments, scores, chat, and photos stay together.
              </dd>
            </div>
            <div className="border-t border-[#deded9] py-7 md:border-l md:border-t-0 md:px-8">
              <dt className="text-sm font-semibold">Guests can RSVP</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                Friends can open the link and RSVP by name without creating an account.
              </dd>
            </div>
            <div className="border-t border-[#deded9] py-7 md:border-l md:border-t-0 md:pl-8">
              <dt className="text-sm font-semibold">Easy to use courtside</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                See court assignments, scores, and who plays next from your phone.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="plan" className="border-t border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-32">
        <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]">
          <div className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold text-[#526415]">Plan once. Share once.</p>
              <h2 className="mt-4 max-w-xl text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">
                Set the plan and send one link.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#66666c] lg:justify-self-end">
              Add the court, time, player limit, and booking details. Share the game link so everyone sees the same
              plan.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <CreateProductPreview />
            <InviteProductShot />
          </div>
          <dl className="mt-10 grid border-y border-[#deded9] sm:grid-cols-3">
            <div className="py-6 sm:pr-8">
              <dt className="text-sm font-semibold">Quick to publish</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                Add the court, schedule, player limit, and cost.
              </dd>
            </div>
            <div className="border-t border-[#deded9] py-6 sm:border-l sm:border-t-0 sm:px-8">
              <dt className="text-sm font-semibold">Easy to join</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                Players can RSVP from the link. Relay handles the player limit and waitlist.
              </dd>
            </div>
            <div className="border-t border-[#deded9] py-6 sm:border-l sm:border-t-0 sm:pl-8">
              <dt className="text-sm font-semibold">One shared place</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                The plan, players, scores, chat, payments, and photos stay on the game page.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="play" className="border-t border-[#deded9] px-5 py-20 sm:px-8 sm:py-32">
        <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]">
          <div className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold text-[#526415]">When everyone arrives</p>
              <h2 className="mt-4 max-w-xl text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">
                Set up the courts and start playing.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#66666c] lg:justify-self-end">
              Mark who arrived, choose a play format, and start the timer if you need one. Relay shows the courts,
              queue, scores, and standings.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <PlaySetupProductPreview />
            <LivePlayProductPreview />
          </div>
          <div className="mt-6">
            <LivePlayProductPreview expanded />
          </div>
          <div className="mt-10 grid border-y border-[#deded9] sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Paddle Stack", "Continuous play with mixed partners or pairs that stay together."],
              ["Mix It Up", "Fair rests, new partners, and fewer repeated matchups."],
              ["Balanced Mix", "Close teams from self-described experience—not ratings."],
              ["Court Climb", "Winners move toward Court 1 while partners split."],
              ["Team Round Robin", "Fixed pairs play every other pair once, with automatic byes."],
            ].map(([title, description], index) => (
              <div
                key={title}
                className={`py-6 lg:px-5 ${index ? "border-t border-[#deded9] sm:border-l sm:border-t-0" : "lg:pl-0"} ${index % 2 ? "sm:pl-6" : "sm:pr-6"}`}
              >
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#66666c]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="payments" className="border-y border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-32">
        <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]">
          <div className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold text-[#526415]">Organize and settle</p>
              <h2 className="mt-4 max-w-xl text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">
                Split the court cost.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#66666c] lg:justify-self-end">
              Enter the total and payment method. Players can upload proof, and the host can mark each share as paid.
            </p>
          </div>
          <div className="mt-12">
            <PaymentsProductPreview />
          </div>
          <div className="mt-10 grid gap-6 border-y border-[#deded9] py-7 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">Before payment</h3>
              <p className="mt-2 text-sm leading-6 text-[#66666c]">
                The host can see whether the court is booked and what still needs to be done.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">For every player</h3>
              <p className="mt-2 text-sm leading-6 text-[#66666c]">
                Adjust a player’s share without changing the rest.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">No money moves here</h3>
              <p className="mt-2 text-sm leading-6 text-[#66666c]">
                Pay through GCash, Maya, bank transfer, cash, or another method.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="sync" className="px-5 py-20 sm:px-8 sm:py-32">
        <div
          data-marketing-reveal="split-reverse"
          className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[1.25fr_.75fr] lg:gap-20"
        >
          <div>
            <ChatProductPreview />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#526415]">Stay in sync</p>
            <h2 className="mt-4 text-3xl font-[620] tracking-[-0.038em] sm:text-4xl">
              Keep game messages with the game.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-[#66666c]">
              Use the game chat for arrival updates, parking notes, photos, and reactions. Notifications cover invites,
              waitlist changes, payments, and court assignments.
            </p>
          </div>
        </div>
      </section>

      <section id="story" className="border-y border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-32">
        <div
          data-marketing-reveal="split"
          className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#526415]">After the last point</p>
            <h2 className="mt-4 text-3xl font-[620] tracking-[-0.038em] sm:text-4xl">Save the scores and photos.</h2>
            <p className="mt-5 leading-7 text-[#66666c]">
              End Play to save the final scores. Make a vertical image from the results and your photos, then share it
              to Instagram, Facebook, or your group chat.
            </p>
            <ul className="mt-7 divide-y divide-[#deded9] border-y border-[#deded9] text-sm">
              <li className="py-3">Choose from the results available for that game</li>
              <li className="py-3">Pick a layout, color, and photo</li>
              <li className="py-3">Share or download a 1080 × 1920 image</li>
            </ul>
          </div>
          <RecapTemplatePreview />
        </div>
      </section>

      <section className="border-t border-[#deded9] bg-white px-5 py-24 text-center sm:px-8 sm:py-36">
        <div data-marketing-reveal="final" className="mx-auto max-w-3xl">
          <div className="mx-auto mb-7 grid h-10 w-10 place-items-center">
            <RelayMark className="h-8 w-8" />
          </div>
          <h2 className="text-4xl font-[620] tracking-[-0.045em] sm:text-6xl">Plan your next game in Relay.</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#66666c]">
            Add the court and time, then send one link to your players.
          </p>
          <Link href={primaryHref} className={`${primaryAction} mt-9`}>
            {user ? "Open Relay" : "Create a game"}
            <ArrowRight aria-hidden size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#deded9] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 text-sm text-[#66666c] sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p>Plan games, invite players, and record scores.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#highlights">Highlights</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href={user ? "/home" : "/login"}>{user ? "Open app" : "Log in"}</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
