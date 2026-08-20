import { Play } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { SessionNav } from "@/components/shared/session-nav";
import { ButtonLink } from "@/components/ui/button";
import { ChatComposer } from "@/features/chat/chat-composer";
import { ChatThread } from "@/features/chat/chat-thread";
import { LiveCourt } from "@/features/matches/live-court";
import { PlaySetupForm } from "@/features/matches/play-setup-form";
import { PaymentProofForm } from "@/features/payments/payment-proof-form";
import { CreateSessionForm } from "@/features/sessions/create-session-form";
import type { SessionOverview } from "@/features/sessions/overview";
import { sessionReadiness } from "@/features/sessions/readiness";
import { RsvpControl } from "@/features/sessions/rsvp-control";
import { SessionAtAGlance } from "@/features/sessions/session-overview";
import { SessionReadinessPanel } from "@/features/sessions/session-readiness";
import { SessionHero, SessionPlanDetails } from "@/features/sessions/session-summary";

const heroSession = {
  title: "Saturday Night Pickle",
  startsAt: new Date("2026-08-22T11:00:00.000Z"),
  endsAt: new Date("2026-08-22T14:00:00.000Z"),
  venueName: "Central Pickle",
  venueAddress: "Greenfield District, Mandaluyong",
  courtNumbers: ["2", "3"],
  courtCount: 2,
  bookedAt: new Date("2026-08-18T03:00:00.000Z"),
  estimatedCostCents: 30000,
};

const heroPlayers = ["Van", "AJ", "Mika", "Bea", "John"];
const heroReadiness = sessionReadiness({
  goingCount: 8,
  booked: true,
  expectsCollection: true,
  collectionCreated: false,
});
const heroOverview: SessionOverview = {
  messageCount: 12,
  play: { activeMatchCount: 0, completedMatchCount: 0, waitingCount: 0, featuredMatch: null },
  payment: { view: "host", proofCount: 1, unpaidCount: 4 },
};

function ProductComponentFrame({
  children,
  caption,
  detail,
}: {
  children: ReactNode;
  caption: string;
  detail: string;
}) {
  return (
    <figure>
      <div
        inert
        className="overflow-hidden rounded-xl border border-line bg-canvas text-left text-ink shadow-[0_8px_8px_rgb(20_24_34_/_0.08)] [--primary:#5962d9] [--session-cover:#18233b]"
      >
        {children}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6b6b70]">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b7d62e]" />
          {caption}
        </span>
        <span>{detail}</span>
      </figcaption>
    </figure>
  );
}

