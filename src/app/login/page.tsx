import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/features/auth/auth-form";
import { signInWithGoogle } from "@/features/auth/actions";

const sessionPromises = [
  ["One link", "Plan, cost, and guest RSVPs"],
  ["Live courts", "Queue, teams, and scores"],
  ["After the game", "Photos, results, and play again"],
] as const;

function SessionPromise({ inverse = false }: { inverse?: boolean }) {
  return <dl className={`divide-y border-y ${inverse ? "divide-white/12 border-white/12" : "divide-line border-line"}`}>{sessionPromises.map(([term, detail]) => <div key={term} className="grid grid-cols-[112px_1fr] gap-3 py-3 text-sm"><dt className={`font-[650] ${inverse ? "text-white" : "text-ink"}`}>{term}</dt><dd className={inverse ? "text-white/62" : "text-muted"}>{detail}</dd></div>)}</dl>;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; next?: string }> }) {
  const query = await searchParams;
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <main id="main-content" className="min-h-screen bg-surface lg:grid lg:grid-cols-[minmax(360px,0.84fr)_minmax(520px,1.16fr)]">
      <section className="court-panel relative flex h-36 flex-col overflow-hidden bg-court px-5 py-2 text-white sm:h-40 sm:px-8 sm:py-3 lg:h-auto lg:min-h-screen lg:flex-col lg:px-10 lg:py-8" aria-label="Relay introduction">
        <div className="relative z-10 flex w-full items-start justify-between">
          <Brand inverse />
          <ThemeToggle inverse />
        </div>
        <div className="relative z-10 mt-auto pb-3 lg:hidden">
          <p className="text-xl font-[700] tracking-[-0.02em]">One link for the whole game.</p>
          <p className="mt-1 text-sm text-white/62">Plan · courts · scores · memories</p>
        </div>
        <div className="relative z-10 mt-auto hidden max-w-md pb-5 lg:block">
          <p className="mb-5 flex items-center gap-2 text-sm font-[650] text-court-line"><span className="h-2 w-2 rounded-full bg-signal" />Your game night, in order</p>
          <h2 className="text-[3.25rem] font-[720] leading-[1.02] tracking-[-0.035em]">Make the plan.<br />Run the courts.</h2>
          <div className="mt-8"><SessionPromise inverse /></div>
        </div>
      </section>

      <section className="flex min-h-[calc(100svh-9rem)] items-start justify-center bg-surface px-5 py-8 sm:min-h-[calc(100svh-10rem)] sm:px-10 lg:min-h-screen lg:items-center lg:py-16">
        <div className="w-full max-w-[420px]">
          {query.error ? <p role="alert" className="mb-6 rounded-xl bg-danger/8 px-4 py-3 text-sm font-medium leading-5 text-danger ring-1 ring-danger/15">{query.error}</p> : null}
          {query.sent ? <p role="status" className="mb-6 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">Check your email for your secure sign-in link.</p> : null}
          <AuthForm next={query.next} />
          <div className="mt-9 lg:hidden"><h2 className="mb-3 text-base font-[680]">Everything for one game night</h2><SessionPromise /></div>
          {googleEnabled ? <><div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div><form action={signInWithGoogle}><Button variant="secondary" className="h-12 w-full">Continue with Google</Button></form></> : null}
          <p className="mt-8 border-t border-line pt-5 text-center text-xs leading-5 text-muted">Invited to a game? Open the shared link to view the plan and RSVP without an account.</p>
        </div>
      </section>
    </main>
  );
}
