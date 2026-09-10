import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/session", () => ({
  requireUser: async () => ({ id: "owner" }),
}));
vi.mock("@/features/billing/usage", () => ({
  getAccountUsage: async () => ({
    bytesUsed: 25 * 1024 * 1024,
    storageBytes: 100 * 1024 * 1024,
    storageUnlimited: false,
  }),
}));
vi.mock("@/features/billing/forms", () => ({
  ParticipantImagesForm: () => null,
  RemoveHostedPhotoForm: () => null,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ storage: {} }),
}));
vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => ({ orderBy: () => ({ limit: async () => [] }) }),
        }),
      }),
    }),
  },
}));

import HostedMediaPage from "./(app)/settings/plan/media/page";

afterEach(cleanup);

describe("hosted media page navigation", () => {
  it("places a quiet back arrow alongside the page title like Game Settings", async () => {
    render(await HostedMediaPage({ searchParams: Promise.resolve({}) }));
    const back = screen.getByRole("link", { name: "Back to Plan & billing" });
    expect(back).toHaveAttribute("href", "/settings/plan");
    expect(
      screen.getByRole("meter", { name: "Photo storage used" })
    ).toHaveAttribute("aria-valuenow", "25");
    expect(back).not.toHaveClass("border-line");
    expect(back.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(back.parentElement).toContainElement(
      screen.getByRole("heading", { level: 1, name: "Hosted-game photos" })
    );
    expect(
      screen.getByText("No hosted-game photos are using your storage.")
    ).toBeInTheDocument();
  });
});
