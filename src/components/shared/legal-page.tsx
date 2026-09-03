import Link from "next/link";

import { Brand } from "./brand";

export function LegalPage({
  title,
  summary,
  updated,
  children,
}: {
  title: string;
  summary: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <Link
            href="/"
            className="pressable inline-flex min-h-11 items-center px-2 text-sm font-semibold text-primary"
          >
            Back to Relay
          </Link>
        </div>
      </header>
      <main id="main-content" className="flex-1">
        <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-sm font-semibold text-primary">Relay</p>
          <h1 className="mt-3 text-4xl font-[680] tracking-[-0.035em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            {summary}
          </p>
          <p className="mt-4 text-xs text-muted">Last updated {updated}</p>
          <div className="legal-copy mt-10 space-y-9 border-t border-line pt-9 [&_a]:font-semibold [&_a]:text-primary [&_h2]:text-xl [&_h2]:font-bold [&_li]:leading-7 [&_p]:mt-3 [&_p]:leading-7 [&_p]:text-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </main>
    </div>
  );
}
