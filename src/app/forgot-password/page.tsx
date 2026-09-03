import { cookies } from "next/headers";

import { Brand } from "@/components/shared/brand";
import { Alert } from "@/components/ui/alert";
import { EmailSentState } from "@/features/auth/email-sent-state";
import { PasswordRecoveryForm } from "@/features/auth/password-recovery-form";

export const metadata = { title: "Reset your password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const [{ error, sent }, cookieStore] = await Promise.all([
    searchParams,
    cookies(),
  ]);
  const recoveryEmail = cookieStore.get("relay_recovery_email")?.value;

  if (sent) {
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
              recoveryEmail ? (
                <>
                  Reset requested for{" "}
                  <span className="break-all text-ink">{recoveryEmail}</span>
                </>
              ) : (
                "Password reset requested"
              )
            }
            title="Check your inbox"
            description="If a Relay account exists for that address, open the secure link to choose a new password. The link expires in one hour."
            primary={{ href: "/login", label: "Return to sign in" }}
            secondary={{
              prefix: "Wrong email?",
              href: "/forgot-password",
              label: "Send another link",
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6 sm:justify-center sm:py-12"
    >
      <Brand />
      <div className="mt-16 sm:mt-10">
        <h1 className="text-2xl font-bold tracking-[-0.025em]">
          Reset your password
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Enter the email used for Relay. We’ll send a secure link to choose a
          new password.
        </p>
        {error ? <Alert className="mt-6">{error}</Alert> : null}
        <PasswordRecoveryForm />
      </div>
    </main>
  );
}
