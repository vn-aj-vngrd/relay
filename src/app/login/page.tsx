import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/features/auth/auth-form";
import { LoginShowcase } from "@/features/auth/login-showcase";
import { signInWithGoogle } from "@/features/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; next?: string }> }) {
  const query = await searchParams;
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return <main id="main-content" className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(360px,.88fr)_minmax(500px,1.12fr)]">
    <section className="flex min-h-40 flex-col border-b border-line px-5 py-3 sm:px-8 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-8" aria-label="Relay introduction">
      <div className="flex items-start justify-between"><Brand /><ThemeToggle /></div>
      <div className="mt-4 w-full max-w-md pb-3 lg:mt-auto lg:pb-4"><h2 className="text-[1.55rem] font-[650] leading-tight tracking-[-0.025em] lg:text-[2.25rem]">Built for friendly game nights.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted lg:text-[15px]">Keep the plan, players, courts, scores, and payment split together. No leagues, ladders, or ratings.</p><LoginShowcase /></div>
    </section>

    <section className="flex min-h-[calc(100svh-10rem)] items-start justify-center bg-surface px-5 py-8 sm:px-10 lg:min-h-screen lg:items-center lg:py-16"><div className="w-full max-w-[390px]">
      {query.error ? <p role="alert" className="mb-5 rounded-lg bg-danger/8 px-3.5 py-3 text-sm font-medium leading-5 text-danger ring-1 ring-danger/15">{query.error}</p> : null}
      {query.sent ? <p role="status" className="mb-5 rounded-lg bg-primary-soft px-3.5 py-3 text-sm font-medium text-primary">Check your email for your secure sign-in link.</p> : null}
      <AuthForm next={query.next} />
      {googleEnabled ? <><div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div><form action={signInWithGoogle}><Button variant="secondary" className="h-11 w-full">Continue with Google</Button></form></> : null}
      <p className="mt-6 text-xs leading-5 text-muted">Have an invite? Open its shared link to view the plan and RSVP without an account.</p>
    </div></section>
  </main>;
}
