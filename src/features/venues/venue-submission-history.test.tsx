import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VenueSubmissionHistory } from "./venue-submission-history";

describe("VenueSubmissionHistory", () => {
  it("shows the player’s review status and resolution", () => {
    render(
      <VenueSubmissionHistory
        submissions={[
          {
            id: "request-1",
            requestType: "update",
            status: "rejected",
            name: "Central Pickle",
            resolutionNote: "The submitted source did not show this change.",
            createdAt: new Date("2026-09-04T03:00:00.000Z"),
            updatedAt: new Date("2026-09-04T04:00:00.000Z"),
          },
        ]}
      />
    );

    expect(screen.getByText("Your suggestions")).toBeVisible();
    expect(screen.getByText("Central Pickle")).toBeVisible();
    expect(screen.getByText("Not applied")).toBeVisible();
    expect(
      screen.getByText("The submitted source did not show this change.")
    ).toBeVisible();
  });
});
