import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { requireUser } from "@/features/auth/session";

const sections = [
  { title: "Getting started", items: [
    ["What is Relay for?", "Relay organizes casual pickleball with friends. It keeps the plan, invite, roster, shared costs, courts, scores, and memories around one session. It is not a league or rating platform."],
    ["Do I need a group before creating a game?", "No. Standalone games are the fastest way to start. Groups are useful only when the same crew plays regularly."],
    ["Can I use Relay without booking through it?", "Yes. Court booking happens with the venue. Add the booking details or mark the court booked after you return to Relay."],
  ]},
  { title: "Invites and players", items: [
    ["Can friends view a game without an account?", "Yes. A public session link shows the date, time, venue, host, roster, open spots, estimated cost, and booking status before sign-in."],
    ["How does guest RSVP work?", "A guest enters their name and chooses Join, Maybe, or Can’t make it. Relay remembers that response on the same device without creating an account."],
    ["What happens when the game is full?", "New Join responses move to the waitlist automatically. If a going player leaves, the first eligible waitlisted player is promoted."],
    ["Can the host change the roster?", "Hosts can add or remove players, adjust capacity, manage waitlist order, and lock the roster when assignments are final."],
  ]},
  { title: "Payments", items: [
    ["Does Relay process money?", "No. Players pay through GCash, Maya, bank transfer, cash, or another method supplied by the host. Relay only coordinates the split and status."],
    ["How does the payment split work?", "The host records an expense they already paid in full. Relay divides repayment among the other going players; the host is never included in the split. Players pay outside Relay and upload one screenshot for review."],
    ["Can the host share the original receipt?", "Yes. The host may attach one receipt when creating the collection so players can see that the venue or shared expense was paid upfront."],
    ["Can player amounts be different?", "Hosts can override individual shares when someone is excluded or owes a different amount."],
  ]},
  { title: "Courts and live play", items: [
    ["What is the paddle stack?", "It is the ordered queue of available players. The people waiting longest appear first, while hosts can override the order when needed."],
    ["Do we have to score every point?", "No. Use live point controls during a match or enter only the final result afterward."],
    ["Who can change scores and rotations?", "The host and authorized co-hosts manage shared court state. Players can view assignments, scores, the queue, and what is coming next."],
    ["Which play setup should I use?", "Paddle Stack is best for drop-ins, Mix It Up rotates partners in social rounds, and Court Climb moves winners toward Court 1. The host chooses before Live Mode starts."],
    ["What happens if the connection drops?", "The current screen remains usable where possible. Collaborative views refresh when the connection returns; confirm important score changes after reconnecting."],
  ]},
  { title: "Profiles, privacy, and history", items: [
    ["Are profile statistics competitive ratings?", "No. Sessions, matches, and wins are a lightweight record of games with friends. Relay does not calculate a professional skill rating."],
    ["Who can see a public session?", "Anyone with the link can view its public plan. Host-only controls, payment review, chat, and management pages still require authorized access."],
    ["What happens after a session ends?", "The session becomes a memory with its players, results, standings, photos, reactions, and comments. The host can use Play Again to copy only the reusable setup."],
  ]},
] as const;

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const query = (await searchParams).q?.trim().toLowerCase() ?? "";
  const visible = sections.map((section) => ({ ...section, items: section.items.filter(([question, answer]) => !query || `${question} ${answer}`.toLowerCase().includes(query)) })).filter((section) => section.items.length);

  return <div className="mx-auto max-w-4xl"><header className="border-b border-line pb-6"><div className="flex items-start justify-between gap-4"><div><h1 className="app-title">Help Center</h1><p className="mt-2 text-sm text-muted">Answers for planning, inviting, paying, and playing.</p></div><Link href="/onboarding/tour?replay=1" className="pressable inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm font-semibold hover:bg-surface-strong">Replay tour</Link></div><form className="relative mt-5 max-w-xl"><MagnifyingGlass aria-hidden className="absolute left-3 top-3 text-muted" size={18} /><label htmlFor="help-search" className="sr-only">Search help</label><input id="help-search" name="q" defaultValue={query} placeholder="Search Relay help…" className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" /></form></header><div className="grid gap-10 py-8 lg:grid-cols-[180px_1fr]"><nav aria-label="Help topics" className="hidden lg:block"><ul className="sticky top-8 space-y-1">{sections.map((section) => <li key={section.title}><a href={`#${section.title.toLowerCase().replaceAll(" ", "-")}`} className="block rounded-md px-2 py-1.5 text-sm text-muted hover:bg-surface-strong hover:text-ink">{section.title}</a></li>)}</ul></nav><div className="space-y-10">{visible.length ? visible.map((section) => <section key={section.title} id={section.title.toLowerCase().replaceAll(" ", "-")}><h2 className="text-base font-semibold">{section.title}</h2><div className="mt-2 divide-y divide-line border-y border-line">{section.items.map(([question, answer]) => <details key={question} className="group"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium marker:hidden"><span>{question}</span><span aria-hidden className="text-lg font-light text-muted group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-4 pr-8 text-sm leading-6 text-muted">{answer}</p></details>)}</div></section>) : <section className="border-y border-line py-8"><h2 className="font-semibold">No matching help topics</h2><p className="mt-1 text-sm text-muted">Try a shorter search such as “payment,” “guest,” or “score.”</p></section>}</div></div></div>;
}
