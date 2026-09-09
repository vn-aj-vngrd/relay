import "server-only";

import { validateAvatarFile } from "@/features/players/avatar-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { BillingError } from "./domain";

export const billingBucket = "subscription-files";

export async function uploadBillingFile(
  value: FormDataEntryValue | null,
  prefix: string
) {
  if (!(value instanceof File) || value.size === 0) return null;
  const validated = await validateAvatarFile(value);
  if ("error" in validated) throw new BillingError(validated.error);
  const path = `${prefix}/${crypto.randomUUID()}.${value.type === "image/jpeg" ? "jpg" : value.type.split("/")[1]}`;
  const { error } = await createSupabaseAdminClient()
    .storage.from(billingBucket)
    .upload(path, value, { contentType: value.type, upsert: false });
  if (error)
    throw new BillingError("The image could not be uploaded. Try again.");
  return path;
}

export async function removeBillingFile(path: string | null) {
  if (!path) return;
  const { error } = await createSupabaseAdminClient()
    .storage.from(billingBucket)
    .remove([path]);
  if (error) console.error("Subscription file cleanup failed", { path });
}

export async function billingFileUrl(path: string | null, download = false) {
  if (!path) return null;
  const { data, error } = await createSupabaseAdminClient()
    .storage.from(billingBucket)
    .createSignedUrl(
      path,
      300,
      download ? { download: "relay-payment-qr" } : undefined
    );
  if (error) {
    console.error("Subscription image URL could not be prepared", { path });
    return null;
  }
  return data.signedUrl;
}
