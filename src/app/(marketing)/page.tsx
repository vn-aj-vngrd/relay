import type { Metadata } from "next";
import { ArrowRight, LinkSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { getCurrentUser } from "@/features/auth/session";
import { HeroProductPreview, InvitePreview, LivePreview, MemoryPreview, PaymentPreview } from "@/features/marketing/product-previews";

export const metadata: Metadata = {
  title: "Relay — One link for pickleball with friends",
  description: "Plan the game, invite friends, run the courts, split the cost, and keep the memory—all around one pickleball session.",
  openGraph: {
    title: "Relay — One link for the whole pickleball night",
    description: "Plan, invite, play, settle up, and remember the night.",
    type: "website",
  },
};

const principles = [
  ["The session is home", "The plan, roster, payments, courts, chat, and photos stay attached to one game."],
  ["Friends before rankings", "Made for recurring game nights—not ladders, leagues, or a public sports profile."],
  ["Useful at the court", "Big scores, a clear paddle stack, and fewer taps when everyone is ready to play."],
] as const;

const steps = [
  ["Create and share", "Set the time, venue, capacity, courts, and expected cost. Send one polished public link."],
  ["Run the courts", "See who is playing, resting, and up next. Keep scores live or add the result afterward."],
  ["Settle and remember", "Confirm the payment split, keep photos and results, then bring the setup back next week."],
] as const;

const primaryAction = "pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#171719] px-4 text-sm font-semibold text-white hover:bg-[#303034]";

export default async function MarketingPage() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/home" : "/signup";
  const primaryLabel = user ? "Open app" : "Sign up";

  return <main id="main-content" className="marketing-page min-h-screen bg-[#f7f7f5] text-[#171719]">
    <header className="sticky top-0 z-40 border-b border-[#e2e2dd] bg-[#f7f7f5]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav aria-label="Marketing navigation" className="hidden items-center gap-7 text-sm text-[#66666c] md:flex"><a href="#why-relay" className="hover:text-[#171719]">Why Relay</a><a href="#how-it-works" className="hover:text-[#171719]">How it works</a><a href="#inside" className="hover:text-[#171719]">Product</a></nav>
        <div className="flex items-center gap-1">{user ? null : <Link href="/login" className="pressable hidden min-h-11 items-center px-3 text-sm font-medium text-[#55555b] hover:text-[#171719] sm:inline-flex">Log in</Link>}<Link href={primaryHref} className={primaryAction}>{primaryLabel}</Link></div>
      </div>
    </header>

    <section className="overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
      <div className="mx-auto max-w-[1180px]">
        <div className="max-w-[850px]"><p className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#4f6510]"><span className="h-2 w-2 rounded-full bg-[#b7d62e]"/>Pickleball with friends, organized</p><h1 className="max-w-[820px] text-[clamp(3rem,7vw,5.75rem)] font-[650] leading-[.96] tracking-[-0.04em]">One link for the whole pickleball night.</h1><p className="mt-7 max-w-[640px] text-lg leading-8 text-[#626268] sm:text-xl">Relay keeps the plan, players, payment split, paddle stack, scores, and photos around one shared session. Less group-chat archaeology. More time on court.</p><div className="mt-8 flex flex-wrap gap-3"><Link href={primaryHref} className={`${primaryAction} min-h-12 px-5`}>{user ? "Open Relay" : "Create your first game"} <ArrowRight size={16}/></Link><a href="#how-it-works" className="pressable inline-flex min-h-12 items-center rounded-lg border border-[#d5d5cf] bg-white px-5 text-sm font-semibold hover:border-[#aaa9a3] hover:bg-[#f1f1ee]">See how it works</a></div></div>
        <div className="mt-16 sm:mt-20"><HeroProductPreview /></div>
      </div>
    </section>

    <section id="why-relay" className="border-y border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1180px]"><div className="grid gap-8 lg:grid-cols-[.92fr_1.08fr]"><h2 className="max-w-lg text-3xl font-[620] leading-tight tracking-[-0.035em] sm:text-5xl">A social sports app without turning play into a performance.</h2><p className="max-w-xl self-end text-base leading-7 text-[#66666c] sm:justify-self-end sm:text-lg">Relay is the capable friend who keeps the night moving. It helps everyone know the plan, take a fair turn, settle up, and do it again next week.</p></div><div className="mt-16 grid border-y border-[#deded9] md:grid-cols-3">{principles.map(([title, description], index) => <div key={title} className={`py-7 md:min-h-44 md:px-7 md:py-8 ${index ? "border-t border-[#deded9] md:border-l md:border-t-0" : ""}`}><h3 className="text-lg font-semibold">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[#66666c]">{description}</p></div>)}</div></div>
    </section>

    <section id="how-it-works" className="px-5 py-20 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1180px]"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><div><h2 className="max-w-xl text-3xl font-[620] tracking-[-0.035em] sm:text-5xl">From “Anyone free Saturday?” to game on.</h2><p className="mt-5 text-lg leading-8 text-[#66666c]">The familiar flow, with the loose ends handled.</p></div><ol className="border-y border-[#dcdcd7] lg:mt-1">{steps.map(([title, description], index) => <li key={title} className="grid grid-cols-[40px_1fr] gap-3 border-b border-[#dcdcd7] py-6 last:border-b-0 sm:grid-cols-[52px_180px_1fr]"><span className="font-mono text-xs text-[#66666c]">0{index + 1}</span><h3 className="font-semibold">{title}</h3><p className="col-start-2 max-w-lg text-sm leading-6 text-[#66666c] sm:col-start-3">{description}</p></li>)}</ol></div></div>
    </section>

    <section id="inside" className="border-t border-[#deded9] bg-white px-5 py-20 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1180px] space-y-28 sm:space-y-40">
        <div className="grid items-center gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20"><div><LinkSimple size={22} className="text-[#596f12]"/><h2 className="mt-7 text-3xl font-[620] tracking-[-0.035em] sm:text-4xl">An invite that answers everything.</h2><p className="mt-5 max-w-md leading-7 text-[#66666c]">Friends can see the time, venue, cost, open spots, host, and booking status before creating an account. Guest RSVP keeps the first yes simple.</p></div><InvitePreview /></div>
        <div className="grid items-center gap-12 lg:grid-cols-[1.22fr_.78fr] lg:gap-20"><div className="order-2 lg:order-1"><LivePreview/></div><div className="order-1 lg:order-2"><h2 className="text-3xl font-[620] tracking-[-0.035em] sm:text-4xl">Glanceable when the game is live.</h2><p className="mt-5 max-w-md leading-7 text-[#66666c]">Active courts come first. Scores read from a few feet away, and the queue makes the next rotation obvious without opening three menus.</p></div></div>
        <div className="grid items-center gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20"><div><h2 className="text-3xl font-[620] tracking-[-0.035em] sm:text-4xl">A payment split, not accounting software.</h2><p className="mt-5 max-w-md leading-7 text-[#66666c]">Share GCash, Maya, bank, or cash details. Players send one proof image, hosts confirm it, and everyone can see what is settled.</p></div><PaymentPreview /></div>
        <div className="grid items-center gap-12 lg:grid-cols-[1.22fr_.78fr] lg:gap-20"><div className="order-2 lg:order-1"><MemoryPreview/></div><div className="order-1 lg:order-2"><h2 className="text-3xl font-[620] tracking-[-0.035em] sm:text-4xl">The session becomes the memory.</h2><p className="mt-5 max-w-md leading-7 text-[#66666c]">Photos, results, players, and reactions live together—without creating another public feed. When the crew is ready, Play Again brings back the setup.</p></div></div>
      </div>
    </section>

    <section className="border-t border-[#deded9] px-5 py-24 text-center sm:px-8 sm:py-36"><div className="mx-auto max-w-3xl"><div className="mx-auto mb-7 h-9 w-9"><span className="block h-full w-full rounded-full border-[9px] border-[#171719] border-r-[#b7d62e]" aria-hidden/></div><h2 className="text-4xl font-[620] tracking-[-0.04em] sm:text-6xl">Make the next game the easy one.</h2><p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-[#66666c]">Create the session, send the link, and let Relay carry the plan from group chat to game night.</p><Link href={primaryHref} className={`${primaryAction} mt-9 min-h-12 px-5`}>{user ? "Open Relay" : "Create your account"} <ArrowRight size={16}/></Link></div></section>

    <footer className="border-t border-[#deded9] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[1180px] flex-col gap-5 text-sm text-[#66666c] sm:flex-row sm:items-center sm:justify-between"><Brand/><p>Friendly pickleball, clearly organized.</p><div className="flex gap-5"><a href="#why-relay">Why Relay</a><Link href={user ? "/home" : "/login"}>{user ? "Open app" : "Log in"}</Link></div></div></footer>
  </main>;
}
