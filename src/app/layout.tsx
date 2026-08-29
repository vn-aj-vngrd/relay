import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { OfflineIndicator } from "@/features/pwa/offline-indicator";
import { PwaManager } from "@/features/pwa/pwa-manager";

const inter = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "oklch(0.965 0.002 75)",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: { default: "Relay — Pickleball with friends", template: "%s · Relay" },
  description: "Plan casual pickleball with friends, share one invite, run the courts, and split the cost.",
  applicationName: "Relay",
  appleWebApp: { capable: true, title: "Relay", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002"),
  icons: {
    icon: [
      { url: "/relay-ball.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/relay-ball-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
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
            __html: `try{const t=localStorage.getItem('relay-theme');if(t==='dark'){document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark';document.querySelector('meta[name="theme-color"]')?.setAttribute('content','oklch(0.145 0.006 275)')}const d=localStorage.getItem('relay-density');if(d==='compact')document.documentElement.dataset.density='compact';const s=localStorage.getItem('relay-sidebar');if(s==='compact')document.documentElement.dataset.sidebar='compact'}catch{}`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${geistMono.variable}`}>
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
