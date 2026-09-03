import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { Alert } from "@/components/ui/alert";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  updateRecoveredPassword,
  verifyRecoveryMfa,
} from "@/features/auth/actions";
import { PasswordMfaForm } from "@/features/auth/password-mfa-form";
import { getCurrentUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Choose a new password" };

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const [user, cookieStore, assurance] = await Promise.all([
    getCurrentUser(),
    cookies(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!user || cookieStore.get("relay_password_recovery")?.value !== "1")
    redirect("/forgot-password");
  const error = (await searchParams).error;
  const requiresMfa =
    !assurance.error &&
    assurance.data.currentLevel !== "aal2" &&
    assurance.data.nextLevel === "aal2";

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6 sm:justify-center sm:py-12"
    >
      <Brand />
      <div className="mt-16 sm:mt-10">
        <h1 className="text-2xl font-bold tracking-[-0.025em]">
          Choose a new password
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Use a password you haven’t used for Relay before.
        </p>
        {error ? <Alert className="mt-6">{error}</Alert> : null}
        {assurance.error ? (
          <Alert className="mt-6">
            Your account security could not be checked. Reload this page and try
            again.
          </Alert>
        ) : requiresMfa ? (
          <PasswordMfaForm
            action={verifyRecoveryMfa}
            description="The reset email confirmed your inbox. Enter your authenticator code to approve this password change."
          />
        ) : (
          <form
            noValidate
            action={updateRecoveredPassword}
            className="mt-8 space-y-5"
          >
            <PasswordField
              id="recovery-password"
              name="password"
              label="New password"
              autoComplete="new-password"
              required
              minLength={8}
              hint={
                <p className="mt-2 text-xs text-muted">
                  At least 8 characters, including a letter and number.
                </p>
              }
            />
            <PasswordField
              id="recovery-confirmation"
              name="confirmation"
              label="Confirm new password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <SubmitButton
              type="submit"
              className="h-12 w-full text-[15px]"
              pendingLabel="Updating password…"
            >
              Update password
            </SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
