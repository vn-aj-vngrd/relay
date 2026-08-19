import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Relay — Pickleball with friends",
    short_name: "Relay",
    description: "One shared home for the plan, players, courts, scores, repayment, chat, and recap.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#f7f7f5",
    categories: ["sports", "social", "lifestyle"],
    icons: [
      { src: "/relay-ball.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
