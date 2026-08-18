import { redirect } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { SubmitButton } from "@/components/ui/submit-button";
import { setTemporaryPassword } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";

export const metadata = { title: "Choose your password" };

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/set-password");
  if (user.app_metadata.force_password_change !== true) redirect("/home");
  const error = (await searchParams).error;

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
          {error ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}
          <SubmitButton type="submit" className="w-full" pendingLabel="Saving password…">
            Save password and continue
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
