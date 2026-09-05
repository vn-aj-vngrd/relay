import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { BootstrapScripts } from "@/components/shared/bootstrap-scripts";

import { OfflineIndicator } from "@/features/pwa/offline-indicator";
import { PwaManager } from "@/features/pwa/pwa-manager";

const inter = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "oklch(0.965 0.002 75)",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

const siteOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

export const metadata: Metadata = {
  title: {
    default: "Relay — Pickleball planner, court finder and scorekeeper",
    template: "%s · Relay",
  },
  description:
    "Plan pickleball games, find verified courts in the Philippines, manage RSVPs and rotations, and keep score with Relay.",
  applicationName: "Relay",
  category: "sports",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Relay", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  metadataBase: new URL(siteOrigin),
  openGraph: {
    siteName: "Relay",
    locale: "en_PH",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/relay-ball.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/relay-ball-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Relay",
    url: siteOrigin,
    logo: new URL("/pwa-512.png", siteOrigin).toString(),
    description:
      "Pickleball planning, court discovery, rotations, and scoring for players in the Philippines.",
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Relay",
    url: siteOrigin,
    inLanguage: "en-PH",
  };

  return (
    <html lang="en-PH" data-theme="light" suppressHydrationWarning>
      <head>
        <BootstrapScripts development={process.env.NODE_ENV !== "production"} />
      </head>
      <body className={`${inter.variable} ${geistMono.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationJsonLd,
              websiteJsonLd,
            ]).replaceAll("<", "\\u003c"),
          }}
        />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
        <OfflineIndicator />
        <PwaManager enabled={process.env.NODE_ENV === "production"} />
        <Analytics />
      </body>
    </html>
  );
}
