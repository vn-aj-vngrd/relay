import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./organizer-actions", () => ({
  addCohostAction: vi.fn(async () => ({})),
  setCohostRoleAction: vi.fn(async () => ({})),
}));

import { OrganizerSettings } from "./organizer-settings";

const organizers = [
  {
    sessionPlayerId: "host-player",
    name: "Mika Reyes",
    role: "host" as const,
    playing: true,
  },
  {
    sessionPlayerId: "cohost-player",
    name: "Alex Cruz",
    role: "cohost" as const,
    playing: false,
  },
];

afterEach(cleanup);

describe("OrganizerSettings", () => {
  it("keeps organizer authority separate from playing state", () => {
    render(
      <OrganizerSettings
        sessionId="session-1"
        version={2}
        organizers={organizers}
        canManage
      />
    );

    expect(screen.getByText("Mika Reyes")).toBeVisible();
    expect(screen.getByText("Co-host · Not playing")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add co-host" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove Alex Cruz as co-host" })
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Relay username" })
    ).toBeVisible();
  });

  it("lets the host add an organizer who is not already on the player roster", () => {
    render(
      <OrganizerSettings
        sessionId="session-1"
        version={2}
        organizers={organizers}
        canManage
      />
    );

    expect(
      screen.getByRole("textbox", { name: "Relay username" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Add co-host" })).toBeVisible();
  });

  it("shows organizer information without host controls to a co-host", () => {
    render(
      <OrganizerSettings
        sessionId="session-1"
        version={2}
        organizers={organizers}
        canManage={false}
      />
    );

    expect(screen.getByText("Alex Cruz")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add co-host" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Alex Cruz as co-host" })
    ).not.toBeInTheDocument();
  });
});