export function HeroProductShot() {
  return (
    <ProductComponentFrame
      caption="The real Relay Overview components"
      detail="Responsive by construction · Story included"
    >
      <div className="bg-surface px-4 pt-3 sm:px-6 sm:pt-4">
        <SessionNav id="preview" active="Overview" hrefBase="#" />
        <div className="pt-4">
          <GamePageIntro
            title="Overview"
            description="The plan, roster, setup progress, and next action for this game."
          />
        </div>
        <div className="grid gap-6 pb-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="public-session-panel min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
            <SessionHero session={heroSession} hostLabel="Hosted by you" headingLevel="h2" />
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="hidden sm:block">
                <SessionPlanDetails session={heroSession} />
              </div>
              <SessionAtAGlance
                overview={heroOverview}
                hrefBase="#"
                status="published"
                goingCount={8}
                capacity={10}
                waitlistCount={1}
              />
            </div>
          </article>

          <aside className="hidden space-y-6 lg:block">
            <section className="rounded-xl border border-line bg-surface p-5">
              <p className="text-sm font-semibold text-primary">Host access</p>
              <h2 className="mt-1 text-lg font-bold">You manage this game</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Editing, roster controls, payments, Play, and scoring appear only for hosts.
              </p>
              <SessionReadinessPanel readiness={heroReadiness} sessionId="preview" hrefBase="#" />
              <ButtonLink href="#/play" className="mt-5 w-full">
                <Play aria-hidden weight="fill" size={15} /> Set up Play
              </ButtonLink>
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Who’s playing</h2>
                  <p className="mt-1 text-sm text-muted">8 of 10 going</p>
                </div>
                <AvatarStack names={heroPlayers.slice(0, 3)} total={8} />
              </div>
              <ul className="divide-y divide-line border-y border-line">
                {heroPlayers.slice(0, 3).map((name, index) => (
                  <li className="flex min-h-14 items-center gap-3 py-2" key={name}>
                    <Avatar name={name} index={index} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted">{index ? "Going" : "Host"}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </ProductComponentFrame>
  );
}

export function CreateProductPreview() {
  return (
    <ProductComponentFrame caption="The actual Create form" detail="Focused on the plan and schedule">
      <div className="bg-surface p-5 sm:p-8">
        <GamePageIntro title="Create a game" description="Add the details, then share the game link." />
        <CreateSessionForm
          defaults={{
            title: "Saturday Night Pickle",
            venue: "Central Pickle",
            venueAddress: "Greenfield District, Mandaluyong",
            date: "2026-08-22",
            start: "19:00",
            end: "22:00",
            capacity: 10,
            courts: 2,
          }}
        />
      </div>
    </ProductComponentFrame>
  );
}

export function InviteProductShot() {
  return (
    <ProductComponentFrame caption="The actual shared-link components" detail="No-account RSVP included">
      <div className="bg-surface">
        <SessionHero session={heroSession} hostLabel="Hosted by Van · 8 of 10 going" headingLevel="h2" />
        <div className="mx-auto max-w-md p-5 sm:p-8">
          <div className="rounded-xl border border-line bg-surface p-5">
            <RsvpControl sessionId="00000000-0000-4000-8000-000000000001" slug="preview" instance="desktop" />
          </div>
          <p className="mt-4 text-center text-sm text-muted">Guests see the plan before they RSVP.</p>
        </div>
      </div>
    </ProductComponentFrame>
  );
}

export function PlaySetupProductPreview() {
  return (
    <ProductComponentFrame
      caption="The actual Play setup"
      detail="Five formats, partner style, timer, and start action"
    >
      <div className="bg-surface p-5 sm:p-8">
        <GamePageIntro title="Set up Play" description="Choose how players rotate through the courts." />
        <PlaySetupForm sessionId="00000000-0000-4000-8000-000000000001" playerCount={8} courtCount={2} />
      </div>
    </ProductComponentFrame>
  );
}

export function LivePlayProductPreview({ expanded = false }: { expanded?: boolean }) {
  return (
    <ProductComponentFrame
      caption={expanded ? "The actual scoreboard at courtside scale" : "The actual live court"}
      detail={expanded ? "One court, maximum legibility" : "Realtime scores and touch controls"}
    >
      <div className={`bg-surface p-4 sm:p-7 ${expanded ? "mx-auto max-w-4xl" : ""}`}>
        <GamePageIntro
          title={expanded ? "Court 1" : "Active courts"}
          description={expanded ? "Focused scoreboard" : "Balanced Mix · scores update for everyone"}
        />
        <LiveCourt
          sessionId="00000000-0000-4000-8000-000000000001"
          matchId="00000000-0000-4000-8000-000000000002"
          number="Court 1"
          teams={["Van + AJ", "Mika + Bea"]}
          scores={[8, 6]}
          version={1}
          canScore
        />
      </div>
    </ProductComponentFrame>
  );
}

export function PaymentsProductPreview() {
  return (
    <ProductComponentFrame caption="The actual proof submission components" detail="Repayment, not payment processing">
      <div className="grid gap-7 bg-surface p-5 sm:p-8 lg:grid-cols-[1fr_340px]">
        <div>
          <GamePageIntro title="Your payment" description="Pay the host directly, then attach one clear screenshot." />
          <section className="border-y border-line py-5">
            <p className="text-sm text-muted">Court rental · paid upfront by Van</p>
            <p className="score mt-2 text-4xl font-bold">₱300</p>
            <p className="mt-2 text-sm text-muted">Your share of ₱2,400 across 7 paying players</p>
          </section>
          <PaymentProofForm paymentId="00000000-0000-4000-8000-000000000003" />
        </div>
        <section className="self-start border-y border-line py-5">
          <p className="text-sm font-semibold text-primary">Send to the host</p>
          <h2 className="mt-1 text-lg font-bold">Van · GCash</h2>
          <p className="score mt-4 text-2xl">0917 123 4567</p>
          <p className="mt-2 text-sm text-muted">
            Relay tracks payment status. Your group uses its usual payment method.
          </p>
        </section>
      </div>
    </ProductComponentFrame>
  );
}

export function ChatProductPreview() {
  return (
    <ProductComponentFrame caption="The actual session chat components" detail="Messages and photos for this game">
      <div className="flex h-[620px] flex-col bg-surface px-5 pt-5 sm:px-8 sm:pt-7">
        <GamePageIntro title="Chat" description="Share arrival updates, court notes, and photos." />
        <ChatThread messageCount={3}>
          <div className="space-y-5">
            <p className="text-center text-xs text-muted">AJ joined the game</p>
            <div className="flex items-end gap-2">
              <Avatar name="Mika" index={2} size="sm" />
              <div className="max-w-[75%] rounded-xl rounded-bl-sm bg-surface-strong px-3 py-2.5 text-sm">
                Parking is open beside Court 2.
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[78%] rounded-xl rounded-br-sm bg-primary px-3 py-2.5 text-sm text-white">
                Perfect. I’ll bring the extra balls.
              </div>
            </div>
            <p className="text-center text-xs text-muted">Court 1 match started</p>
          </div>
        </ChatThread>
        <ChatComposer sessionId="00000000-0000-4000-8000-000000000001" />
      </div>
    </ProductComponentFrame>
  );
}
