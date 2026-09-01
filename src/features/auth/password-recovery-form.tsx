"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";

import { requestPasswordReset } from "./actions";

export function PasswordRecoveryForm() {
  const [captchaReady, setCaptchaReady] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  return (
    <form action={requestPasswordReset} className="mt-8 space-y-5">
      <div>
        <label htmlFor="recovery-email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          required
          className="field"
          placeholder="you@example.com"
        />
      </div>
      {turnstileSiteKey ? (
        <div role="group" className="min-h-[65px] overflow-hidden" aria-label="Password reset security check">
          <Turnstile
            siteKey={turnstileSiteKey}
            options={{ size: "flexible", theme: "auto" }}
            onSuccess={() => setCaptchaReady(true)}
            onExpire={() => setCaptchaReady(false)}
            onError={() => setCaptchaReady(false)}
          />
        </div>
      ) : (
        <p role="alert" className="text-sm leading-5 text-danger">
          Password recovery is temporarily unavailable while the security check is being configured.
        </p>
      )}
      <SubmitButton
        type="submit"
        className="h-12 w-full text-[15px]"
        pendingLabel="Sending reset link…"
        disabled={!turnstileSiteKey || !captchaReady}
      >
        Send reset link
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
          Return to login
        </Link>
      </p>
    </form>
  );
}
