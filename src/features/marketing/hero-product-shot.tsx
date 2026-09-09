import {
  ArrowRight,
  CheckCircle,
  LinkSimple,
  MapPin,
} from "@phosphor-icons/react/dist/ssr";

import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";

import { HeroStoryPreview } from "./recap-template-preview";

/** A read-only lifecycle composition, not a live game or an interactive demo. */
export function HeroProductShot() {
  return (
    <figure aria-label="One game, from invite to recap" className="text-left">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface text-ink">
        <header
          data-marketing-part="plan"
          className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-8 sm:py-6"
        >
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Saturday Night Pickle
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>Sat, Aug 22 · 7–10 PM</span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden size={15} /> Central Pickle
              </span>
            </p>
          </div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <LinkSimple aria-hidden size={18} /> One link. Everyone’s in the
            loop.
          </p>
        </header>

        <div className="grid min-w-0 sm:grid-cols-2 lg:grid-cols-[1fr_1.65fr_1fr]">
          <section
            data-marketing-part="crew"
            aria-label="Invites, roster and chat"
            className="order-2 min-w-0 border-t border-line p-5 sm:border-r sm:p-8 lg:order-1 lg:border-t-0 lg:p-6"
          >
            <h3 className="text-lg font-bold tracking-tight">
              Get the crew in.
            </h3>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <AvatarStack names={["Van", "AJ", "Mika"]} total={8} />
              <p className="text-sm font-semibold">8 of 10 going</p>
            </div>
            <p className="mt-3 text-sm text-muted">
              Guests can RSVP. No account needed.
            </p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {["AJ", "Mika"].map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium">{name}</span>
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle aria-hidden size={16} /> Going
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h4 className="text-sm font-semibold">
                Chat stays with the game
              </h4>
              <div className="mt-3 flex items-start gap-2">
                <Avatar name="Bea" index={3} size="sm" />
                <p className="rounded-xl bg-surface-strong px-3 py-2 text-sm leading-5">
                  <span className="block font-semibold">Bea</span>I’ll bring the
                  extra balls!
                </p>
              </div>
            </div>
          </section>

          <section
            data-marketing-part="court"
            aria-label="Live scores and rotation"
            className="order-1 min-w-0 bg-court text-white sm:col-span-2 lg:order-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
              <h3 className="text-sm font-semibold">Court 1 · Round 3</h3>
              <span className="inline-flex items-center gap-2 text-xs font-semibold">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-live"
                />{" "}
                Live
              </span>
            </div>
            <p className="px-5 pt-4 text-2xl font-semibold tracking-tight sm:px-8 sm:text-3xl">
              More rallies.
              <br />
              Less rallying people.
            </p>
            <div className="mt-6 grid grid-cols-2 divide-x divide-court-line/30 border-y border-court-line/30">
              {[
                { team: "Van + AJ", score: 8 },
                { team: "Mika + Bea", score: 6 },
              ].map(({ team, score }) => (
                <div key={team} className="py-5 text-center sm:py-7">
                  <p className="text-sm font-medium">{team}</p>
                  <p className="score mt-2 text-7xl font-bold leading-none sm:text-8xl">
                    {score}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-5 sm:px-8">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-court-line">
                <ArrowRight aria-hidden size={16} /> Up next
              </h4>
              <ol className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <li>
                  <span className="score mr-2 text-court-line">01</span>Kara +
                  Luis
                </li>
                <li>
                  <span className="score mr-2 text-court-line">02</span>John +
                  Sam
                </li>
              </ol>
              <p className="mt-5 border-t border-court-line/30 pt-4 text-sm text-court-line">
                Live scores. Clear turns. Just play.
              </p>
            </div>
          </section>

          <div
            data-marketing-part="follow-through"
            className="order-3 min-w-0 border-t border-line lg:border-l lg:border-t-0"
          >
            <section
              aria-label="Payment tracking"
              className="p-5 sm:p-8 lg:p-6"
            >
              <h3 className="text-lg font-bold tracking-tight">
                Skip the payment chase.
              </h3>
              <p className="mt-3 text-sm">
                <span className="score text-2xl font-bold">₱300</span>
                <span className="ml-2 text-muted">per player</span>
              </p>
              <ul className="mt-3 divide-y divide-line text-sm">
                <li className="flex justify-between gap-3 py-2">
                  <span>AJ</span>
                  <span className="text-muted">Proof sent</span>
                </li>
                <li className="flex justify-between gap-3 py-2">
                  <span>Mika</span>
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle aria-hidden size={16} /> Confirmed
                  </span>
                </li>
              </ul>
              <p className="mt-2 text-xs leading-5 text-muted">
                Pay the host your usual way. Track it here.
              </p>
            </section>
            <section
              aria-label="Shareable game stories"
              className="flex items-center gap-4 border-t border-line bg-primary-soft px-5 py-5 sm:px-8 lg:px-6"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold leading-tight tracking-tight">
                  Keep the
                  <br />
                  good games.
                </h3>
                <p className="mt-3 text-sm leading-5 text-muted">
                  Scores, crew, memories. Ready for your Story.
                </p>
              </div>
              <div className="w-24 shrink-0 motion-safe:rotate-3 sm:w-28 lg:w-24">
                <HeroStoryPreview />
              </div>
            </section>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-sm font-semibold">
          From “who’s in?” to “same time next week?”
        </p>
        <p className="text-xs text-muted">
          Illustrative game · Invite, Play, repay, recap
        </p>
      </figcaption>
    </figure>
  );
}
