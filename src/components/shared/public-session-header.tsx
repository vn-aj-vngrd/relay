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
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Brand showLabel={false} />
            {gameTitle ? (
              <p title={gameTitle} className="min-w-0 truncate text-sm font-semibold text-primary">
                {gameTitle}
              </p>
            ) : null}
          </div>
          <ButtonLink
            href={destination}
            variant={signedIn ? "primary" : "secondary"}
            className={`shrink-0 ${signedIn ? "" : "border-transparent bg-transparent sm:border-line sm:bg-surface"}`}
          >
            {label}
          </ButtonLink>
        </div>
      </header>
      <div className="app-chrome sticky top-0 z-20" style={accentStyle}>
        <PublicSessionNav slug={slug} />
      </div>
    </>
  );
}
