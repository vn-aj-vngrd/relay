import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account-suspended",
        "/admin/",
        "/admin-access-denied",
        "/admin-security",
        "/api/",
        "/auth/",
        "/court/",
        "/feedback",
        "/games/",
        "/groups/",
        "/help",
        "/home",
        "/login",
        "/notifications",
        "/offline",
        "/onboarding/",
        "/preferences",
        "/profile/",
        "/read-only",
        "/s/",
        "/search",
        "/set-password",
        "/signup",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
