import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/features/auth/auth-form";
import { signInWithGoogle } from "@/features/auth/actions";

const sessionPromises = [
  ["Invite", "Share one link. Guests can join by name."],
  ["Organize", "Keep the paddle stack, courts, and live score clear."],
  ["Settle", "Split costs and review payment proof."],
  ["Remember", "Save results, photos, and play again."],
] as const;

function SessionPromise() {
  return <dl className="divide-y divide-line border-y border-line">{sessionPromises.map(([term, detail], index) => <div key={term} className="grid grid-cols-[28px_76px_1fr] gap-3 py-3.5 text-sm"><span aria-hidden className="score text-xs text-primary">0{index + 1}</span><dt className="font-[680] text-ink">{term}</dt><dd className="leading-5 text-muted">{detail}</dd></div>)}</dl>;
}

function CourtMotionGraphic() {
  return <svg aria-hidden viewBox="0 0 520 300" className="pointer-events-none absolute -right-20 top-8 w-[390px] opacity-90 sm:right-0 lg:left-1/2 lg:top-[9%] lg:w-[86%] lg:-translate-x-1/2">
    <g fill="none" stroke="var(--line)"><path d="M85 38h350v224H85z" strokeWidth="2" /><path d="M260 38v224M85 150h350" strokeWidth="1.5" /><path d="M85 94h175M260 206h175" strokeWidth="1" /></g>
    <path d="M103 246C180 82 286 246 432 53" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6 9" opacity=".5" />
    <g><circle cx="353" cy="144" r="29" fill="var(--signal)" /><g fill="var(--ink)" opacity=".42"><circle cx="342" cy="132" r="2.7" /><circle cx="360" cy="128" r="2.7" /><circle cx="369" cy="145" r="2.7" /><circle cx="351" cy="151" r="2.7" /><circle cx="339" cy="155" r="2.7" /><circle cx="362" cy="162" r="2.7" /></g></g>
  </svg>;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; next?: string }> }) {
  const query = await searchParams;
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <main id="main-content" className="min-h-screen bg-surface lg:grid lg:grid-cols-[minmax(440px,.95fr)_minmax(500px,1.05fr)]">
      <section className="relative flex h-44 flex-col overflow-hidden border-b border-line bg-surface px-5 py-3 sm:h-52 sm:px-8 lg:h-auto lg:min-h-screen lg:border-b-0 lg:border-r lg:px-12 lg:py-8" aria-label="Relay introduction">
        <CourtMotionGraphic />
        <div className="relative z-10 flex w-full items-start justify-between"><Brand /><ThemeToggle /></div>
        <div className="relative z-10 mt-auto max-w-lg pb-2 lg:pb-6">
          <p className="sport-label mb-3 text-primary">Pickleball, organized</p>
          <h2 className="text-[1.65rem] font-[740] leading-[1.05] tracking-[-0.035em] sm:text-3xl lg:text-[3.5rem]">Make the plan.<br />Run the courts.</h2>
          <p className="mt-3 hidden max-w-md text-[17px] leading-7 text-muted lg:block">One calm place for the invite, the paddle stack, the score, and everything your crew needs next.</p>
          <div className="mt-8 hidden lg:block"><SessionPromise /></div>
        </div>
      </section>

      <section className="flex min-h-[calc(100svh-11rem)] items-start justify-center bg-surface px-5 py-8 sm:min-h-[calc(100svh-13rem)] sm:px-10 lg:min-h-screen lg:items-center lg:py-16">
        <div className="w-full max-w-[420px]">
          {query.error ? <p role="alert" className="mb-6 border-l-2 border-danger bg-danger/6 px-4 py-3 text-sm font-medium leading-5 text-danger">{query.error}</p> : null}
          {query.sent ? <p role="status" className="mb-6 border-l-2 border-primary bg-primary-soft px-4 py-3 text-sm font-medium text-primary">Check your email for your secure sign-in link.</p> : null}
          <AuthForm next={query.next} />
          <div className="mt-10 lg:hidden"><h2 className="mb-3 text-base font-[680]">Everything for game night</h2><SessionPromise /></div>
          {googleEnabled ? <><div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div><form action={signInWithGoogle}><Button variant="secondary" className="h-12 w-full">Continue with Google</Button></form></> : null}
          <p className="mt-8 border-t border-line pt-5 text-center text-xs leading-5 text-muted">Have an invite? Open its shared link to see the plan and RSVP without an account.</p>
        </div>
      </section>
    </main>
  );
}
