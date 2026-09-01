import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { changePassword } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireUser();
  const { error, success } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="border-b border-line pb-6">
        <p className="mb-3 text-sm">
          <Link href="/preferences" className="font-semibold text-primary hover:underline">
            Preferences
          </Link>
        </p>
        <h1 className="app-title">Change password</h1>
        <p className="mt-2 text-sm text-muted">Confirm your current password, then choose a new one.</p>
      </header>
      <div className="max-w-md py-8">
        {success ? (
          <Alert variant="success" className="mb-6">
            Your password has been changed.
          </Alert>
        ) : null}
        {error ? <Alert className="mb-6">{error}</Alert> : null}
        <form action={changePassword} className="space-y-5">
          <PasswordField
            id="current-password"
            name="currentPassword"
            label="Current password"
            autoComplete="current-password"
            required
            minLength={8}
          />
          <PasswordField
            id="new-password"
            name="password"
            label="New password"
            autoComplete="new-password"
            required
            minLength={8}
            hint={<p className="mt-2 text-xs text-muted">At least 8 characters, including a letter and number.</p>}
          />
          <PasswordField
            id="confirm-password"
            name="confirmation"
            label="Confirm new password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <SubmitButton type="submit" pendingLabel="Changing password…">
            Change password
          </SubmitButton>
        </form>
        <p className="mt-7 border-t border-line pt-5 text-sm leading-6 text-muted">
          Don’t know your current password?{" "}
          <Link href="/forgot-password" className="font-semibold text-ink hover:underline">
            Send yourself a reset link.
          </Link>
        </p>
      </div>
    </div>
  );
}
