import Link from "next/link";

export function PublicFooter() {
  return <footer className="shrink-0 border-t border-line bg-canvas"><div className="mx-auto flex min-h-11 max-w-[1040px] items-center justify-between gap-4 px-4 text-xs text-muted sm:px-6"><Link href="/" className="font-semibold text-ink hover:text-primary">Relay</Link><p className="text-right">The shared home for pickleball with friends.</p></div></footer>;
}
