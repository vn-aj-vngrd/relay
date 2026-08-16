import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3002"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  DATABASE_URL: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  GEOAPIFY_API_KEY: z.string().min(20),
  GEOAPIFY_API_URL: z.url().default("https://api.geoapify.com"),
  ADMIN_EMAILS: z.string().default(""),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export function getPublicEnv(): PublicEnv {
  return publicSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function getServerEnv(): ServerEnv {
  return serverSchema.parse({
    ...getPublicEnv(),
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
    GEOAPIFY_API_URL: process.env.GEOAPIFY_API_URL,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  });
}
