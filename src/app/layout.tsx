import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: [
  { media: "(prefers-color-scheme: light)", color: "oklch(0.985 0.004 245)" },
  { media: "(prefers-color-scheme: dark)", color: "oklch(0.105 0.01 250)" },
] };

export const metadata: Metadata = {
  title: { default: "Relay — Pickleball with friends", template: "%s · Relay" },
  description: "Make the plan, run the courts, remember the game.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}><a href="#main-content" className="skip-link">Skip to content</a>{children}</body>
    </html>
  );
}
