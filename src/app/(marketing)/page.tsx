import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand, RelayMark } from "@/components/shared/brand";
import { getCurrentUser } from "@/features/auth/session";
import { MarketingEnhancements } from "@/features/marketing/marketing-enhancements";
import { MarketingHighlights } from "@/features/marketing/marketing-highlights";
import { HeroProductShot, InviteProductShot, ProductShot } from "@/features/marketing/product-previews";
import { RecapTemplatePreview } from "@/features/marketing/recap-template-preview";

export const metadata: Metadata = {
  title: "Relay — The shared home for pickleball with friends",
  description:
    "Create the game, share one link, organize the crew, run the courts, settle the cost, and keep the night together.",
  openGraph: {
    title: "Relay — One session for the whole pickleball night",
    description: "Plan, invite, organize, play, repay, and remember—with one shared game link.",
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
            <a href="#plan" className="hover:text-[#171719]">
              Plan & invite
            </a>
            <a href="#play" className="hover:text-[#171719]">
              Play
            </a>
            <a href="#payments" className="hover:text-[#171719]">
              Repay
            </a>
            <a href="#recap" className="hover:text-[#171719]">
              Recap
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
              Built for friendly games, not rankings
            </p>
            <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-[650] leading-[.98] tracking-[-0.052em] sm:leading-[.92]">
              <span className="block">One session.</span>
              <span className="block">The whole pickleball night.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-[720px] text-lg leading-8 text-[#626268] sm:text-xl">
              Create one game, send one link, run every court, settle the cost, and turn the night into a shared memory.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={primaryHref} className={primaryAction}>
                {user ? "Open Relay" : "Create your first game"}
                <ArrowRight aria-hidden size={16} />
              </Link>
              <a href="#highlights" className={secondaryAction}>
                See the highlights
              </a>
            </div>
          </div>
          <div id="product" className="marketing-hero-product mt-16 sm:mt-20">
            <HeroProductShot />
          </div>
        </div>
      </section>

      <MarketingHighlights />

      <section className="border-b border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <h2 className="max-w-xl text-3xl font-[620] leading-tight tracking-[-0.038em] sm:text-5xl">
              Enough structure to keep the game moving. Nothing that makes it feel official.
            </h2>
            <p className="max-w-xl self-end text-base leading-7 text-[#66666c] sm:justify-self-end sm:text-lg">
              Relay is not court-booking software, a league platform, or a rating system. It is the capable friend who
              keeps one real-world session clear for everyone.
            </p>
          </div>
          <dl className="mt-16 grid border-y border-[#deded9] md:grid-cols-3">
            <div className="py-7 md:pr-8">
              <dt className="text-sm font-semibold">The session is home</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                Plan, roster, payments, Play, chat, results, and photos stay attached to the same game.
              </dd>
            </div>
            <div className="border-t border-[#deded9] py-7 md:border-l md:border-t-0 md:px-8">
              <dt className="text-sm font-semibold">The link works first</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                Friends understand the invitation and can RSVP by name before deciding whether they need an account.
              </dd>
            </div>
            <div className="border-t border-[#deded9] py-7 md:border-l md:border-t-0 md:pl-8">
              <dt className="text-sm font-semibold">The court stays legible</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                Scores, assignments, and who is next remain clear from a phone beside the court.
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
                Make the game clear before anyone asks.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#66666c] lg:justify-self-end">
              Set the venue, schedule, capacity, courts, and booking details. The public link then gives every friend
              the same plan and lets them respond by name without creating an account.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <ProductShot
              src="/images/product/create.webp"
              alt="Relay Create game form with venue suggestions, schedule, player capacity, courts, and progressive details"
              caption="A focused plan with optional details when needed"
              mobileFocus="center"
              width={2880}
              height={2000}
            />
            <InviteProductShot />
          </div>
          <dl className="mt-10 grid border-y border-[#deded9] sm:grid-cols-3">
            <div className="py-6 sm:pr-8">
              <dt className="text-sm font-semibold">Quick to publish</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                Venue suggestions, custom schedule controls, court quantity, and sensible progressive details.
              </dd>
            </div>
            <div className="border-t border-[#deded9] py-6 sm:border-l sm:border-t-0 sm:px-8">
              <dt className="text-sm font-semibold">Easy to join</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                Guest RSVP, optional approval, capacity, and automatic waitlisting from the shared link.
              </dd>
            </div>
            <div className="border-t border-[#deded9] py-6 sm:border-l sm:border-t-0 sm:pl-8">
              <dt className="text-sm font-semibold">One shared place</dt>
              <dd className="mt-2 text-sm leading-6 text-[#66666c]">
                The plan, players, Play, chat, payments, and recap keep the same structure for everyone.
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
                Choose the rhythm, then keep everyone moving.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#66666c] lg:justify-self-end">
              Start with the format your crew understands. Relay explains the rule, validates the roster, builds pairs
              when needed, and turns the setup into courts, a queue, scores, and standings everyone can follow.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <ProductShot
              src="/images/product/play-setup.webp"
              alt="Relay Play setup showing Paddle Stack, Mix It Up, Balanced Mix, Court Climb, Team Round Robin, and partner controls"
              caption="Choose from five understandable ways to run the courts"
              mobileFocus="center"
              width={2880}
              height={2000}
            />
            <ProductShot
              src="/images/product/play.webp"
              alt="Relay Play showing two active court scoreboards, balanced teams, large scores, touch controls, and the waiting area"
              caption="Every active court gets a realtime scoreboard"
              mobileFocus="center"
              width={2880}
              height={2000}
            />
          </div>
          <div className="mt-6">
            <ProductShot
              src="/images/product/play-expanded.webp"
              alt="Relay expanded scoreboard filling the viewport with two teams, large scores, touch controls, and a close action"
              caption="Expand any scoreboard for a focused courtside display"
              mobileFocus="center"
              width={2880}
              height={1800}
            />
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
                The host pays the venue. Relay makes repayment clear.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#66666c] lg:justify-self-end">
              Record the total, share GCash, Maya, bank, cash, or custom details, and optionally attach the original
              receipt. Players upload one proof image; the host confirms or asks for a replacement.
            </p>
          </div>
          <div className="mt-12">
            <ProductShot
              src="/images/product/payments.webp"
              alt="Relay host payment screen showing a court total, repayment account, player shares, paid status, and proofs waiting for review"
              caption="Host-paid collection and proof review"
              mobileFocus="center"
              width={2880}
              height={1800}
            />
          </div>
          <div className="mt-10 grid gap-6 border-y border-[#deded9] py-7 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">Before payment</h3>
              <p className="mt-2 text-sm leading-6 text-[#66666c]">
                Booking confirmation and session readiness show what the host still needs to finish.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">For every player</h3>
              <p className="mt-2 text-sm leading-6 text-[#66666c]">
                Individual shares can be adjusted or excluded without changing everyone else.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">No money moves here</h3>
              <p className="mt-2 text-sm leading-6 text-[#66666c]">
                Relay coordinates status while payment stays in the method the group already uses.
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
            <ProductShot
              src="/images/product/chat.webp"
              alt="Relay session chat showing realtime sync, grouped messages, reactions, and a persistent photo and message composer"
              caption="Realtime conversation attached to the game"
              mobileFocus="center"
              width={2880}
              height={1800}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#526415]">Stay in sync</p>
            <h2 className="mt-4 text-3xl font-[620] tracking-[-0.038em] sm:text-4xl">
              No separate thread to reconstruct later.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-[#66666c]">
              Session chat keeps arrival plans, parking tips, photos, reactions, and system updates beside the plan.
              Notifications pull out only the moments that need attention: invitations, waitlist movement, payment
              review, and court assignments.
            </p>
          </div>
        </div>
      </section>

      <section id="recap" className="border-y border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-32">
        <div
          data-marketing-reveal="split"
          className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#526415]">After the last point</p>
            <h2 className="mt-4 text-3xl font-[620] tracking-[-0.038em] sm:text-4xl">The night gets its own recap.</h2>
            <p className="mt-5 leading-7 text-[#66666c]">
              Relay turns real match data into a portrait story reel. Share the whole night, your own record, the
              winning team, session leader, standings, closest finish, or busiest court—then choose a clean background
              or add a game photo. Recreation stays celebratory, never a rating.
            </p>
            <ul className="mt-7 divide-y divide-[#deded9] border-y border-[#deded9] text-sm">
              <li className="py-3">Seven focused stories, shown only when the scores support them</li>
              <li className="py-3">Swipe through 9:16 portraits made for social sharing</li>
              <li className="py-3">Choose a Relay background or one of the crew’s photos</li>
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
          <h2 className="text-4xl font-[620] tracking-[-0.045em] sm:text-6xl">
            Make the next game easier for everyone.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#66666c]">
            Create the session, send the link, and let Relay carry the details from the group chat to the court.
          </p>
          <Link href={primaryHref} className={`${primaryAction} mt-9`}>
            {user ? "Open Relay" : "Create your account"}
            <ArrowRight aria-hidden size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#deded9] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 text-sm text-[#66666c] sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p>The shared home for pickleball with friends.</p>
          <div className="flex gap-5">
            <a href="#highlights">Highlights</a>
            <Link href={user ? "/home" : "/login"}>{user ? "Open app" : "Log in"}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
