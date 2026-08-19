import { DeviceMobile, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { PreferenceControls } from "@/features/preferences/preference-controls";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";

export default async function PublicMorePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getPublicSession((await params).slug);
  if (!data) notFound();

  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-session-panel public-session-content mx-auto max-w-6xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8">
        <p className="text-sm font-semibold text-primary">{data.session.title}</p>
        <h1 className="mt-1 app-title">More</h1>
        <p className="mt-2 text-sm text-muted">Appearance and information for this shared game.</p>
        <div className="mt-8">
          <PreferenceControls appearanceOnly />
        </div>
        <section aria-labelledby="device-preferences-title" className="mt-9">
          <div className="flex items-start gap-3">
            <DeviceMobile aria-hidden className="mt-0.5 shrink-0 text-primary" size={19} />
            <div>
              <h2 id="device-preferences-title" className="font-semibold">
                Saved on this device
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Theme and layout preferences are stored in this browser. They apply across Relay without requiring an
                account.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 shrink-0 text-primary" size={19} />
            <div>
              <h2 className="font-semibold">A private session link</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Only people with this link can view the game unless the host changes its visibility.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
