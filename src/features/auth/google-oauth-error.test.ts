import { describe, expect, it } from "vitest";

import { googleOAuthErrorMessage } from "./google-oauth-error";

function params(values: Record<string, string>) {
  return new URLSearchParams(values);
}

describe("googleOAuthErrorMessage", () => {
  it("explains how to recover from an existing Relay identity conflict without exposing database details", () => {
    const message = googleOAuthErrorMessage(
      params({
        error: "server_error",
        error_code: "unexpected_failure",
        error_description:
          'failed to close prepared statement: duplicate key value violates unique constraint "users email unique"',
      }),
    );

    expect(message).toBe(
      "Relay found existing account data for this email and could not connect Google safely. Try email sign-in or reset your password. If neither works, ask a Relay admin to repair the account.",
    );
    expect(message).not.toMatch(/duplicate|constraint|prepared statement/i);
  });

  it("distinguishes cancellation, provider configuration, and test-user restrictions", () => {
    expect(googleOAuthErrorMessage(params({ error: "access_denied" }))).toMatch(/canceled.*No changes were made/);
    expect(
      googleOAuthErrorMessage(
        params({ error: "server_error", error_description: "OAuth exchange failed: invalid_client" }),
      ),
    ).toMatch(/connection needs attention/);
    expect(
      googleOAuthErrorMessage(
        params({ error: "access_denied", error_description: "Access blocked: account is not an approved test user" }),
      ),
    ).toMatch(/not approved.*test release/);
  });
});
