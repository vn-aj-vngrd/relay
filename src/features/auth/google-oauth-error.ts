const GOOGLE_OAUTH_MESSAGES = {
  canceled: "Google sign-in was canceled. No changes were made. Try again when you’re ready.",
  accountConflict:
    "Relay found existing account data for this email and could not connect Google safely. Try email sign-in or reset your password. If neither works, ask a Relay admin to repair the account.",
  configuration:
    "Google sign-in is temporarily unavailable because Relay’s Google connection needs attention. Use email sign-in for now.",
  testUser:
    "This Google account is not approved for Relay’s current test release. Ask a Relay admin to add it as a test user, then try again.",
  setup:
    "Google verified your account, but Relay could not finish signing you in. Try again. If it keeps happening, use email sign-in.",
} as const;

export function googleOAuthErrorMessage(searchParams: URLSearchParams) {
  const error = searchParams.get("error")?.toLowerCase() ?? "";
  const details = [searchParams.get("error_code"), searchParams.get("error_description")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (error === "access_denied" && !details.includes("test user") && !details.includes("access blocked"))
    return GOOGLE_OAUTH_MESSAGES.canceled;

  if (
    details.includes("duplicate key") ||
    details.includes("users email unique") ||
    details.includes("users_email_unique")
  )
    return GOOGLE_OAUTH_MESSAGES.accountConflict;

  if (
    details.includes("invalid_client") ||
    details.includes("client secret") ||
    details.includes("redirect_uri_mismatch")
  )
    return GOOGLE_OAUTH_MESSAGES.configuration;

  if (details.includes("test user") || details.includes("access blocked") || details.includes("not approved"))
    return GOOGLE_OAUTH_MESSAGES.testUser;

  return GOOGLE_OAUTH_MESSAGES.setup;
}
