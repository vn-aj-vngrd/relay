"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getPublicEnv } from "@/lib/env";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { resolvePostAuthDestination } from "./destination";
import { safeNextPath } from "./destination-path";
import {
  passwordResetRequestErrorMessage,
  recoveredPasswordErrorMessage,
} from "./password-errors";
import { getCurrentUser } from "./session";

const emailSchema = z.email();
const signInPasswordSchema = z.string().min(1).max(4096);
const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/)
  .regex(/\d/);

function nextPath(formData: FormData) {
  return safeNextPath(formData.get("next"));
}

function authError(
  message: string,
  destination = "/login",
  next?: string
): never {
  const params = new URLSearchParams({ error: message });
  if (next && next !== "/home") params.set("next", next);
  redirect(`${destination}?${params}`);
}

type AuthAttemptInput = {
  scope: string;
  email?: string;
  ipLimit: number;
  accountLimit?: number;
  windowSeconds: number;
  destination?: string;
  next?: string;
};

async function authAttemptAllowed(input: AuthAttemptInput) {
  const ipResult = await checkRateLimit(
    {
      scope: `${input.scope}:ip`,
      limit: input.ipLimit,
      windowSeconds: input.windowSeconds,
    },
    await requestIdentity()
  );
  const accountResult = input.email
    ? await checkRateLimit(
        {
          scope: `${input.scope}:account`,
          limit: input.accountLimit ?? input.ipLimit,
          windowSeconds: input.windowSeconds,
        },
        `email:${input.email.toLowerCase()}`
      )
    : null;
  return ipResult.allowed && accountResult?.allowed !== false;
}

async function guardAuthAttempt(input: AuthAttemptInput) {
  if (!(await authAttemptAllowed(input)))
    authError(
      "Too many attempts. Wait a few minutes and try again.",
      input.destination,
      input.next
    );
}

export async function sendMagicLink(formData: FormData) {
  const next = nextPath(formData);
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success)
    authError("Enter a valid email address.", "/login", next);
  await guardAuthAttempt({
    scope: "magic-link",
    email: parsed.data,
    ipLimit: 8,
    accountLimit: 3,
    windowSeconds: 3600,
    destination: "/login",
    next,
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) authError(error.message, "/login", next);
  const cookieStore = await cookies();
  cookieStore.set("relay_auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  redirect("/login?sent=1");
}

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  refreshCaptcha?: boolean;
};

async function attemptPasswordSignIn(
  formData: FormData
): Promise<AuthFormState> {
  const next = nextPath(formData);
  const email = emailSchema.safeParse(formData.get("email"));
  const password = signInPasswordSchema.safeParse(formData.get("password"));
  const captchaToken = z
    .string()
    .min(1)
    .max(4096)
    .safeParse(formData.get("cf-turnstile-response"));
  if (!email.success || !password.success) {
    const fieldErrors: Record<string, string[]> = {};
    if (!email.success) fieldErrors.email = ["Enter a valid email address."];
    if (!password.success) fieldErrors.password = ["Enter your password."];
    return { error: "Check the fields marked below.", fieldErrors };
  }
  if (!captchaToken.success)
    return { error: "Complete the security check and try again." };
  const allowed = await authAttemptAllowed({
    scope: "password-sign-in",
    email: email.data,
    ipLimit: 25,
    accountLimit: 12,
    windowSeconds: 600,
  });
  if (!allowed)
    return { error: "Too many attempts. Wait a few minutes and try again." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
    options: { captchaToken: captchaToken.data },
  });
  if (error || !data.user)
    return { error: "Email or password is incorrect.", refreshCaptcha: true };
  redirect(await resolvePostAuthDestination(next, data.user.id));
}

export async function signInWithPasswordState(
  _: AuthFormState,
  formData: FormData
) {
  return attemptPasswordSignIn(formData);
}

export async function signInWithPassword(formData: FormData) {
  const result = await attemptPasswordSignIn(formData);
  authError(
    result.error ?? "Sign in could not be completed. Try again.",
    "/login",
    nextPath(formData)
  );
}

