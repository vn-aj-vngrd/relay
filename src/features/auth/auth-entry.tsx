"use client";

import { useSearchParams } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { SubmitButton } from "@/components/ui/submit-button";

import { signInWithGoogle } from "./actions";
import { AuthForm } from "./auth-form";

type EntryMode = "signin" | "create";

export function AuthEntry({ mode }: { mode: EntryMode }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? undefined;
  const sent = searchParams.get("sent") ?? undefined;
  const passwordUpdated = searchParams.get("password") === "updated";
  const next = searchParams.get("next") ?? undefined;
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-center px-5 sm:px-8">
        <Brand />
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8 sm:py-10">
        <div className="w-full max-w-[410px]">
          {error ? (
            <p
              role="alert"
              className="mb-5 rounded-lg bg-danger/8 px-3.5 py-3 text-sm font-medium leading-5 text-danger ring-1 ring-danger/15"
            >
              {error}
            </p>
          ) : null}
          {sent ? (
            <p role="status" className="mb-5 rounded-lg bg-primary-soft px-3.5 py-3 text-sm font-medium text-primary">
              Check your email for your secure sign-in link.
            </p>
          ) : null}
          {passwordUpdated ? (
            <p role="status" className="mb-5 rounded-lg bg-primary-soft px-3.5 py-3 text-sm font-medium text-primary">
              Your password was updated. Sign in with your new password.
            </p>
          ) : null}
          <AuthForm next={next} initialMode={mode} />
          {googleEnabled ? (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next ?? "/home"} />
                <SubmitButton variant="secondary" className="h-11 w-full" pendingLabel="Opening Google…">
                  Continue with Google
                </SubmitButton>
              </form>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export function AuthEntryFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-center px-5 sm:px-8">
        <Brand />
      </header>
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8 sm:py-10"
        aria-label="Loading account form"
      >
        <div className="h-[34.5rem] w-full max-w-[410px] animate-pulse rounded-xl bg-surface-strong motion-reduce:animate-none sm:h-[36rem]" />
      </main>
    </div>
  );
}
