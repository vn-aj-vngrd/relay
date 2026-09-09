import "server-only";

import {
  AuthSessionMissingError,
  type SupabaseClient,
} from "@supabase/supabase-js";

type AssuranceResponse = Awaited<
  ReturnType<SupabaseClient["auth"]["mfa"]["getAuthenticatorAssuranceLevel"]>
>;

export async function getVerifiedAssuranceLevel(
  supabase: SupabaseClient
): Promise<AssuranceResponse> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { data: null, error };
  const token = data.session?.access_token;
  if (!token) return { data: null, error: new AuthSessionMissingError() };

  // Only read the token from storage, never session.user. Passing a JWT makes
  // Supabase validate it with getUser(jwt) and use authoritative MFA factors.
  return supabase.auth.mfa.getAuthenticatorAssuranceLevel(token);
}
