import { describe, expect, it } from "vitest";

import { recoveredPasswordErrorMessage } from "./password-errors";

describe("recoveredPasswordErrorMessage", () => {
  it.each([
    ["same_password", "Choose a password you haven’t used for this account."],
    [
      "reauthentication_needed",
      "This reset session is no longer fresh. Sign out, request a new reset link, and open it in the same browser.",
    ],
    [
      "refresh_token_already_used",
      "This reset session has expired. Request a new reset link and open it in the same browser.",
    ],
  ])("maps %s to a recovery instruction", (code, expected) => {
    expect(recoveredPasswordErrorMessage({ code })).toBe(expected);
  });

  it("keeps unknown failures safe", () => {
    expect(recoveredPasswordErrorMessage({ code: "unexpected_failure", status: 500 })).toBe(
      "Your password could not be updated. Request a new reset link and try again.",
    );
  });
});
