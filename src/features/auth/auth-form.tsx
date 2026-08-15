"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createPasswordAccount, signInWithPassword } from "./actions";

type Mode = "signin" | "create";

function AuthSubmit({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const creating = mode === "create";
  return <Button className="h-12 w-full text-[15px]" disabled={pending} aria-disabled={pending}>{pending ? (creating ? "Creating account…" : "Signing in…") : (creating ? "Create account" : "Sign in")}</Button>;
}

export function AuthForm({ next = "/" }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const creating = mode === "create";

  return (
    <div>
      <div className="mb-8 grid grid-cols-2 border-b border-line" aria-label="Authentication method">
        <button type="button" onClick={() => setMode("signin")} aria-pressed={!creating} className={`pressable relative min-h-12 text-sm font-[650] ${!creating ? "text-ink after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary" : "text-muted hover:text-ink"}`}>Sign in</button>
        <button type="button" onClick={() => setMode("create")} aria-pressed={creating} className={`pressable relative min-h-12 text-sm font-[650] ${creating ? "text-ink after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary" : "text-muted hover:text-ink"}`}>Create account</button>
      </div>

      <div className="mb-7">
        <h1 className="text-[1.875rem] font-[720] leading-[1.15] tracking-[-0.03em] sm:text-[2rem]">{creating ? "Join your next game" : "Welcome back"}</h1>
        <p className="mt-2 max-w-sm text-[15px] leading-6 text-muted">{creating ? "Create an account to organize sessions and keep your game history." : "Sign in to see your games and court plans."}</p>
      </div>

      <form action={creating ? createPasswordAccount : signInWithPassword} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="password-email" className="text-sm font-[650]">Email</label>
          <input id="password-email" name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} required className="field" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-[650]">Password</label>
          <div className="relative">
            <input id="password" name="password" type={showPassword ? "text" : "password"} minLength={8} autoComplete={creating ? "new-password" : "current-password"} required className="field pr-12" />
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"} className="pressable absolute right-1 top-2 grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink">{showPassword ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}</button>
          </div>
          {creating ? <p className="mt-2 text-xs leading-5 text-muted">8 or more characters, including a letter and number.</p> : null}
        </div>
        <AuthSubmit mode={mode} />
      </form>
    </div>
  );
}
