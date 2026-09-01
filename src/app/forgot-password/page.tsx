import Link from "next/link";

import { Brand } from "@/components/shared/brand";
import { PasswordRecoveryForm } from "@/features/auth/password-recovery-form";

export const metadata = { title: "Reset your password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6 sm:justify-center sm:py-12"
    >
      <Brand />
      <div className="mt-16 sm:mt-10">
        <h1 className="text-2xl font-bold tracking-[-0.025em]">Reset your password</h1>
        <p className="mt-3 leading-7 text-muted">
          Enter the email used for Relay. We’ll send a secure link to choose a new password.
        </p>
        {error ? (
          <p role="alert" className="mt-6 rounded-lg bg-danger/8 px-3.5 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        {sent ? (
          <div className="mt-8 border-y border-line py-6">
            <p role="status" className="font-semibold">
              Check your email
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              If a Relay account exists for that address, a reset link is on its way. The link expires in one hour.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Return to login
              </Link>
              <Link href="/forgot-password" className="font-semibold text-ink hover:underline">
                Try another email
              </Link>
            </div>
          </div>
        ) : (
          <PasswordRecoveryForm />
        )}
      </div>
    </main>
  );
}
