import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Brand, RelayMark } from "@/components/shared/brand";
import { getCurrentUser } from "@/features/auth/session";
import { MarketingEnhancements } from "@/features/marketing/marketing-enhancements";
import { HeroProductShot, InviteProductShot, ProductShot } from "@/features/marketing/product-previews";

export const metadata: Metadata = {
  title: "Relay — The shared home for pickleball with friends",
  description: "Create the game, share one link, organize the crew, settle the cost, run the courts, and keep the night together.",
  openGraph: {
    title: "Relay — One session for the whole pickleball night",
    description: "Plan, invite, organize, pay, play, score, and remember—with one shared game link.",
    type: "website",
  },
};

const workflow = ["Plan", "Invite", "Organize", "Pay", "Play", "Remember"] as const;

const capabilities = [
  { stage: "Plan", title: "A clear game before anyone leaves the group chat", items: ["Fast session creation", "Venue search and directions", "External booking details", "Court confirmation and readiness"] },
  { stage: "Invite", title: "One link that answers the usual questions", items: ["Account-optional public page", "Guest and account RSVP", "Capacity and automatic waitlist", "Host approval when needed"] },
  { stage: "Organize", title: "The right amount of structure for a recurring crew", items: ["Roster and manual players", "Groups and Play Again", "Calendar and global search", "Game-specific colors and notes"] },
  { stage: "Pay", title: "Repay the host without turning Relay into a bank", items: ["GCash, Maya, bank, cash, or custom", "Host-paid expense split", "One proof image per player", "Confirm, return, exclude, or adjust"] },
  { stage: "Play", title: "Court management that still works beside the court", items: ["Paddle Stack, Mix It Up, and Court Climb", "Waiting, resting, and unavailable states", "Live scoring or result only", "Session standings and deterministic rotations"] },
  { stage: "Remember", title: "The session becomes the record of the night", items: ["Realtime chat, reactions, and photos", "Useful in-app notifications", "Results, standings, and memories", "Profiles, history, groups, and Play Again"] },
] as const;

const primaryAction = "pressable inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-4 text-[13px] font-semibold leading-none text-white shadow-[inset_0_1px_0_oklch(1_0_0/.22)] hover:bg-primary-hover";
const secondaryAction = "pressable inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d5d5cf] bg-white px-4 text-[13px] font-semibold hover:border-[#aaa9a3] hover:bg-[#f1f1ee]";

