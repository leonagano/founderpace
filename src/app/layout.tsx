import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "FounderPace — Your 2025 Running Year",
  description: "Generate a visual 365-dot grid of your Strava activities for 2025.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="who-hit-endpoint"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.WHOHIT_ENDPOINT = 'https://who-hit.vercel.app/api/track';`,
          }}
        />
        <Script src="https://who-hit.vercel.app/script.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
