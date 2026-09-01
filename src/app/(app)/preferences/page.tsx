import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { PreferenceControls } from "@/features/preferences/preference-controls";
import { InstallAppControl } from "@/features/pwa/install-app-control";

export default async function PreferencesPage() {
  await requireUser();
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="border-b border-line pb-6">
        <h1 className="app-title">Preferences</h1>
        <p className="mt-2 text-sm text-muted">Adjust how Relay looks and organizes your games.</p>
      </header>
      <div className="space-y-9 py-8">
        <PreferenceControls />
        <section aria-labelledby="account-preferences-title" className="border-t border-line pt-8">
          <h2 id="account-preferences-title" className="text-lg font-semibold">
            Account
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Keep your Relay sign-in secure by changing your password when needed.
          </p>
          <ButtonLink href="/preferences/password" variant="secondary" className="mt-4">
            Change password
          </ButtonLink>
        </section>
        <InstallAppControl />
      </div>
    </div>
  );
}
