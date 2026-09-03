import type { MetadataRoute } from "next";

import { getCourtSitemapEntries } from "@/features/venues/directory";
import { getPublicEnv } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  const courts = await getCourtSitemapEntries();
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/courts`, changeFrequency: "weekly", priority: 0.9 },
    ...courts.map(({ slug }) => ({
      url: `${origin}/courts/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${origin}/play`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
