"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SocialsForm } from "@/components/socials-form";
import { Socials } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "success"; userId: string }
  | { status: "error"; message: string };

export default function StravaCallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const errorMessage = searchParams.get("error");
  const [state, setState] = useState<State>(() => {
    if (errorMessage) {
      return { status: "error", message: errorMessage };
    }
    if (!code) {
      return { status: "error", message: "Missing authorization code" };
    }
    return { status: "loading" };
  });

  useEffect(() => {
    if (!code || errorMessage) {
      return;
    }

    const exchange = async () => {
      try {
        const res = await fetch("/api/oauth/strava/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          setState({ status: "error", message: "Unable to finish onboarding" });
          return;
        }
        const json = await res.json();
        setState({ status: "success", userId: json.userId });
      } catch {
        setState({ status: "error", message: "Network error" });
      }
    };

    exchange();
  }, [code, errorMessage]);

  const [profileInfo, setProfileInfo] = useState<{
    socials?: Socials;
    startupName?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (state.status !== "success") return;
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(`/api/user/${state.userId}`);
        if (!res.ok) {
          setProfileInfo(null);
          return;
        }
        const json = await res.json();
        setProfileInfo({
          socials: json.user?.socials,
          startupName: json.user?.startup_name,
        });
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [state]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        {state.status === "loading" && (
          <>
            <h1 className="text-2xl font-semibold text-neutral-900">Syncing Strava…</h1>
            <p className="mt-2 text-sm text-neutral-500">
              We are fetching your verified runs and building your stats.
            </p>
          </>
        )}
        {state.status === "success" && (
          <>
            <h2 className="text-neutral-900">All synced....</h2>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-500">
              Add your socials below so other founders can reach you
            </h1>
            <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
              Quick heads-up: once you hit save, you won&apos;t be able to edit these again
              without pinging me (edit your profile is coming later).
            </p>
            <p className="mt-3 text-xs text-neutral-400">
              Privacy: We respect your privacy. We only store date/time started, distance, and run
              duration. No location data is collected or stored.
            </p>
            <div className="mt-6 text-left">
              {profileLoading && (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
                  Loading your details…
                </div>
              )}
              {!profileLoading && (
                <SocialsForm
                  userId={state.userId}
                  initialSocials={profileInfo?.socials}
                  initialStartupName={profileInfo?.startupName}
                />
              )}
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700"
            >
              Back to leaderboard
            </Link>
          </>
        )}
        {state.status === "error" && (
          <>
            <h1 className="text-2xl font-semibold text-red-600">Something failed</h1>
            <p className="mt-2 text-sm text-neutral-500">{state.message}</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700"
            >
              Try again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

