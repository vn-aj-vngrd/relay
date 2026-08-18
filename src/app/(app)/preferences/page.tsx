import { requireUser } from "@/features/auth/session";
import { PreferenceControls } from "@/features/preferences/preference-controls";

export default async function PreferencesPage() {
  await requireUser();
  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="border-b border-line pb-6">
        <h1 className="app-title">Preferences</h1>
        <p className="mt-2 text-sm text-muted">Adjust how Relay looks and organizes your games.</p>
      </header>
      <div className="py-8">
        <PreferenceControls />
      </div>
    </div>
  );
}
