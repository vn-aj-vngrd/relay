import "server-only";

import { z } from "zod";

const repository = "https://github.com/vn-aj-vngrd/relay";
const tagsSchema = z.array(
  z.object({ name: z.string(), commit: z.object({ sha: z.string() }) })
);

export function findReleaseTag(tags: unknown, commit: string): string | null {
  const parsed = tagsSchema.safeParse(tags);
  if (!parsed.success || !/^[a-f0-9]{40}$/.test(commit)) return null;
  return (
    parsed.data.find(
      (tag) => tag.commit.sha === commit && /^v\d+\.\d+\.\d+$/.test(tag.name)
    )?.name ?? null
  );
}

export function getBuildInfo() {
  const rawCommit = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  const commit = /^[a-f0-9]{40}$/.test(rawCommit) ? rawCommit : null;
  const environment =
    process.env.VERCEL_ENV === "production"
      ? "production"
      : process.env.VERCEL_ENV === "preview"
        ? "preview"
        : "development";
  return { commit, shortCommit: commit?.slice(0, 12) ?? null, environment };
}

export async function getAppRelease() {
  const build = getBuildInfo();
  const fallback = {
    ...build,
    version: null as string | null,
    releaseUrl: null as string | null,
    releasesUrl: `${repository}/releases`,
  };
  if (!build.commit || build.environment === "development") return fallback;
  try {
    // Match this deployment, never GitHub's latest release. Vercel may deploy
    // before CI finishes, so cache briefly and keep the build ID as fallback.
    const response = await fetch(
      "https://api.github.com/repos/vn-aj-vngrd/relay/tags?per_page=100",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(2500),
      }
    );
    if (!response.ok) return fallback;
    const tag = findReleaseTag(await response.json(), build.commit);
    return tag
      ? {
          ...fallback,
          version: tag.slice(1),
          releaseUrl: `${repository}/releases/tag/${tag}`,
        }
      : fallback;
  } catch {
    // Version awareness must not prevent Settings from loading during an outage.
    return fallback;
  }
}
