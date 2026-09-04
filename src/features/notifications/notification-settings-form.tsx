"use client";

import { useActionState, useState } from "react";

import { TimePickerField } from "@/components/ui/date-time-picker";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { NotificationCategoryPreferences } from "@/db/schema";

import {
  channelSupportsCategory,
  notificationCategories,
  notificationCategoryLabels,
} from "./preferences";
import { PushDeviceControl } from "./push-device-control";
import { removePushDevice, saveNotificationSettings } from "./settings-actions";

const commonTimeZones = [
  { value: "Asia/Manila", label: "Philippine Time (Asia/Manila)" },
  { value: "Asia/Singapore", label: "Singapore Time (Asia/Singapore)" },
  { value: "Asia/Tokyo", label: "Japan Time (Asia/Tokyo)" },
  { value: "Australia/Sydney", label: "Sydney (Australia/Sydney)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "Europe/London", label: "London (Europe/London)" },
] as const;

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
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    Boolean(preferences.quietHoursStart && preferences.quietHoursEnd)
  );
  const timeZoneOptions = commonTimeZones.some(
    (option) => option.value === preferences.timeZone
  )
    ? commonTimeZones
    : [
        ...commonTimeZones,
        { value: preferences.timeZone, label: preferences.timeZone },
      ];

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

        <section aria-labelledby="quiet-hours-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 id="quiet-hours-title" className="text-sm font-semibold">
                Quiet hours
              </h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-muted">
                Pause push notifications and time-sensitive email reminders
                during a daily window.
              </p>
            </div>
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                name="quietHoursEnabled"
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(event) =>
                  setQuietHoursEnabled(event.currentTarget.checked)
                }
                className="h-4 w-4 accent-primary"
              />
              Use quiet hours
            </label>
          </div>
          <div className="mt-3 grid gap-4 border-y border-line py-4 sm:grid-cols-3">
            <TimePickerField
              id="quiet-hours-start"
              name="quietHoursStart"
              label="Quiet from"
              defaultValue={preferences.quietHoursStart?.slice(0, 5) ?? "22:00"}
              disabled={!quietHoursEnabled}
            />
            <TimePickerField
              id="quiet-hours-end"
              name="quietHoursEnd"
              label="Quiet until"
              defaultValue={preferences.quietHoursEnd?.slice(0, 5) ?? "07:00"}
              disabled={!quietHoursEnabled}
            />
            <SelectField
              id="notification-time-zone"
              name="timeZone"
              label="Time zone"
              options={timeZoneOptions}
              defaultValue={preferences.timeZone}
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            Quiet hours repeat every day in your selected time zone.
          </p>
        </section>

        {state.error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : state.success ? (
          <p role="status" className="text-sm font-medium text-primary">
            {state.success}
          </p>
        ) : null}
        <SubmitButton pendingLabel="Saving settings…">
          Save notification settings
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
