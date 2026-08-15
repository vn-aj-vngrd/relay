import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { createPasswordAccount, sendMagicLink, signInWithGoogle, signInWithPassword } from "@/features/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const query = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-surface px-4 py-10"><div className="w-full max-w-sm rounded-2xl border border-line bg-canvas p-6 sm:p-8"><Brand /><h1 className="mt-10 text-2xl font-bold tracking-[-0.03em]">Welcome to Relay</h1><p className="mt-2 text-sm text-muted">Get back to your games and crew.</p>
    {query.error ? <p role="alert" className="mt-5 rounded-[10px] bg-[oklch(.96_.035_25)] p-3 text-sm font-medium text-danger">{query.error}</p> : null}
    {query.sent ? <p role="status" className="mt-5 rounded-[10px] bg-primary-soft p-3 text-sm font-medium text-primary">{query.sent === "account" ? "Check your email to confirm your account." : "Check your email for your sign-in link."}</p> : null}
    <form action={sendMagicLink} className="mt-7 space-y-4"><div><label htmlFor="magic-email" className="text-sm font-semibold">Email</label><input id="magic-email" name="email" type="email" autoComplete="email" required className="mt-1.5 h-12 w-full rounded-[10px] border border-line bg-canvas px-3.5" placeholder="you@example.com" /></div><Button className="w-full">Email me a sign-in link</Button></form>
    <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
    <form action={signInWithGoogle}><Button variant="secondary" className="w-full">Continue with Google</Button></form>
    <details className="mt-5 border-t border-line pt-4"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Use a password instead</summary><form className="mt-3 space-y-3"><div><label htmlFor="password-email" className="text-sm font-semibold">Email</label><input id="password-email" name="email" type="email" autoComplete="email" required className="mt-1.5 h-12 w-full rounded-[10px] border border-line bg-canvas px-3.5" /></div><div><label htmlFor="password" className="text-sm font-semibold">Password</label><input id="password" name="password" type="password" minLength={8} autoComplete="current-password" required className="mt-1.5 h-12 w-full rounded-[10px] border border-line bg-canvas px-3.5" /></div><div className="grid grid-cols-2 gap-2"><Button formAction={signInWithPassword}>Sign in</Button><Button formAction={createPasswordAccount} variant="secondary">Create account</Button></div></form></details>
    <p className="mt-6 text-center text-xs leading-5 text-muted">Invited to a game? You don’t need an account to view or RSVP.</p></div></main>;
}
