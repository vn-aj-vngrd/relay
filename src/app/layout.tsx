import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { OfflineIndicator } from "@/features/pwa/offline-indicator";
import { PwaManager } from "@/features/pwa/pwa-manager";
import { THEME_INIT_SCRIPT } from "@/lib/theme-init";

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
        {process.env.NODE_ENV !== "production" ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(()=>{if(!('serviceWorker'in navigator))return;const k='relay-development-sw-cleanup';if(!navigator.serviceWorker.controller){sessionStorage.removeItem(k);return}if(sessionStorage.getItem(k)==='1'){sessionStorage.removeItem(k);return}sessionStorage.setItem(k,'1');window.stop();Promise.all([navigator.serviceWorker.getRegistrations().then(r=>Promise.all(r.map(x=>x.unregister()))),('caches'in window?caches.keys().then(n=>Promise.all(n.filter(x=>x.startsWith('relay-pwa-')).map(x=>caches.delete(x)))):Promise.resolve())]).finally(()=>location.reload())})()`,
            }}
          />
        ) : null}
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
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
