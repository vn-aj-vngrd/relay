import { describe, expect, it } from "vitest";

import {
  passwordResetRequestErrorMessage,
  recoveredPasswordErrorMessage,
} from "./password-errors";

describe("passwordResetRequestErrorMessage", () => {
  it("explains Supabase’s provider email limit", () => {
    expect(
      passwordResetRequestErrorMessage({
        code: "over_email_send_rate_limit",
        status: 429,
      })
    ).toBe(
      "Too many authentication emails were sent recently. Wait a few minutes and request a new link."
    );
  });
});

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
    expect(
      recoveredPasswordErrorMessage({ code: "unexpected_failure", status: 500 })
    ).toBe(
      "Your password could not be updated. Request a new reset link and try again."
    );
  });
});
