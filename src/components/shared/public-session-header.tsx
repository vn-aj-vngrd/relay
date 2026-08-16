import Link from "next/link";
import { Brand } from "./brand";
import { PublicSessionNav } from "./public-session-nav";

export function PublicSessionHeader({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  return <div className="app-chrome sticky top-0 z-20"><header className="border-b border-line"><div className="public-session-header mx-auto grid max-w-[1040px] grid-cols-[1fr_auto] items-center px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4"><div className="justify-self-start"><Brand /></div><div className="hidden md:block"><PublicSessionNav slug={slug} inline /></div><div className="flex items-center justify-self-end"><Link href={signedIn ? "/home" : `/login?next=/s/${slug}`} className="pressable inline-flex min-h-11 items-center text-[13px] font-semibold"><span className={signedIn ? "inline-flex h-9 items-center rounded-lg bg-primary px-3 text-white hover:bg-primary-hover" : "inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-ink hover:bg-surface-strong"}>{signedIn ? "Open Relay" : "Sign in"}</span></Link></div></div></header><PublicSessionNav slug={slug} /></div>;
}
