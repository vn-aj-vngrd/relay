type PasswordUpdateError = {
  code?: string;
  status?: number;
};

export function passwordResetRequestErrorMessage(error: PasswordUpdateError) {
  switch (error.code) {
    case "over_email_send_rate_limit":
      return "Too many authentication emails were sent recently. Wait a few minutes and request a new link.";
    case "captcha_failed":
      return "The security check expired. Complete it again and resend the request.";
    default:
      return "We couldn’t send the reset email. Wait a moment and try again.";
  }
}

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
