import { ImageResponse } from "next/og";

import { sessionAccent } from "@/features/sessions/accent";
import { formatSessionDateLong, formatSessionTime, spotsRemainingLabel } from "@/features/sessions/format";
import { getPublicSession } from "@/features/sessions/queries";

export const alt = "Relay pickleball game invitation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicSession(slug);

  if (!data) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f7f5",
          color: "#171719",
          fontFamily: "sans-serif",
          fontSize: 72,
          fontWeight: 700,
        }}
      >
        Relay
      </div>,
      size,
    );
  }

  const { session, roster, hostProfile, matchCount } = data;
  const going = roster.filter(({ player }) => player.rsvp === "going").length;
  const waitlisted = roster.filter(({ player }) => player.rsvp === "waitlisted").length;
  const spots = Math.max(0, session.capacity - going);
  const accent = sessionAccent(session.accentColor);
  const availability =
    session.status === "completed"
      ? `${matchCount} ${matchCount === 1 ? "match" : "matches"} played`
      : spots
        ? spotsRemainingLabel(spots)
        : waitlisted
          ? `${waitlisted} on the waitlist`
          : "Waitlist open";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#171d38",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.18,
        }}
      >
        <div style={{ position: "absolute", top: 0, bottom: 0, right: 274, width: 2, background: "#d7edf4" }} />
        <div style={{ position: "absolute", top: 378, right: 0, width: 274, height: 2, background: "#d7edf4" }} />
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "66px 76px 58px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, fontSize: 26, fontWeight: 700 }}>
            <span style={{ width: 30, height: 30, borderRadius: 999, background: "#b7d62e", display: "flex" }} />
            Relay
          </div>
          <div
            style={{
              display: "flex",
              border: `2px solid ${accent.solid}`,
              borderRadius: 999,
              padding: "10px 18px",
              fontSize: 21,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {availability}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <div style={{ display: "flex", color: "#b9c2dd", fontSize: 23, fontWeight: 700, letterSpacing: 1.4 }}>
            {formatSessionDateLong(session.startsAt).toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: session.title.length > 34 ? 60 : 72,
              lineHeight: 1.03,
              letterSpacing: -2.5,
              fontWeight: 750,
            }}
          >
            {session.title}
          </div>
          <div style={{ display: "flex", marginTop: 24, color: "#d8dcec", fontSize: 29 }}>
            {formatSessionTime(session.startsAt, session.endsAt)} · {session.venueName}
          </div>
          <div style={{ display: "flex", marginTop: 13, color: "#9fa8c2", fontSize: 22 }}>
            {going} of {session.capacity} going · Hosted by {hostProfile?.name ?? "the host"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", width: 250, height: 5, borderRadius: 999, background: accent.solid }} />
          <div style={{ display: "flex", color: "#b9c2d4", fontSize: 20 }}>
            Open the link to view the plan and respond
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
