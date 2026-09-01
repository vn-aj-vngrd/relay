import { redirect } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { setTemporaryPassword, verifyTemporaryPasswordMfa } from "@/features/auth/actions";
import { PasswordMfaForm } from "@/features/auth/password-mfa-form";
import { getCurrentUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Choose your password" };

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const [user, assurance] = await Promise.all([getCurrentUser(), supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);
  if (!user) redirect("/login?next=/set-password");
  if (user.app_metadata.force_password_change !== true) redirect("/home");
  const error = (await searchParams).error;
  const requiresMfa = !assurance.error && assurance.data.currentLevel !== "aal2" && assurance.data.nextLevel === "aal2";

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6 sm:justify-center sm:py-12"
    >
      <Brand />
      <div className="mt-16 sm:mt-10">
        <p className="text-sm font-semibold text-primary">Account created by your Relay admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.025em]">Choose your own password</h1>
        <p className="mt-3 leading-7 text-muted">
          Replace the temporary password before continuing. You’ll only need to do this once.
        </p>
        {error ? <Alert className="mt-6">{error}</Alert> : null}
        {assurance.error ? (
          <Alert className="mt-6">Your account security could not be checked. Reload this page and try again.</Alert>
        ) : requiresMfa ? (
          <PasswordMfaForm
            action={verifyTemporaryPasswordMfa}
            description="Enter your authenticator code before replacing the temporary password. Your existing authenticator stays connected."
          />
        ) : (
          <form action={setTemporaryPassword} className="mt-8 space-y-5">
            <div>
              <label htmlFor="new-password" className="text-sm font-semibold">
                New password
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="field"
              />
              <p className="mt-2 text-xs text-muted">At least 8 characters, including a letter and number.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="text-sm font-semibold">
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="field"
              />
            </div>
            <SubmitButton type="submit" className="w-full" pendingLabel="Saving password…">
              Save password and continue
            </SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
