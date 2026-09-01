type PasswordUpdateError = {
  code?: string;
  status?: number;
};

export function recoveredPasswordErrorMessage(error: PasswordUpdateError) {
  switch (error.code) {
    case "same_password":
      return "Choose a password you haven’t used for this account.";
    case "weak_password":
      return "Choose a stronger password with at least 8 characters, including a letter and number.";
    case "reauthentication_needed":
      return "This reset session is no longer fresh. Sign out, request a new reset link, and open it in the same browser.";
    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
      return "This reset session has expired. Request a new reset link and open it in the same browser.";
    case "insufficient_aal":
      return "This account requires additional verification. Sign in and change the password from your profile.";
    default:
      return "Your password could not be updated. Request a new reset link and try again.";
  }
}
