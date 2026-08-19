import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

const inter = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: "oklch(0.965 0.002 75)" };

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
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('relay-theme');if(t==='dark'){document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'}const d=localStorage.getItem('relay-density');if(d==='compact')document.documentElement.dataset.density='compact';const s=localStorage.getItem('relay-sidebar');if(s==='compact')document.documentElement.dataset.sidebar='compact'}catch{}`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${geistMono.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
