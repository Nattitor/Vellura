// Stable error codes for Supabase Auth failures so the UI can translate them.
// Server actions return a CODE (UPPER_SNAKE); unknown messages pass through raw.

export function toAuthErrorCode(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "INVALID_CREDENTIALS";
  if (m.includes("email not confirmed")) return "EMAIL_NOT_CONFIRMED";
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already exists") ||
    m.includes("already exists")
  )
    return "EMAIL_EXISTS";
  if (m.includes("error sending")) return "EMAIL_SEND_FAILED";
  if (m.includes("rate limit") || m.includes("too many requests")) return "RATE_LIMITED";
  if (m.includes("password should be") || m.includes("at least 6")) return "WEAK_PASSWORD";
  if (m.includes("password") && m.includes("match")) return "PASSWORD_MISMATCH";
  if (m.includes("invalid email") || m.includes("valid email")) return "INVALID_EMAIL";
  if (
    m.includes("signed in") ||
    m.includes("not authenticated") ||
    m.includes("session missing")
  )
    return "NOT_SIGNED_IN";
  return message;
}

type AuthDict = Record<string, string | undefined> | undefined;

export function translateAuthError(auth: AuthDict, codeOrMessage: string): string {
  const a = auth ?? {};
  switch (codeOrMessage) {
    case "INVALID_CREDENTIALS":
      return a.authInvalidCredentials || "Invalid email or password. Please try again.";
    case "EMAIL_NOT_CONFIRMED":
      return a.authEmailNotConfirmed || "Email not confirmed. Check your inbox for the verification link.";
    case "EMAIL_EXISTS":
      return a.authEmailExists || "This email is already registered. Please sign in or reset your password.";
    case "EMAIL_SEND_FAILED":
      return a.authEmailSendFailed || "Could not send the email. Please try again in a few minutes.";
    case "RATE_LIMITED":
      return a.authRateLimited || "Too many attempts. Please wait a few minutes and try again.";
    case "WEAK_PASSWORD":
      return a.authWeakPassword || "Password must be at least 6 characters long.";
    case "PASSWORD_MISMATCH":
      return a.authPasswordMismatch || "Passwords do not match.";
    case "INVALID_EMAIL":
      return a.authInvalidEmail || "Please enter a valid email address.";
    case "NOT_SIGNED_IN":
      return a.authNotSignedIn || "You must be signed in to do that.";
    case "AUTH_GENERIC":
      return a.authGenericError || "Could not authenticate. Please try again.";
    default:
      return codeOrMessage;
  }
}
