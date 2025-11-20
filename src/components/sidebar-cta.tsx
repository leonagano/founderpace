"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type SidebarCtaProps = {
  authorizeUrl: string;
  advertiseUrl?: string;
};

export const SidebarCta = ({ authorizeUrl, advertiseUrl }: SidebarCtaProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("founderpace_userId");
      setIsLoggedIn(!!storedUserId);
    }
  }, []);

  // Don't render until after mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="rounded-2xl border border-dashed border-neutral-200/80 p-4 text-center">
          <p className="text-sm font-semibold text-neutral-900">Advertise</p>
          <p className="mt-1 text-xs text-neutral-500">30-day sponsorship</p>
          <Link
            href={advertiseUrl ?? "mailto:hello@founderpace.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:text-white"
          >
            Book a slot
          </Link>
        </div>
        <div className="rounded-2xl border border-dashed border-neutral-200/80 p-4 text-center">
          <p className="text-xs text-neutral-700">
            Private leaderboards and challenges for teams/companies are supported.{" "}
            <Link
              href="/founder/leo-nagano"
              className="text-neutral-900 underline hover:text-neutral-700"
            >
              Contact me
            </Link>
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6">
      {!isLoggedIn && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Join leaderboard</h3>
          <p className="mt-1 text-sm text-neutral-500">
            We only accept Strava-verified runs. Connect your account to get listed.
          </p>
          <Link
            href={authorizeUrl}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-neutral-200 p-1"
          >
            <Image
              src="/btn_strava_connect_with_white.png"
              alt="Connect with Strava"
              width={193}
              height={48}
              className="h-auto w-full max-w-[193px]"
            />
          </Link>
          <p className="mt-3 text-xs text-neutral-400">
            Privacy: We only store date/time, distance, and duration. No location data is collected.
          </p>
        </div>
      )}
      <div className="rounded-2xl border border-dashed border-neutral-200/80 p-4 text-center">
        <p className="text-sm font-semibold text-neutral-900">Advertise</p>
        <p className="mt-1 text-xs text-neutral-500">30-day sponsorship</p>
        <Link
          href={advertiseUrl ?? "mailto:hello@founderpace.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:text-white"
        >
          Book a slot
        </Link>
      </div>
      <div className="rounded-2xl border border-dashed border-neutral-200/80 p-4 text-center">
        <p className="text-xs text-neutral-500">
          Private leaderboards and challenges for teams/companies are supported.{" "}
          <Link
            href="/founder/leo-nagano"
            className="text-neutral-900 underline hover:text-neutral-700"
          >
            Contact me
          </Link>
        </p>
      </div>
    </aside>
  );
};

