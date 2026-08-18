import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

import { Brand } from "@/components/shared/brand";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/features/auth/actions";

export const metadata = { title: "Account unavailable" };

export default function AccountSuspendedPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-6 sm:justify-center sm:py-12"
    >
      <Brand />
      <div className="mt-20 sm:mt-12">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-warning/12 text-warning">
          <WarningCircle aria-hidden size={24} weight="fill" />
        </span>
        <h1 className="mt-5 text-2xl font-[700] tracking-[-0.025em]">This account is unavailable</h1>
        <p className="mt-3 max-w-md leading-7 text-muted">
          Relay has temporarily paused access to this account. If you think this is a mistake, contact the person who
          manages your Relay community.
        </p>
        <form action={signOut} className="mt-7">
          <SubmitButton type="submit" variant="secondary" pendingLabel="Signing out…">
            Sign out
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
