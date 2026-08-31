import { ButtonLink } from "@/components/ui/button";
import { sessionAccentStyle } from "@/features/sessions/accent";

import { Brand } from "./brand";
import { PublicSessionNav } from "./public-session-nav";

export function PublicSessionHeader({
  slug,
  signedIn,
  gameHref,
  accentColor,
  gameTitle,
}: {
  slug: string;
  signedIn: boolean;
  gameHref?: string;
  accentColor?: string | null;
  gameTitle?: string;
}) {
  const destination = gameHref ?? (signedIn ? "/home" : `/login?next=/s/${slug}`);
  const label = gameHref ? "Open game" : signedIn ? "Open Relay" : "Sign in";

  const accentStyle = sessionAccentStyle(accentColor);

  return (
    <>
      <header className="app-chrome safe-top" style={accentStyle}>
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-1">
            <ButtonLink
              href={destination}
              variant={signedIn ? "primary" : "secondary"}
              className={signedIn ? "" : "border-transparent bg-transparent sm:border-line sm:bg-surface"}
            >
              {label}
            </ButtonLink>
          </div>
        </div>
        {gameTitle ? (
          <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
            <p title={gameTitle} className="truncate text-sm font-semibold text-primary">
              {gameTitle}
            </p>
          </div>
        ) : null}
      </header>
      <div className="app-chrome sticky top-0 z-20" style={accentStyle}>
        <PublicSessionNav slug={slug} />
      </div>
    </>
  );
}
