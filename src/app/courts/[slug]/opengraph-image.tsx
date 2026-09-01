import { ImageResponse } from "next/og";

import { getCourtListingBySlug } from "@/features/venues/directory";

export const alt = "Verified pickleball court in the Philippines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CourtOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const court = await getCourtListingBySlug((await params).slug);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#f7f7f5",
        color: "#171719",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 390,
          display: "flex",
          background: "#171d38",
        }}
      >
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 194, width: 2, background: "#d7edf44d" }} />
        <div style={{ position: "absolute", top: 315, left: 194, right: 0, height: 2, background: "#d7edf44d" }} />
      </div>
      <div
        style={{
          width: 810,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 68px 58px",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 13, color: "#5964d9", fontSize: 24, fontWeight: 750 }}
        >
          <span style={{ width: 26, height: 26, borderRadius: 999, background: "#b7d62e", display: "flex" }} />
          Relay Court Finder
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: "#5964d9", fontSize: 20, fontWeight: 750 }}>
            VERIFIED PHILIPPINES COURT
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              fontSize: court && court.name.length > 34 ? 50 : 59,
              lineHeight: 1.04,
              letterSpacing: -2.2,
              fontWeight: 760,
            }}
          >
            {court?.name ?? "Pickleball court"}
          </div>
          <div style={{ display: "flex", marginTop: 22, color: "#62646d", fontSize: 23, lineHeight: 1.35 }}>
            {court?.address ?? "Find pickleball courts across the Philippines."}
          </div>
        </div>
        <div style={{ display: "flex", color: "#73757d", fontSize: 19 }}>
          Court details · directions · booking information
        </div>
      </div>
    </div>,
    size,
  );
}
