import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/courts", "/privacy", "/terms"],
      disallow: [
        "/admin/",
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
        "/onboarding/",
        "/preferences",
        "/profile/",
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
