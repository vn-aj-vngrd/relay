import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/games/open"],
      disallow: [
        "/account-suspended",
        "/admin/",
        "/admin-access-denied",
        "/admin-security",
        "/api/",
        "/auth/",
        "/feedback",
        "/games/",
        "/groups/",
        "/help",
        "/home",
        "/login",
        "/notifications",
        "/offline",
        "/onboarding/",
        "/settings",
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
