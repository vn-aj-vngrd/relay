import { CalendarBlank, CurrencyCircleDollar, LinkSimple, TennisBall } from "@phosphor-icons/react/dist/ssr";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { signInWithGoogle } from "./actions";
import { AuthForm } from "./auth-form";

type EntryMode = "signin" | "create";

const features = [
  { label: "Plan the game", icon: CalendarBlank },
  { label: "Share one invite", icon: LinkSimple },
  { label: "Run the courts", icon: TennisBall },
  { label: "Split the cost", icon: CurrencyCircleDollar },
] as const;

export function AuthEntry({ mode, error, sent, next }: { mode: EntryMode; error?: string; sent?: string; next?: string }) {
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return <main id="main-content" className="min-h-screen bg-canvas">
    <header className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8"><Brand /><ThemeToggle /></header>
    <section className="flex min-h-[calc(100svh-4rem)] items-start justify-center px-5 pb-12 pt-6 sm:items-center sm:px-8 sm:pb-20 sm:pt-10">
      <div className="w-full max-w-[410px]">
        {error ? <p role="alert" className="mb-5 rounded-lg bg-danger/8 px-3.5 py-3 text-sm font-medium leading-5 text-danger ring-1 ring-danger/15">{error}</p> : null}
        {sent ? <p role="status" className="mb-5 rounded-lg bg-primary-soft px-3.5 py-3 text-sm font-medium text-primary">Check your email for your secure sign-in link.</p> : null}
        <AuthForm next={next} initialMode={mode} />
        {googleEnabled ? <><div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div><form action={signInWithGoogle}><SubmitButton variant="secondary" className="h-11 w-full" pendingLabel="Opening Google…">Continue with Google</SubmitButton></form></> : null}
        <p className="mt-6 text-xs leading-5 text-muted">Have an invite? Open its shared link to view the plan and RSVP without an account.</p>
        <section className="mt-8 border-t border-line pt-5" aria-label="What Relay helps with"><p className="text-xs font-semibold text-muted">Everything around game night</p><ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">{features.map(({ label, icon: Icon }) => <li key={label} className="flex items-center gap-2 text-xs font-medium text-ink"><Icon aria-hidden size={15} className="text-muted" />{label}</li>)}</ul></section>
      </div>
    </section>
  </main>;
}
