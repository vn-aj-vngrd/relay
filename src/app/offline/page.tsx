import { CloudSlash } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Brand } from "@/components/shared/brand";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="grid min-h-dvh place-items-center bg-canvas px-4 py-10"
    >
      <section className="w-full max-w-md rounded-xl border border-line bg-surface p-6 sm:p-8">
        <Brand href="/" />
        <CloudSlash aria-hidden className="mt-10 text-primary" size={28} />
        <h1 className="mt-4 text-2xl font-bold tracking-[-0.025em]">
          Relay is offline
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Live courts, messages, payments, and new page loads need a connection.
          Any pending Relay action will retry when the network returns.
        </p>
        <ButtonLink href="/home" className="mt-6">
          Try again
        </ButtonLink>
        <p className="mt-4 text-xs leading-5 text-muted">
          Keep this screen open or reconnect, then use Try again. Completed
          server actions are never fabricated from offline data.
        </p>
      </section>
    </main>
  );
}
