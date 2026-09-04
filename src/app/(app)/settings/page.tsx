import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { NotificationSettingsForm } from "@/features/notifications/notification-settings-form";
import { getNotificationSettings } from "@/features/notifications/settings";
import { PreferenceControls } from "@/features/preferences/preference-controls";
import {
  type SettingsSection,
  SettingsTabs,
} from "@/features/preferences/settings-tabs";
import { InstallAppControl } from "@/features/pwa/install-app-control";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const section: SettingsSection =
    query.section === "appearance" ||
    query.section === "games" ||
    query.section === "notifications"
      ? query.section
      : "account";
  const notificationSettings =
    section === "notifications" ? await getNotificationSettings(user.id) : null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="pb-5">
        <h1 className="app-title">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Manage your account and choose how Relay looks, organizes your games,
          and keeps you informed.
        </p>
      </header>
      <SettingsTabs active={section} />
      <div className="py-8">
        {section === "appearance" ? (
          <div className="space-y-9">
            <PreferenceControls section="appearance" />
            <InstallAppControl />
          </div>
        ) : section === "games" ? (
          <PreferenceControls section="games" />
        ) : section === "notifications" && notificationSettings ? (
          <NotificationSettingsForm
            preferences={notificationSettings.preferences}
            devices={notificationSettings.devices}
          />
        ) : (
          <section aria-labelledby="account-settings-title">
            <h2 id="account-settings-title" className="text-lg font-semibold">
              Account
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Keep your Relay sign-in secure by changing your password when
              needed.
            </p>
            <ButtonLink
              href="/settings/password"
              variant="secondary"
              className="mt-4"
            >
              Change password
            </ButtonLink>
          </section>
        )}
      </div>
    </div>
  );
}
