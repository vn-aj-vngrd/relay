import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { SubmitButton } from "@/components/ui/submit-button";

export function PasswordMfaForm({
  action,
  description,
}: {
  action: (formData: FormData) => Promise<void>;
  description: string;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-start gap-3 border-y border-line py-5">
        <ShieldCheck
          aria-hidden
          size={24}
          className="mt-0.5 shrink-0 text-primary"
        />
        <div>
          <h2 className="font-semibold">Verify your authenticator</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
      <form noValidate action={action} className="mt-6 space-y-5">
        <div>
          <label htmlFor="password-mfa-code" className="text-sm font-semibold">
            Six-digit code
          </label>
          <input
            id="password-mfa-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className="field font-mono tabular-nums tracking-[0.18em]"
          />
          <p className="mt-2 text-xs text-muted">
            Use the current code from the authenticator linked to this account.
          </p>
        </div>
        <SubmitButton
          type="submit"
          className="h-12 w-full text-[15px]"
          pendingLabel="Verifying code…"
        >
          Verify and continue
        </SubmitButton>
      </form>
    </div>
  );
}
