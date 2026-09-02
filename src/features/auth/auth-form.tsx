"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

import { createPasswordAccountState, signInWithPasswordState } from "./actions";

type Mode = "signin" | "create";

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.[0] ? (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger">
      {errors[0]}
    </p>
  ) : null;
}

function AuthSubmit({ mode, blocked = false }: { mode: Mode; blocked?: boolean }) {
  const { pending } = useFormStatus();
  const creating = mode === "create";
  return (
    <Button className="h-12 w-full text-[15px]" disabled={pending || blocked} aria-disabled={pending || blocked}>
      {pending ? (
        <>
          <ButtonSpinner />
          {creating ? "Creating account…" : "Signing in…"}
        </>
      ) : creating ? (
        "Create account"
      ) : (
        "Sign in"
      )}
    </Button>
  );
}

export function AuthForm({
  next = "/home",
  initialMode = "signin",
  onModeChange,
}: {
  next?: string;
  initialMode?: Mode;
  onModeChange?: (mode: Mode) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [signInPassword, setSignInPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [signInState, signInAction] = useActionState(signInWithPasswordState, {});
  const [createState, createAction] = useActionState(createPasswordAccountState, {});
  const turnstileRef = useRef<TurnstileInstance>(undefined);
  const creating = mode === "create";
  const activeState = creating ? createState : signInState;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const modeHref = (path: "/login" | "/signup") =>
    next && next !== "/home" ? `${path}?next=${encodeURIComponent(next)}` : path;

  useEffect(() => {
    if (!activeState.error) return;
    turnstileRef.current?.reset();
  }, [activeState.error]);

  return (
    <div>
      <div
        role="group"
        className="mb-3 grid grid-cols-2 rounded-lg bg-surface-strong p-1 sm:mb-7"
        aria-label="Authentication method"
      >
        <Link
          href={modeHref("/login")}
          onClick={() => {
            setMode("signin");
            onModeChange?.("signin");
          }}
          aria-current={!creating ? "page" : undefined}
          className={`pressable grid min-h-9 place-items-center rounded-md text-[13px] font-medium ${!creating ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"}`}
        >
          Sign in
        </Link>
        <Link
          href={modeHref("/signup")}
          onClick={() => {
            setMode("create");
            onModeChange?.("create");
          }}
          aria-current={creating ? "page" : undefined}
          className={`pressable grid min-h-9 place-items-center rounded-md text-[13px] font-medium ${creating ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"}`}
        >
          Create account
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-[1.625rem] font-[650] leading-[1.2] tracking-[-0.02em]">
          {creating ? "Create your account" : "Log in to Relay"}
        </h1>
        <p className="mt-2 max-w-sm text-[15px] leading-6 text-muted">
          {creating ? "Plan games, invite players, and keep your scores." : "See your games, groups, and court plans."}
        </p>
      </div>

      {!turnstileSiteKey ? (
        <Alert className="mb-5">
          {creating ? "Account creation" : "Sign in"} is temporarily unavailable while the security check is being
          configured.
        </Alert>
      ) : null}

      {activeState.error ? <Alert className="mb-5">{activeState.error}</Alert> : null}

      <form noValidate action={creating ? createAction : signInAction} className="space-y-4 sm:space-y-5">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="password-email" className="text-sm font-[650]">
            Email
          </label>
          <input
            id="password-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            required
            aria-invalid={Boolean(activeState.fieldErrors?.email)}
            aria-describedby={activeState.fieldErrors?.email ? "password-email-error" : undefined}
            className="field"
            placeholder="you@example.com"
          />
          <FieldError id="password-email-error" errors={activeState.fieldErrors?.email} />
        </div>
        <PasswordField
          id="password"
          name="password"
          label="Password"
          minLength={creating ? 8 : undefined}
          autoComplete={creating ? "new-password" : "current-password"}
          value={creating ? newPassword : signInPassword}
          onChange={(event) => (creating ? setNewPassword(event.target.value) : setSignInPassword(event.target.value))}
          required
          aria-invalid={Boolean(activeState.fieldErrors?.password)}
          aria-describedby={activeState.fieldErrors?.password ? "password-error" : undefined}
          labelClassName="font-[650]"
          hint={
            creating ? (
              <p className="mt-2 text-xs leading-5 text-muted">8 or more characters, including a letter and number.</p>
            ) : (
              <p className="mt-2 text-right text-sm">
                <Link href="/forgot-password" className="font-semibold text-primary underline-offset-2 hover:underline">
                  Forgot password?
                </Link>
              </p>
            )
          }
        />
        <FieldError id="password-error" errors={activeState.fieldErrors?.password} />
        {creating ? (
          <PasswordField
            id="password-confirmation"
            name="confirmation"
            label="Confirm password"
            minLength={8}
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
            aria-invalid={Boolean(createState.fieldErrors?.confirmation)}
            aria-describedby={createState.fieldErrors?.confirmation ? "password-confirmation-error" : undefined}
            labelClassName="font-[650]"
            hint={<FieldError id="password-confirmation-error" errors={createState.fieldErrors?.confirmation} />}
          />
        ) : null}
        {turnstileSiteKey ? (
          <div
            role="group"
            className="min-h-[65px] overflow-hidden"
            aria-label={creating ? "Signup security check" : "Sign-in security check"}
          >
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              options={{ size: "flexible", theme: "auto" }}
              onSuccess={() => setCaptchaReady(true)}
              onBeforeInteractive={() => setCaptchaReady(false)}
              onExpire={() => setCaptchaReady(false)}
              onError={() => setCaptchaReady(false)}
            />
          </div>
        ) : null}
        <AuthSubmit mode={mode} blocked={!turnstileSiteKey || !captchaReady} />
      </form>
    </div>
  );
}
