"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/shared/brand";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

import { signInWithGoogle } from "./actions";
import { AuthForm } from "./auth-form";
import { EmailSentState } from "./email-sent-state";

type EntryMode = "signin" | "create";

export function AuthEntry({
  mode,
  confirmationEmail,
}: {
  mode: EntryMode;
  confirmationEmail?: string;
}) {
  const searchParams = useSearchParams();
  const [activeMode, setActiveMode] = useState(mode);
  const error = searchParams.get("error") ?? undefined;
  const sent = searchParams.get("sent") ?? undefined;
  const passwordUpdated = searchParams.get("password") === "updated";
  const next = searchParams.get("next") ?? undefined;
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  if (sent === "account") {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <header className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-center px-5 sm:px-8">
          <Brand />
        </header>
        <main
          id="main-content"
          className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-12"
        >
          <EmailSentState
            label={
              confirmationEmail ? (
                <>
                  Confirmation sent to{" "}
                  <span className="break-all text-ink">
                    {confirmationEmail}
                  </span>
                </>
              ) : (
                "Confirmation email sent"
              )
            }
            title="Check your inbox"
            description="Open the confirmation link we sent to finish creating your Relay account. The link expires in one hour."
            primary={{ href: "/login", label: "Return to sign in" }}
            secondary={{
              prefix: "Used a different email?",
              href: "/signup",
              label: "Create another account",
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-center px-5 sm:px-8">
        <Brand />
      </header>
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8 sm:py-10"
      >
        <div className="w-full max-w-[410px]">
          {error ? <Alert className="mb-5">{error}</Alert> : null}
          {sent ? (
            <Alert variant="info" className="mb-5">
              Check your email for your secure sign-in link.
            </Alert>
          ) : null}
          {passwordUpdated ? (
            <Alert variant="success" className="mb-5">
              Your password was updated. Sign in with your new password.
            </Alert>
          ) : null}
          <AuthForm
            next={next}
            initialMode={mode}
            onModeChange={setActiveMode}
          />
          {googleEnabled ? (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
              <form noValidate action={signInWithGoogle}>
                <input type="hidden" name="next" value={next ?? "/home"} />
                <SubmitButton
                  variant="secondary"
                  className="h-11 w-full"
                  pendingLabel="Opening Google…"
                >
                  <Image
                    src="/google-g.svg"
                    alt=""
                    aria-hidden
                    width={18}
                    height={18}
                  />
                  Continue with Google{" "}
                  <span className="rounded-full bg-surface-strong px-1.5 py-0.5 text-[10px] font-bold leading-none text-ink">
                    Beta
                  </span>
                </SubmitButton>
              </form>
            </>
          ) : null}
          <p className="mt-5 text-center text-xs leading-5 text-muted">
            {activeMode === "create"
              ? "By creating an account"
              : "By signing in"}
            , you agree to the{" "}
            <Link
              href="/terms"
              className="font-semibold text-ink underline-offset-2 hover:underline"
            >
              Terms
            </Link>{" "}
            and acknowledge the{" "}
            <Link
              href="/privacy"
              className="font-semibold text-ink underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
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
