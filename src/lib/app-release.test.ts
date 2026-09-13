import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { findReleaseTag, getAppRelease, getBuildInfo } from "./app-release";

const current = "a".repeat(40);
const other = "b".repeat(40);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("deployed app version", () => {
  it("matches the running commit rather than the latest tag", () => {
    expect(
      findReleaseTag(
        [
          { name: "v2.0.0", commit: { sha: other } },
          { name: "v1.2.3", commit: { sha: current } },
        ],
        current
      )
    ).toBe("v1.2.3");
    expect(
      findReleaseTag([{ name: "v2.0.0", commit: { sha: other } }], current)
    ).toBeNull();
  });
  it("rejects malformed responses, non-version tags and incomplete hashes", () => {
    expect(findReleaseTag({ message: "rate limited" }, current)).toBeNull();
    expect(
      findReleaseTag([{ name: "latest", commit: { sha: current } }], current)
    ).toBeNull();
    expect(
      findReleaseTag([{ name: "v1.0.0", commit: { sha: "aaa" } }], "aaa")
    ).toBeNull();
  });
  it("does not call GitHub during local development", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(await getAppRelease()).toMatchObject({
      environment: "development",
      commit: null,
      version: null,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["pending", "http-error", "network-error"])(
    "keeps the build identity when release lookup is %s",
    async (state) => {
      vi.stubEnv("VERCEL_ENV", "production");
      vi.stubEnv("VERCEL_GIT_COMMIT_SHA", current);
      vi.stubGlobal(
        "fetch",
        state === "network-error"
          ? vi.fn().mockRejectedValue(new Error("offline"))
          : vi.fn().mockResolvedValue({
              ok: state === "pending",
              json: async () => [],
            })
      );
      expect(await getAppRelease()).toMatchObject({
        version: null,
        releaseUrl: null,
        commit: current,
        shortCommit: current.slice(0, 12),
      });
    }
  );
  it("returns a release-specific notes link and keeps preview labeling", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", current);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ name: "v1.2.3", commit: { sha: current } }],
      })
    );
    expect(getBuildInfo().environment).toBe("preview");
    expect(await getAppRelease()).toMatchObject({
      version: "1.2.3",
      releaseUrl: "https://github.com/vn-aj-vngrd/relay/releases/tag/v1.2.3",
      environment: "preview",
    });
  });
});
