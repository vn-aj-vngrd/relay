import Link from "next/link";
import { Brand } from "./brand";
import { PublicSessionNav } from "./public-session-nav";
import { ThemeToggle } from "./theme-toggle";

export function PublicSessionHeader({ slug, active, signedIn }: { slug: string; active: string; signedIn: boolean }) {
  return <><header className="app-chrome sticky top-0 z-20 border-b border-line"><div className="mx-auto flex h-16 max-w-[1040px] items-center justify-between px-4 sm:px-6"><Brand /><div className="flex items-center gap-1"><ThemeToggle /><Link href={signedIn ? "/home" : `/login?next=/s/${slug}`} className="min-h-11 px-2 py-3 text-sm font-semibold text-muted hover:text-ink">{signedIn ? "Open Relay" : "Sign in"}</Link></div></div></header><PublicSessionNav slug={slug} active={active} /></>;
}