async function attemptPasswordAccountCreation(
  formData: FormData
): Promise<AuthFormState> {
  const next = nextPath(formData);
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("confirmation");
  const captchaToken = z
    .string()
    .min(1)
    .max(4096)
    .safeParse(formData.get("cf-turnstile-response"));
  if (!email.success || !password.success) {
    const fieldErrors: Record<string, string[]> = {};
    if (!email.success) fieldErrors.email = ["Enter a valid email address."];
    if (!password.success)
      fieldErrors.password = [
        "Use at least 8 characters, including a letter and number.",
      ];
    return { error: "Check the fields marked below.", fieldErrors };
  }
  if (password.data !== confirmation)
    return {
      error: "Check the fields marked below.",
      fieldErrors: { confirmation: ["Passwords do not match."] },
    };
  if (!captchaToken.success)
    return { error: "Complete the security check and try again." };
  const allowed = await authAttemptAllowed({
    scope: "password-sign-up",
    email: email.data,
    ipLimit: 30,
    accountLimit: 10,
    windowSeconds: 3600,
  });
  if (!allowed)
    return { error: "Too many attempts. Wait a few minutes and try again." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      captchaToken: captchaToken.data,
      emailRedirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error)
    return {
      error:
        error.message === "User already registered"
          ? "An account already exists for this email. Log in instead."
          : error.message.includes("beta signup is full")
            ? "Relay’s beta is full right now. Try again after more places open."
            : "We couldn’t create your account. Please try again.",
      refreshCaptcha: true,
    };
  if (data.session && data.user)
    redirect(await resolvePostAuthDestination(next, data.user.id));
  const cookieStore = await cookies();
  cookieStore.set("relay_auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  cookieStore.set("relay_confirmation_email", email.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/signup",
  });
  redirect("/signup?sent=account");
}

export async function createPasswordAccountState(
  _: AuthFormState,
  formData: FormData
) {
  return attemptPasswordAccountCreation(formData);
}

export async function createPasswordAccount(formData: FormData) {
  const result = await attemptPasswordAccountCreation(formData);
  const firstFieldError = Object.values(result.fieldErrors ?? {})[0]?.[0];
  authError(
    firstFieldError ??
      result.error ??
      "Account creation could not be completed. Try again.",
    "/signup",
    nextPath(formData)
  );
}

