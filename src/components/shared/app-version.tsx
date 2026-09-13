import { getAppRelease, getBuildInfo } from "@/lib/app-release";

export function AppVersionFallback() {
  const build = getBuildInfo();
  return (
    <p className="text-xs text-muted">
      {build.shortCommit ? `Build ${build.shortCommit}` : "Local development"}
    </p>
  );
}

export async function AppVersion() {
  const release = await getAppRelease();
  return (
    <section
      aria-label="App version"
      className="border-t border-line pt-5 text-xs text-muted"
    >
      <p>
        {release.version ? `Relay v${release.version}` : "Relay"}
        {release.shortCommit
          ? ` · Build ${release.shortCommit}`
          : " · Local development"}
        {release.environment === "preview" ? " · Preview" : null}
      </p>
      {release.commit ? (
        <a
          className="mt-1 inline-flex min-h-9 items-center font-medium text-primary hover:underline"
          href={release.releaseUrl ?? release.releasesUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {release.releaseUrl ? "Release notes" : "View releases"}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </section>
  );
}
