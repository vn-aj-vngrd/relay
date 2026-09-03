import { ImageResponse } from "next/og";

export const alt = "Relay — pickleball planning, courts, and scoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#171d38",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 38,
          display: "flex",
          border: "2px solid #d7edf433",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 38,
          bottom: 38,
          left: 600,
          width: 2,
          background: "#d7edf433",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 315,
          left: 600,
          right: 38,
          height: 2,
          background: "#d7edf433",
        }}
      />
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px 62px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 27,
            fontWeight: 750,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: "#b7d62e",
              display: "flex",
            }}
          />
          Relay
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 880 }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 69,
              lineHeight: 1.02,
              letterSpacing: -2.8,
              fontWeight: 760,
            }}
          >
            Plan the game. Share the link. Play.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 25,
              color: "#c4cbe0",
              fontSize: 27,
              lineHeight: 1.35,
            }}
          >
            Find Philippine courts, organize players, run rotations, and keep
            score.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 250,
              height: 6,
              borderRadius: 999,
              background: "#5964d9",
            }}
          />
          <div style={{ display: "flex", color: "#aeb7d2", fontSize: 20 }}>
            relay.vanajvanguardia.tech
          </div>
        </div>
      </div>
    </div>,
    size
  );
}