async function attemptPasswordResetRequest(
  formData: FormData
): Promise<AuthFormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const captchaToken = z
    .string()
    .min(1)
    .max(4096)
    .safeParse(formData.get("cf-turnstile-response"));
  if (!email.success)
    return {
      error: "Check the field marked below.",
      fieldErrors: { email: ["Enter a valid email address."] },
    };
  if (!captchaToken.success)
    return { error: "Complete the security check and try again." };
  const allowed = await authAttemptAllowed({
    scope: "password-reset",
    email: email.data,
    ipLimit: 8,
    accountLimit: 3,
    windowSeconds: 3600,
  });
  if (!allowed)
    return { error: "Too many attempts. Wait a few minutes and try again." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback?recovery=1`,
    captchaToken: captchaToken.data,
  });
  if (error) {
    console.error("[relay-password-reset-request]", {
      code: error.code,
      status: error.status,
    });
    return {
      error: passwordResetRequestErrorMessage(error),
      refreshCaptcha: true,
    };
  }
  const cookieStore = await cookies();
  cookieStore.set("relay_recovery_email", email.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/forgot-password",
  });
  redirect("/forgot-password?sent=1");
}

export async function requestPasswordResetState(
  _: AuthFormState,
  formData: FormData
) {
  return attemptPasswordResetRequest(formData);
}

export async function requestPasswordReset(formData: FormData) {
  const result = await attemptPasswordResetRequest(formData);
  const firstFieldError = Object.values(result.fieldErrors ?? {})[0]?.[0];
  authError(
    firstFieldError ??
      result.error ??
      "Password recovery could not be started. Try again.",
    "/forgot-password"
  );
}

async function verifyPasswordMfa(
  formData: FormData,
  mode: "recovery" | "temporary-password"
) {
  const destination =
    mode === "recovery" ? "/update-password" : "/set-password";
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient();
  const { data: currentUser, error: sessionError } =
    await supabase.auth.getUser();
  const user = currentUser.user;
  const authorized =
    !sessionError &&
    user &&
    (mode === "recovery"
      ? cookieStore.get("relay_password_recovery")?.value === "1"
      : user.app_metadata.force_password_change === true);
  if (!authorized)
    redirect(
      mode === "recovery" ? "/forgot-password" : "/login?next=/set-password"
    );

  const code = z
    .string()
    .regex(/^\d{6}$/)
    .safeParse(formData.get("code"));
  if (!code.success)
    authError(
      "Enter the six-digit code from your authenticator app.",
      destination
    );
  await guardAuthAttempt({
    scope: `password-mfa-${mode}`,
    email: user.email,
    ipLimit: 20,
    accountLimit: 10,
    windowSeconds: 600,
    destination,
  });

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError)
    authError(
      "Your authenticator could not be checked. Try again.",
      destination
    );
  if (assurance.currentLevel === "aal2") redirect(destination);
  if (assurance.nextLevel !== "aal2") redirect(destination);

  const { data: factors, error: factorsError } =
    await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find(
    (candidate) => candidate.status === "verified"
  );
  if (factorsError || !factor)
    authError(
      "Your verified authenticator could not be loaded. Contact Relay support.",
      destination
    );

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: code.data,
  });
  if (error)
    authError(
      "That code was not accepted. Wait for a new code and try again.",
      destination
    );
  redirect(destination);
}

export async function verifyRecoveryMfa(formData: FormData) {
  return verifyPasswordMfa(formData, "recovery");
}

export async function verifyTemporaryPasswordMfa(formData: FormData) {
  return verifyPasswordMfa(formData, "temporary-password");
}

export async function updateRecoveredPassword(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient();
  const { data: currentUser, error: sessionError } =
    await supabase.auth.getUser();
  if (
    sessionError ||
    !currentUser.user ||
    cookieStore.get("relay_password_recovery")?.value !== "1"
  )
    redirect("/forgot-password");
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("confirmation");
  if (!password.success)
    authError(
      "Use at least 8 characters with a letter and number.",
      "/update-password"
    );
  if (password.data !== confirmation)
    authError("Passwords do not match.", "/update-password");
  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError)
    authError(
      "Your authenticator could not be checked. Try again.",
      "/update-password"
    );
  if (assurance.nextLevel === "aal2" && assurance.currentLevel !== "aal2")
    authError(
      "Verify your authenticator before choosing a new password.",
      "/update-password"
    );

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    console.error("[relay-password-recovery-update]", {
      code: error.code,
      status: error.status,
    });
    authError(recoveredPasswordErrorMessage(error), "/update-password");
  }
  cookieStore.delete("relay_password_recovery");
  await supabase.auth.signOut();
  redirect("/login?password=updated");
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings/password");
  const currentPassword = passwordSchema.safeParse(
    formData.get("currentPassword")
  );
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("confirmation");
  if (!currentPassword.success)
    authError("Enter your current password.", "/settings/password");
  if (!password.success)
    authError(
      "Use at least 8 characters with a letter and number.",
      "/settings/password"
    );
  if (password.data !== confirmation)
    authError("Passwords do not match.", "/settings/password");
  if (password.data === currentPassword.data)
    authError(
      "Choose a new password that differs from your current password.",
      "/settings/password"
    );

  await guardAuthAttempt({
    scope: "password-change",
    email: user.email,
    ipLimit: 10,
    accountLimit: 5,
    windowSeconds: 3600,
    destination: "/settings/password",
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    current_password: currentPassword.data,
    password: password.data,
  });
  if (error) {
    const message = error.message.toLowerCase().includes("password")
      ? "Your current password is incorrect."
      : "Your password could not be changed. Try again.";
    authError(message, "/settings/password");
  }
  redirect("/settings/password?success=1");
}

export async function setTemporaryPassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/set-password");
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("confirmation");
  if (!password.success)
    redirect(
      `/set-password?error=${encodeURIComponent("Use at least 8 characters with a letter and number.")}`
    );
  if (password.data !== confirmation)
    redirect(
      `/set-password?error=${encodeURIComponent("Passwords do not match.")}`
    );

  const supabase = await createSupabaseServerClient();
  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError)
    authError(
      "Your authenticator could not be checked. Try again.",
      "/set-password"
    );
  if (assurance.nextLevel === "aal2" && assurance.currentLevel !== "aal2")
    authError(
      "Verify your authenticator before choosing a new password.",
      "/set-password"
    );
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error)
    redirect(
      `/set-password?error=${encodeURIComponent("Your password could not be updated. Try again.")}`
    );
  const admin = createSupabaseAdminClient();
  const { error: metadataError } = await admin.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: { force_password_change: false },
    }
  );
  if (metadataError)
    redirect(
      `/set-password?error=${encodeURIComponent("Your password changed, but account setup could not finish. Submit it once more.")}`
    );
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithGoogle(formData: FormData) {
  const next = nextPath(formData);
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED)
    authError(
      "Google sign-in is not available yet. Sign in with your email and password.",
      "/login",
      next
    );
  await guardAuthAttempt({
    scope: "google-sign-in",
    ipLimit: 20,
    windowSeconds: 600,
    destination: "/login",
    next,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error || !data.url)
    authError("Google sign-in could not start. Try again.", "/login", next);
  const cookieStore = await cookies();
  cookieStore.set("relay_auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  redirect(data.url);
}
