import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Relay — Pickleball with friends",
    short_name: "Relay",
    description: "Plan pickleball games, invite players, run the courts, split costs, and record scores.",
    start_url: "/home?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#f7f7f5",
    categories: ["sports", "social", "lifestyle"],
    lang: "en-PH",
    dir: "ltr",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Create a game",
        short_name: "Create",
        description: "Start a new pickleball session.",
        url: "/games/new?source=pwa-shortcut",
        icons: [{ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Games",
        short_name: "Games",
        description: "Open your upcoming and recent games.",
        url: "/games?source=pwa-shortcut",
        icons: [{ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Find a court",
        short_name: "Court",
        description: "Open the Philippines Court Finder.",
        url: "/court?source=pwa-shortcut",
        icons: [{ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
