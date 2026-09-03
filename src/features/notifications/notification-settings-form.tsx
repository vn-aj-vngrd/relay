"use client";

import { useActionState } from "react";

import { PendingSubmit } from "@/components/ui/pending-submit";
import { SubmitButton } from "@/components/ui/submit-button";
import type { NotificationCategoryPreferences } from "@/db/schema";

import {
  channelSupportsCategory,
  notificationCategories,
  notificationCategoryLabels,
} from "./preferences";
import { PushDeviceControl } from "./push-device-control";
import { removePushDevice, saveNotificationSettings } from "./settings-actions";

type Preferences = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailCategories: NotificationCategoryPreferences;
  pushCategories: NotificationCategoryPreferences;
  dayBeforeReminder: boolean;
  hourBeforeReminder: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timeZone: string;
};

function Toggle({
  name,
  defaultChecked,
  label,
  disabled = false,
  accessibleLabel,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  disabled?: boolean;
  accessibleLabel?: string;
}) {
  return (
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium">
      <input
        name={name}
        type="checkbox"
        defaultChecked={disabled ? false : defaultChecked}
        disabled={disabled}
        aria-label={accessibleLabel}
        className="h-4 w-4 accent-primary disabled:opacity-40"
      />
      {label}
    </label>
  );
}

export function NotificationSettingsForm({
  preferences,
  devices = [],
}: {
  preferences: Preferences;
  devices?: { id: string; deviceLabel: string | null; lastUsedAt: Date }[];
}) {
  const [state, action] = useActionState(saveNotificationSettings, {});
  return (
    <section
      id="notifications"
      aria-labelledby="notification-settings-title"
      className="scroll-mt-6"
    >
      <h2 id="notification-settings-title" className="text-lg font-semibold">
        Notifications
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        In-app activity remains available in Relay. Choose what may also reach
        your email or this device.
      </p>
      <form noValidate action={action} className="mt-5 space-y-7">
        <div className="divide-y divide-line border-y border-line">
          <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:items-center">
            <div>
              <p className="text-sm font-semibold">Delivery channels</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Both are off until you choose and save them.
              </p>
            </div>
            <Toggle
              name="emailEnabled"
              defaultChecked={preferences.emailEnabled}
              label="Email"
              accessibleLabel="Enable email delivery"
            />
            <Toggle
              name="pushEnabled"
              defaultChecked={preferences.pushEnabled}
              label="Push"
              accessibleLabel="Enable push delivery"
            />
          </div>
          {notificationCategories.map((category) => {
            const copy = notificationCategoryLabels[category];
            return (
              <div
                key={category}
                className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:items-center"
              >
                <div>
                  <p className="text-sm font-medium">{copy.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted">
                    {copy.description}
                  </p>
                </div>
                <Toggle
                  name={`email-${category}`}
                  defaultChecked={preferences.emailCategories[category]}
                  label={
                    channelSupportsCategory("email", category)
                      ? "Email"
                      : "Not emailed"
                  }
                  disabled={!channelSupportsCategory("email", category)}
                  accessibleLabel={`Email for ${copy.label}`}
                />
                <Toggle
                  name={`push-${category}`}
                  defaultChecked={preferences.pushCategories[category]}
                  label="Push"
                  accessibleLabel={`Push for ${copy.label}`}
                />
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="text-sm font-semibold">Reminder timing</h3>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-3">
            <Toggle
              name="dayBeforeReminder"
              defaultChecked={preferences.dayBeforeReminder}
              label="Day before"
            />
            <Toggle
              name="hourBeforeReminder"
              defaultChecked={preferences.hourBeforeReminder}
              label="One hour before"
            />
          </div>
        </div>

        <details className="group border-y border-line py-3">
          <summary className="cursor-pointer text-sm font-semibold">
            Quiet hours and time zone
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Quiet from
              <input
                name="quietHoursStart"
                type="time"
                defaultValue={preferences.quietHoursStart?.slice(0, 5) ?? ""}
                className="field mt-1.5"
              />
            </label>
            <label className="text-sm font-medium">
              Quiet until
              <input
                name="quietHoursEnd"
                type="time"
                defaultValue={preferences.quietHoursEnd?.slice(0, 5) ?? ""}
                className="field mt-1.5"
              />
            </label>
            <label className="text-sm font-medium">
              Time zone
              <input
                name="timeZone"
                list="relay-time-zones"
                defaultValue={preferences.timeZone}
                className="field mt-1.5"
              />
              <datalist id="relay-time-zones">
                <option value="Asia/Manila" />
                <option value="Asia/Singapore" />
                <option value="Asia/Tokyo" />
                <option value="Australia/Sydney" />
                <option value="America/Los_Angeles" />
                <option value="America/New_York" />
                <option value="Europe/London" />
              </datalist>
            </label>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            Push waits until quiet hours end. Time-sensitive email reminders are
            suppressed during quiet hours.
          </p>
        </details>

        {state.error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : state.success ? (
          <p role="status" className="text-sm font-medium text-primary">
            {state.success}
          </p>
        ) : null}
        <SubmitButton pendingLabel="Saving preferences…">
          Save notification preferences
        </SubmitButton>
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-semibold">This device</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          Browser permission is requested only after you choose Enable.
        </p>
        <div className="mt-3">
          <PushDeviceControl />
        </div>
        {devices.length ? (
          <div className="mt-5 divide-y divide-line border-y border-line">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex min-h-14 items-center justify-between gap-4 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {device.deviceLabel ?? "Web browser"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Used{" "}
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeZone: preferences.timeZone,
                    }).format(device.lastUsedAt)}
                  </p>
                </div>
                <form noValidate action={removePushDevice}>
                  <input type="hidden" name="deviceId" value={device.id} />
                  <PendingSubmit
                    pendingLabel="Removing…"
                    className="pressable inline-flex min-h-9 items-center rounded-lg px-2.5 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-danger"
                  >
                    Remove
                  </PendingSubmit>
                </form>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
