"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { createPasswordAccount, signInWithPassword } from "./actions";

type Mode = "signin" | "create";

function AuthSubmit({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const creating = mode === "create";
  return <Button className="h-12 w-full text-[15px]" disabled={pending} aria-disabled={pending}>{pending ? <><ButtonSpinner />{creating ? "Creating account…" : "Signing in…"}</> : (creating ? "Create account" : "Sign in")}</Button>;
}

export function AuthForm({ next = "/home", initialMode = "signin" }: { next?: string; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const creating = mode === "create";

  return (
    <div>
      <div role="group" className="mb-5 grid grid-cols-2 rounded-lg bg-surface-strong p-1 sm:mb-7" aria-label="Authentication method">
        <button type="button" onClick={() => setMode("signin")} aria-pressed={!creating} className={`pressable min-h-9 rounded-md text-[13px] font-medium ${!creating ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"}`}>Sign in</button>
        <button type="button" onClick={() => setMode("create")} aria-pressed={creating} className={`pressable min-h-9 rounded-md text-[13px] font-medium ${creating ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"}`}>Create account</button>
      </div>

      <div className="mb-6">
        <h1 className="text-[1.625rem] font-[650] leading-[1.2] tracking-[-0.02em]">{creating ? "Join your next game" : "Welcome back"}</h1>
        <p className="mt-2 max-w-sm text-[15px] leading-6 text-muted">{creating ? "Create an account to organize sessions and keep your game history." : "Sign in to see your games and court plans."}</p>
      </div>

      <form action={creating ? createPasswordAccount : signInWithPassword} className="space-y-4 sm:space-y-5">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="password-email" className="text-sm font-[650]">Email</label>
          <input id="password-email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} required className="field" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-[650]">Password</label>
          <div className="relative">
            <input id="password" name="password" type={showPassword ? "text" : "password"} minLength={8} autoComplete={creating ? "new-password" : "current-password"} required className="field pr-12" />
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"} className="pressable absolute right-1 top-2 grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink">{showPassword ? <EyeSlash aria-hidden size={18} /> : <Eye aria-hidden size={18} />}</button>
          </div>
          {creating ? <p className="mt-2 text-xs leading-5 text-muted">8 or more characters, including a letter and number.</p> : null}
        </div>
        <AuthSubmit mode={mode} />
      </form>
    </div>
  );
}
