import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Footer } from "@/components/footer";
import { TopNav } from "@/components/top-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FounderPace — Founders who run",
  description:
    "Public, Strava-verified leaderboard for founders tracking their running volume and pace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-neutral-50 text-neutral-950 antialiased overflow-x-hidden`}
      >
        <Script
          id="who-hit-endpoint"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.WHOHIT_ENDPOINT = 'https://who-hit.vercel.app/api/track';`,
          }}
        />
        <Script src="https://who-hit.vercel.app/script.js" strategy="afterInteractive" />
        <TopNav />
        <main className="min-h-screen overflow-x-hidden">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
