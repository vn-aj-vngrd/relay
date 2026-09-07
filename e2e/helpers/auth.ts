import type { BrowserContext } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";

/** Runner-only fixture. Never import this module from application code. */
export function fixtureConfig(
  env: Readonly<Record<string, string | undefined>>,
  baseURL: string
) {
  if (env.E2E_SESSION_FIXTURE !== "true") {
    throw new Error(
      "Set E2E_SESSION_FIXTURE=true to authorize test-session creation."
    );
  }
  const origin = new URL(baseURL);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) ||
    !["http:", "https:"].includes(origin.protocol)
  ) {
    throw new Error(
      "The privileged E2E session fixture requires a loopback app origin."
    );
  }
  const required = [
    "E2E_AUTH_USER_ID",
    "E2E_AUTH_EMAIL",
    "SUPABASE_SECRET_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ] as const;
  for (const key of required) {
    if (!env[key]?.trim())
      throw new Error(`Missing ${key} for E2E session fixture.`);
  }
  return {
    origin: origin.origin,
    userId: env.E2E_AUTH_USER_ID!,
    email: env.E2E_AUTH_EMAIL!,
    secret: env.SUPABASE_SECRET_KEY!,
    supabaseURL: env.NEXT_PUBLIC_SUPABASE_URL!,
    publicKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    admins: (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase()),
  };
}

export function assertDisposableUser(
  user: User,
  config: ReturnType<typeof fixtureConfig>
) {
  if (
    user.id !== config.userId ||
    user.email?.toLowerCase() !== config.email.toLowerCase() ||
    user.user_metadata.test_account !== true ||
    user.role !== "authenticated" ||
    config.admins.includes(config.email.toLowerCase()) ||
    user.app_metadata.role === "admin" ||
    user.app_metadata.is_admin === true ||
    (user.factors?.length ?? 0) > 0
  ) {
    throw new Error(
      "E2E fixture refuses an unmarked, mismatched, privileged, or MFA account."
    );
  }
}

export async function establishTestSession(
  context: BrowserContext,
  baseURL: string
) {
  const config = fixtureConfig(process.env, baseURL);
  const admin = createClient(config.supabaseURL, config.secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity, error: identityError } =
    await admin.auth.admin.getUserById(config.userId);
  if (identityError || !identity.user)
    throw new Error("Could not verify the dedicated E2E identity.");
  assertDisposableUser(identity.user, config);

  // generateLink does not send mail. Both the single-use token and its verification
  // stay in this Node process, never in a URL, browser trace, or application route.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: config.email,
  });
  if (
    linkError ||
    !link.properties?.hashed_token ||
    link.user.id !== config.userId
  )
    throw new Error("Could not generate the dedicated E2E session token.");
  const supabase = createServerClient(config.supabaseURL, config.publicKey, {
    cookies: {
      getAll: () => context.cookies(config.origin),
      setAll: async (cookies) => {
        await context.addCookies(
          cookies.map(({ name, value, options }) => ({
            name,
            value,
            domain: new URL(config.origin).hostname,
            path: options.path ?? "/",
            httpOnly: options.httpOnly ?? false,
            secure: new URL(config.origin).protocol === "https:",
            sameSite:
              options.sameSite === "strict"
                ? ("Strict" as const)
                : options.sameSite === "none"
                  ? ("None" as const)
                  : ("Lax" as const),
            ...(options.maxAge !== undefined
              ? { expires: Math.floor(Date.now() / 1000) + options.maxAge }
              : {}),
          }))
        );
      },
    },
  });
  const { data, error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (error || data.user?.id !== config.userId || !data.session)
    throw new Error("Could not establish the dedicated E2E session.");
}
