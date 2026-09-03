import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./settings-actions", () => ({ saveNotificationSettings: vi.fn(async () => ({})) }));
vi.mock("./push-device-control", () => ({ PushDeviceControl: () => <button>Enable on this device</button> }));

import { NotificationSettingsForm } from "./notification-settings-form";
import { defaultCategoryPreferences } from "./preferences";

const preferences = {
  emailEnabled: false,
  pushEnabled: false,
  emailCategories: defaultCategoryPreferences,
  pushCategories: defaultCategoryPreferences,
  dayBeforeReminder: true,
  hourBeforeReminder: true,
  quietHoursStart: "22:00:00",
  quietHoursEnd: "07:00:00",
  timeZone: "Asia/Manila",
};

describe("NotificationSettingsForm", () => {
  it("keeps channels off by default while exposing every delivery category", () => {
    render(<NotificationSettingsForm preferences={preferences} />);

    expect(screen.getByRole("checkbox", { name: "Enable email delivery" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Enable push delivery" })).not.toBeChecked();
    expect(screen.getByText("Invitations")).toBeVisible();
    expect(screen.getByText("RSVP and waitlist")).toBeVisible();
    expect(screen.getByText("Important changes")).toBeVisible();
    expect(screen.getByText("Payments")).toBeVisible();
    expect(screen.getByRole("button", { name: "Enable on this device" })).toBeVisible();
  });

  it("loads reminder timing and quiet-hour preferences", () => {
    render(<NotificationSettingsForm preferences={preferences} />);

    expect(screen.getByRole("checkbox", { name: "Day before" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "One hour before" })).toBeChecked();
    expect(screen.getByLabelText("Quiet from")).toHaveValue("22:00");
    expect(screen.getByLabelText("Quiet until")).toHaveValue("07:00");
    expect(screen.getByLabelText("Time zone")).toHaveValue("Asia/Manila");
  });
});
