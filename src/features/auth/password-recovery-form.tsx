"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

import { requestPasswordResetState } from "./actions";

export function PasswordRecoveryForm() {
  const [state, action] = useActionState(requestPasswordResetState, {});
  const [email, setEmail] = useState("");
  const [editedAfterError, setEditedAfterError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [submittedCaptcha, setSubmittedCaptcha] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(undefined);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const emailError = editedAfterError ? undefined : state.fieldErrors?.email;
  const visibleError =
    state.error && !editedAfterError ? state.error : undefined;
  const captchaNeedsRefresh =
    state.refreshCaptcha && submittedCaptcha === captchaToken;

  useEffect(() => {
    if (!state.refreshCaptcha) return;
    turnstileRef.current?.reset();
  }, [state]);

  return (
    <>
      {!turnstileSiteKey ? (
        <Alert className="mt-8">
          Password recovery is temporarily unavailable while the security check
          is being configured.
        </Alert>
      ) : null}
      {visibleError ? <Alert className="mt-8">{visibleError}</Alert> : null}
      <form
        noValidate
        action={action}
        onSubmitCapture={() => {
          setEditedAfterError(false);
          setSubmittedCaptcha(captchaToken);
        }}
        className={`${turnstileSiteKey || visibleError ? "mt-5" : "mt-8"} space-y-5`}
      >
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
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setEditedAfterError(true);
            }}
            required
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "recovery-email-error" : undefined}
            className="field"
            placeholder="you@example.com"
          />
          {emailError?.[0] ? (
            <p
              id="recovery-email-error"
              role="alert"
              className="mt-1.5 text-sm font-medium text-danger"
            >
              {emailError[0]}
            </p>
          ) : null}
        </div>
        {turnstileSiteKey ? (
          <div
            role="group"
            className="min-h-[65px] overflow-hidden"
            aria-label="Password reset security check"
          >
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              options={{
                size: "flexible",
                theme: "auto",
                appearance: "always",
                refreshExpired: "auto",
                refreshTimeout: "auto",
              }}
              onSuccess={setCaptchaToken}
              onBeforeInteractive={() => setCaptchaToken("")}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
            />
          </div>
        ) : null}
        <SubmitButton
          type="submit"
          className="h-12 w-full text-[15px]"
          pendingLabel="Sending reset link…"
          disabled={!turnstileSiteKey || !captchaToken || captchaNeedsRefresh}
        >
          Send reset link
        </SubmitButton>
        <p className="text-center text-sm text-muted">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-semibold text-ink underline-offset-2 hover:underline"
          >
            Return to login
          </Link>
        </p>
      </form>
    </>
  );
}
