import { z } from "zod";

import { DEFAULT_CHAT_IMAGE_MAX_BYTES } from "@/lib/upload-config";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3002"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: z
    .union([z.enum(["true", "false"]), z.boolean()])
    .default("false")
    .transform((value) => value === true || value === "true"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().default(""),
});

const serverSchema = publicSchema.extend({
  DATABASE_URL: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  GEOAPIFY_API_KEY: z.string().min(20),
  HEALTHCHECK_SECRET: z.string().default(""),
  ADMIN_EMAILS: z.string().default(""),
  CHAT_IMAGE_MAX_BYTES: z.coerce
    .number()
    .int()
    .min(1024)
    .max(10 * 1024 * 1024)
    .default(DEFAULT_CHAT_IMAGE_MAX_BYTES),
});

const healthcheckSecretSchema = z.string().default("");
const notificationEnvSchema = z.object({
  enabled: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  dispatchSecret: z.string().default(""),
  resendApiKey: z.string().default(""),
  fromEmail: z.string().default(""),
  vapidPublicKey: z.string().default(""),
  vapidPrivateKey: z.string().default(""),
  vapidSubject: z.string().default("mailto:relay@vanajvanguardia.tech"),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export function getPublicEnv(): PublicEnv {
  return publicSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
}

export function getHealthcheckSecret() {
  return healthcheckSecretSchema.parse(process.env.HEALTHCHECK_SECRET);
}

export function getNotificationEnv() {
  return notificationEnvSchema.parse({
    enabled: process.env.NOTIFICATION_DELIVERY_ENABLED,
    dispatchSecret: process.env.NOTIFICATION_DISPATCH_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.NOTIFICATION_FROM_EMAIL,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    vapidSubject: process.env.VAPID_SUBJECT,
  });
}

export function getServerEnv(): ServerEnv {
  return serverSchema.parse({
    ...getPublicEnv(),
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
    HEALTHCHECK_SECRET: process.env.HEALTHCHECK_SECRET,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    CHAT_IMAGE_MAX_BYTES: process.env.CHAT_IMAGE_MAX_BYTES,
  });
}
