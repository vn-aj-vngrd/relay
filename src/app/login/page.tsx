import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { createPasswordAccount, sendMagicLink, signInWithGoogle, signInWithPassword } from "@/features/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const query = await searchParams;
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const magicLinkEnabled = process.env.NEXT_PUBLIC_MAGIC_LINK_ENABLED === "true";

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 ring-1 ring-line sm:p-8">
        <Brand />
        <h1 className="mt-10 text-2xl font-[720] tracking-[-0.02em]">Welcome to Relay</h1>
        <p className="mt-2 text-sm text-muted">Sign in or create an account to organize your games.</p>

        {query.error ? <p role="alert" className="mt-5 rounded-[10px] bg-[oklch(.96_.035_25)] p-3 text-sm font-medium text-danger">{query.error}</p> : null}
        {query.sent ? <p role="status" className="mt-5 rounded-[10px] bg-primary-soft p-3 text-sm font-medium text-primary">Check your email for your secure sign-in link.</p> : null}

        <form className="mt-7 space-y-4">
          <div>
            <label htmlFor="password-email" className="text-sm font-semibold">Email</label>
            <input id="password-email" name="email" type="email" autoComplete="email" spellCheck={false} required className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-semibold">Password</label>
            <input id="password" name="password" type="password" minLength={8} autoComplete="current-password" required className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5" />
            <p className="mt-1.5 text-xs text-muted">At least 8 characters with letters and numbers.</p>
          </div>
          <Button formAction={signInWithPassword} className="w-full">Sign in</Button>
          <Button formAction={createPasswordAccount} variant="secondary" className="w-full">Create account</Button>
        </form>

        {googleEnabled ? <><div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div><form action={signInWithGoogle}><Button variant="secondary" className="w-full">Continue with Google</Button></form></> : null}

        {magicLinkEnabled ? <details className="mt-5 border-t border-line pt-4"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Email me a sign-in link instead</summary><form action={sendMagicLink} className="mt-3 space-y-3"><label htmlFor="magic-email" className="sr-only">Email for sign-in link</label><input id="magic-email" name="email" type="email" autoComplete="email" spellCheck={false} required className="h-12 w-full rounded-xl border border-line bg-surface px-3.5" placeholder="you@example.com" /><Button className="w-full">Send secure link</Button></form></details> : null}

        <p className="mt-6 text-center text-xs leading-5 text-muted">Invited to a game? You don’t need an account to view or RSVP.</p>
      </div>
    </main>
  );
}
