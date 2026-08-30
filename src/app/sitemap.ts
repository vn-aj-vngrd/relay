import type { MetadataRoute } from "next";

import { getPublicEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/courts`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
