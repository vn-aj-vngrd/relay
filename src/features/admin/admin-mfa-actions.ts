"use server";

import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getAuthorizedAdmin } from "./auth";

type MfaPreparation =
  | { ok: true; factorId: string; enrolled: true }
  | {
      ok: true;
      factorId: string;
      enrolled: false;
      qrCode: string;
      secret: string;
    }
  | { ok: false; message: string };

async function authorizeAdminMfa() {
  const admin = await getAuthorizedAdmin();
  if (!admin) return null;
  return { admin, supabase: await createSupabaseServerClient() };
}

async function removeAbandonedTotpFactors(userId: string) {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.auth.admin.mfa.listFactors({
    userId,
  });
  if (error) return false;

  for (const factor of data.factors) {
    if (factor.factor_type !== "totp" || factor.status !== "unverified")
      continue;
    const { error: deleteError } =
      await adminClient.auth.admin.mfa.deleteFactor({ userId, id: factor.id });
    if (deleteError) return false;
  }
  return true;
}

export async function prepareAdminMfaAction(): Promise<MfaPreparation> {
  const authorization = await authorizeAdminMfa();
  if (!authorization)
    return {
      ok: false,
      message: "Your administrator session expired. Sign in again.",
    };
  const { admin, supabase } = authorization;

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError)
    return {
      ok: false,
      message: "Your administrator session could not be verified.",
    };
  if (assurance.currentLevel === "aal2")
    return {
      ok: false,
      message: "Administrator security is already verified.",
    };

  const { data: factors, error: factorsError } =
    await supabase.auth.mfa.listFactors();
  if (factorsError)
    return {
      ok: false,
      message: "Your authenticator factors could not be loaded.",
    };
  const verified = factors.totp.find(
    (factor: { id: string; status: string }) => factor.status === "verified"
  );
  if (verified) return { ok: true, factorId: verified.id, enrolled: true };

  let enrollment = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (
    enrollment.error?.code === "mfa_factor_name_conflict" &&
    (await removeAbandonedTotpFactors(admin.id))
  ) {
    enrollment = await supabase.auth.mfa.enroll({ factorType: "totp" });
  }
  if (enrollment.error) {
    console.error("Admin MFA enrollment failed", {
      code: enrollment.error.code,
      status: enrollment.error.status,
    });
    return {
      ok: false,
      message:
        "A new authenticator could not be enrolled. Sign out, sign in, and try again.",
    };
  }

  return {
    ok: true,
    factorId: enrollment.data.id,
    enrolled: false,
    qrCode: enrollment.data.totp.qr_code,
    secret: enrollment.data.totp.secret,
  };
}

export async function verifyAdminMfaAction(input: {
  factorId: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = z
    .object({ factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) })
    .safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: "Enter the six-digit code from your authenticator app.",
    };

  const authorization = await authorizeAdminMfa();
  if (!authorization)
    return {
      ok: false,
      message: "Your administrator session expired. Sign in again.",
    };
  const { error } = await authorization.supabase.auth.mfa.challengeAndVerify(
    parsed.data
  );
  if (error)
    return {
      ok: false,
      message: "That code was not accepted. Wait for a new code and try again.",
    };
  return { ok: true };
}