export default async function MarketingPage() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/home" : "/signup";

  return <main id="main-content" className="marketing-page min-h-screen bg-[#f7f7f5] text-[#171719]">
    <MarketingEnhancements />
    <header className="sticky top-0 z-40 border-b border-[#e2e2dd] bg-[#f7f7f5]/94 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav aria-label="Marketing navigation" className="hidden items-center gap-7 text-[13px] text-[#66666c] md:flex"><a href="#product" className="hover:text-[#171719]">Product</a><a href="#workflow" className="hover:text-[#171719]">Workflow</a><a href="#play" className="hover:text-[#171719]">Live play</a><a href="#everything" className="hover:text-[#171719]">Everything inside</a></nav>
        <div className="flex items-center gap-1">{user ? null : <Link href="/login" className="pressable hidden min-h-11 items-center px-3 text-sm font-medium text-[#55555b] hover:text-[#171719] sm:inline-flex">Log in</Link>}<Link href={primaryHref} className={primaryAction}>{user ? "Open app" : "Get started"}</Link></div>
      </div>
    </header>

    <section className="overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
      <div className="mx-auto max-w-[1180px]">
        <div className="marketing-hero-copy mx-auto max-w-[1100px] text-center"><p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#526415]"><span className="h-2 w-2 rounded-full bg-[#b7d62e]" />Built for friendly games, not rankings</p><h1 className="text-[clamp(3rem,7vw,5.5rem)] font-[650] leading-[.98] tracking-[-0.052em] sm:leading-[.92]"><span className="block">One session.</span><span className="block">The whole pickleball night.</span></h1><p className="mx-auto mt-7 max-w-[720px] text-lg leading-8 text-[#626268] sm:text-xl">Relay carries the plan from the first group-chat message to the last score: invite friends, organize the roster, collect their share, run the courts, and keep the night together afterward.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href={primaryHref} className={primaryAction}>{user ? "Open Relay" : "Create your first game"}<ArrowRight aria-hidden size={16} /></Link><a href="#workflow" className={secondaryAction}>See the full flow</a></div></div>
        <div id="product" className="marketing-hero-product mt-16 sm:mt-20"><HeroProductShot /></div>
      </div>
    </section>

    <section className="border-y border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-28">
      <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]"><div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]"><h2 className="max-w-xl text-3xl font-[620] leading-tight tracking-[-0.038em] sm:text-5xl">Enough structure to keep the game moving. Nothing that makes it feel official.</h2><p className="max-w-xl self-end text-base leading-7 text-[#66666c] sm:justify-self-end sm:text-lg">Relay is not court-booking software, a league platform, or a rating system. It is the capable friend who keeps one real-world session clear for everyone.</p></div><dl className="mt-16 grid border-y border-[#deded9] md:grid-cols-3"><div className="py-7 md:pr-8"><dt className="text-sm font-semibold">The session is home</dt><dd className="mt-2 text-sm leading-6 text-[#66666c]">Plan, roster, payments, Play, chat, results, and photos stay attached to the same game.</dd></div><div className="border-t border-[#deded9] py-7 md:border-l md:border-t-0 md:px-8"><dt className="text-sm font-semibold">The link works first</dt><dd className="mt-2 text-sm leading-6 text-[#66666c]">Friends understand the invitation and can RSVP by name before deciding whether they need an account.</dd></div><div className="border-t border-[#deded9] py-7 md:border-l md:border-t-0 md:pl-8"><dt className="text-sm font-semibold">The court stays legible</dt><dd className="mt-2 text-sm leading-6 text-[#66666c]">Scores, assignments, and who is next remain clear from a phone beside the court.</dd></div></dl></div>
    </section>

    <section id="workflow" className="px-5 py-20 sm:px-8 sm:py-32">
      <div data-marketing-reveal="workflow" className="mx-auto max-w-[1180px]"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-sm font-semibold text-[#526415]">One continuous workflow</p><h2 className="mt-4 max-w-xl text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">From “Who’s free?” to “Same time next week?”</h2></div><ol className="grid grid-cols-2 border-y border-[#dcdcd7] sm:grid-cols-3">{workflow.map((step, index) => <li key={step} className={`min-h-24 px-4 py-5 ${index % 2 ? "border-l border-[#dcdcd7]" : ""} ${index >= 2 ? "border-t border-[#dcdcd7] sm:border-t-0" : ""} ${index >= 3 ? "sm:border-t sm:border-[#dcdcd7]" : ""} ${index % 3 ? "sm:border-l sm:border-[#dcdcd7]" : "sm:border-l-0"}`}><span className="font-mono text-[10px] text-[#66666c]">0{index + 1}</span><strong className="mt-3 block text-sm">{step}</strong></li>)}</ol></div></div>
    </section>

    <section className="border-t border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-32">
      <div data-marketing-reveal="split" className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20"><div><p className="text-sm font-semibold text-[#526415]">Share once</p><h2 className="mt-4 text-3xl font-[620] tracking-[-0.038em] sm:text-4xl">The invitation does the explaining.</h2><p className="mt-5 max-w-md leading-7 text-[#66666c]">Time, venue, directions, open spots, cost, booking status, roster, and host—all visible from the Messenger link. Guests can join by name, choose Maybe, or decline without an account.</p><ul className="mt-7 divide-y divide-[#deded9] border-y border-[#deded9] text-sm"><li className="py-3">Capacity and automatic waitlist</li><li className="py-3">Optional host approval</li><li className="py-3">The same Overview, Players, Play, Chat, and Payments structure</li></ul></div><InviteProductShot /></div>
    </section>

    <section className="px-5 py-20 sm:px-8 sm:py-32">
      <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]"><div className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]"><div><p className="text-sm font-semibold text-[#526415]">Organize and settle</p><h2 className="mt-4 max-w-xl text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">The host pays the venue. Relay makes repayment clear.</h2></div><p className="max-w-xl text-base leading-7 text-[#66666c] lg:justify-self-end">Record the total, share GCash, Maya, bank, cash, or custom details, and optionally attach the original receipt. Players upload one proof image; the host confirms or asks for a replacement.</p></div><div className="mt-12"><ProductShot src="/images/product/payments.webp" alt="Relay host payment screen showing a court total, repayment account, player shares, paid status, and proofs waiting for review" caption="Host-paid collection and proof review" mobileFocus="center" /></div><div className="mt-10 grid gap-6 border-y border-[#deded9] py-7 sm:grid-cols-3"><div><h3 className="text-sm font-semibold">Before payment</h3><p className="mt-2 text-sm leading-6 text-[#66666c]">Booking confirmation and session readiness show what the host still needs to finish.</p></div><div><h3 className="text-sm font-semibold">For every player</h3><p className="mt-2 text-sm leading-6 text-[#66666c]">Individual shares can be adjusted or excluded without changing everyone else.</p></div><div><h3 className="text-sm font-semibold">No money moves here</h3><p className="mt-2 text-sm leading-6 text-[#66666c]">Relay coordinates status while payment stays in the method the group already uses.</p></div></div></div>
    </section>

    <section id="play" className="border-y border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-32">
      <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]"><div className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]"><div><p className="text-sm font-semibold text-[#526415]">When everyone arrives</p><h2 className="mt-4 max-w-xl text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">The court view becomes the product.</h2></div><p className="max-w-xl text-base leading-7 text-[#66666c] lg:justify-self-end">Large scores, active teams, the paddle stack, and session standings share one glanceable surface. Score every point live or enter only the result—the night works either way.</p></div><div className="mt-12"><ProductShot src="/images/product/play.webp" alt="Relay Play showing two active pickleball courts, large scores, the paddle stack, rotation rule, and session standings" caption="Play with two active courts" mobileFocus="center" /></div><div className="mt-10 grid border-y border-[#deded9] sm:grid-cols-3"><div className="py-6 sm:pr-8"><h3 className="font-semibold">Paddle Stack</h3><p className="mt-2 text-sm leading-6 text-[#66666c]">Continuous open play with adaptive, four-off, or winners-stay rotation.</p></div><div className="border-t border-[#deded9] py-6 sm:border-l sm:border-t-0 sm:px-8"><h3 className="font-semibold">Mix It Up</h3><p className="mt-2 text-sm leading-6 text-[#66666c]">Social rounds that prioritize fair rests and reduce repeated partners.</p></div><div className="border-t border-[#deded9] py-6 sm:border-l sm:border-t-0 sm:pl-8"><h3 className="font-semibold">Court Climb</h3><p className="mt-2 text-sm leading-6 text-[#66666c]">Winners move toward Court 1, losers move down, and partners split.</p></div></div></div>
    </section>

    <section className="px-5 py-20 sm:px-8 sm:py-32">
      <div data-marketing-reveal="split-reverse" className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[1.25fr_.75fr] lg:gap-20"><div><ProductShot src="/images/product/chat.webp" alt="Relay session chat showing realtime sync, grouped messages, reactions, and a persistent photo and message composer" caption="Realtime conversation attached to the game" mobileFocus="center" /></div><div><p className="text-sm font-semibold text-[#526415]">Stay in sync</p><h2 className="mt-4 text-3xl font-[620] tracking-[-0.038em] sm:text-4xl">No separate thread to reconstruct later.</h2><p className="mt-5 max-w-md leading-7 text-[#66666c]">Session chat keeps arrival plans, parking tips, photos, reactions, and system updates beside the plan. Notifications pull out only the moments that need attention: invitations, waitlist movement, payment review, and court assignments.</p></div></div>
    </section>

    <section className="border-y border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-32">
      <div data-marketing-reveal="mask" className="mx-auto grid max-w-[1180px] overflow-hidden rounded-xl border border-[#d9d9d4] bg-[#f7f7f5] lg:grid-cols-[1.05fr_.95fr]"><div className="relative min-h-[360px] lg:min-h-[520px]"><Image src="/images/pickleball-friends.jpg" alt="Four friends playing doubles pickleball together" fill sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" /></div><div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12"><div><p className="text-sm font-semibold text-[#526415]">After the last point</p><h2 className="mt-4 text-3xl font-[620] tracking-[-0.038em] sm:text-4xl">The session becomes the memory.</h2><p className="mt-5 leading-7 text-[#66666c]">Players, scores, standings, photos, reactions, and comments remain together. Save the crew as a group, see shared history, or choose Play Again to reuse the venue and setup without copying RSVPs, payments, or results.</p></div><p className="mt-12 border-t border-[#d9d9d4] pt-5 text-sm font-semibold">Real participation, without turning recreation into a rating.</p></div></div>
    </section>

    <section id="everything" className="px-5 py-20 sm:px-8 sm:py-32">
      <div data-marketing-reveal="sequence" className="mx-auto max-w-[1180px]"><div className="max-w-2xl"><p className="text-sm font-semibold text-[#526415]">Everything inside</p><h2 className="mt-4 text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">A complete session, in six understandable parts.</h2><p className="mt-5 text-lg leading-8 text-[#66666c]">Advanced controls appear when the game needs them. The basic path stays create, share, join, and play.</p></div><div className="mt-14 border-t border-[#d9d9d4]">{capabilities.map(({ stage, title, items }, index) => <section key={stage} className="grid gap-5 border-b border-[#d9d9d4] py-7 md:grid-cols-[100px_1fr_1.2fr] md:gap-8"><p className="font-mono text-xs text-[#66666c]">0{index + 1} · {stage}</p><h3 className="max-w-sm font-semibold leading-6">{title}</h3><ul className="grid gap-x-6 gap-y-2 text-sm leading-6 text-[#66666c] sm:grid-cols-2">{items.map((item) => <li key={item}>— {item}</li>)}</ul></section>)}</div></div>
    </section>

    <section className="border-t border-[#deded9] bg-white px-5 py-24 text-center sm:px-8 sm:py-36"><div data-marketing-reveal="final" className="mx-auto max-w-3xl"><div className="mx-auto mb-7 grid h-10 w-10 place-items-center"><RelayMark className="h-8 w-8" /></div><h2 className="text-4xl font-[620] tracking-[-0.045em] sm:text-6xl">Make the next game easier for everyone.</h2><p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#66666c]">Create the session, send the link, and let Relay carry the details from the group chat to the court.</p><Link href={primaryHref} className={`${primaryAction} mt-9`}>{user ? "Open Relay" : "Create your account"}<ArrowRight aria-hidden size={16} /></Link></div></section>

    <footer className="border-t border-[#deded9] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[1180px] flex-col gap-5 text-sm text-[#66666c] sm:flex-row sm:items-center sm:justify-between"><Brand /><p>The shared home for pickleball with friends.</p><div className="flex gap-5"><a href="#product">Product</a><Link href={user ? "/home" : "/login"}>{user ? "Open app" : "Log in"}</Link></div></div></footer>
  </main>;
}
