import { ButtonLink } from "@/components/ui/button";
import { sessionAccentStyle } from "@/features/sessions/accent";

import { Brand } from "./brand";
import { PublicSessionNav } from "./public-session-nav";

export function PublicSessionHeader({
  slug,
  signedIn,
  gameHref,
  accentColor,
}: {
  slug: string;
  signedIn: boolean;
  gameHref?: string;
  accentColor?: string | null;
}) {
  const destination = gameHref ?? (signedIn ? "/home" : `/login?next=/s/${slug}`);
  const label = gameHref ? "Open game" : signedIn ? "Open Relay" : "Sign in";

  return (
    <header className="app-chrome sticky top-0 z-20" style={sessionAccentStyle(accentColor)}>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <ButtonLink href={destination} variant={signedIn ? "primary" : "secondary"}>
          {label}
        </ButtonLink>
      </div>
      <PublicSessionNav slug={slug} />
    </header>
  );
}
