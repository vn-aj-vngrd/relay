import Link from "next/link";

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
          <p role="status" className="mb-6 rounded-lg bg-primary-soft px-3.5 py-3 text-sm font-medium text-primary">
            Your password has been changed.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mb-6 rounded-lg bg-danger/8 px-3.5 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        <form action={changePassword} className="space-y-5">
          <div>
            <label htmlFor="current-password" className="text-sm font-semibold">
              Current password
            </label>
            <input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="field"
            />
          </div>
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
              Confirm new password
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
