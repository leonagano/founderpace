"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SocialsForm } from "@/components/socials-form";
import { Socials } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "success"; userId: string }
  | { status: "error"; message: string; isPermissionError?: boolean };

function StravaCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const errorMessage = searchParams.get("error");
  const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);
  const [state, setState] = useState<State>(() => {
    if (errorMessage) {
      return { status: "error", message: errorMessage };
    }
    if (!code) {
      return { status: "error", message: "Missing authorization code" };
    }
    return { status: "loading" };
  });

  // Fetch authorization URL for retry button
  useEffect(() => {
    const fetchAuthorizeUrl = async () => {
      try {
        const res = await fetch("/api/oauth/strava/authorize-url");
        if (res.ok) {
          const json = await res.json();
          setAuthorizeUrl(json.authorizeUrl);
        }
      } catch {
        // Ignore errors
      }
    };
    fetchAuthorizeUrl();
  }, []);

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
          const json = await res.json();
          // Check if this is a permission error
          if (json.error === "PRIVATE_ACTIVITIES_REQUIRED") {
            setState({ 
              status: "error", 
              message: "Please enable 'View data about your private activities' permission in Strava",
              isPermissionError: true 
            });
            return;
          }
          setState({ status: "error", message: "Unable to finish onboarding" });
          return;
        }
        const json = await res.json();
        // Store userId in localStorage for profile editing
        if (typeof window !== "undefined" && json.userId) {
          localStorage.setItem("founderpace_userId", json.userId);
          // Dispatch custom event to notify TopNav
          window.dispatchEvent(new Event("localStorageChange"));
        }
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-6">
      <div className="flex h-full max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-neutral-200 bg-white text-center">
        <div className="flex-1 overflow-y-auto p-10">
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
              <p className="mt-2 text-xs text-neutral-400">
                Privacy: We respect your privacy. We only store date/time started, distance, and run
                duration. No location data is collected or stored.
              </p>
              <div className="mt-4 text-left">
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
                  showButton={true}
                />
              )}
              </div>
            </>
          )}
          {state.status === "error" && (
            <>
              <h1 className="text-2xl font-semibold text-red-600">
                {state.isPermissionError ? "Permission Required" : "Something failed"}
              </h1>
              <p className="mt-2 text-sm text-neutral-500">{state.message}</p>
              {state.isPermissionError && (
                <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left">
                  <p className="text-sm font-semibold text-neutral-900">What to do:</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-neutral-600">
                    <li>Go to homepage and click on "Connect with Strava"</li>
                    <li>Make sure to check the box for "View data about your private activities"</li>
                    <li>Try connecting again</li>
                  </ol>
                  <p className="mt-4 text-xs text-neutral-500">
                    <strong>Privacy note:</strong> FounderPace only stores run date/time, duration, and distance. 
                    We do not collect or store any location data or other  personal information.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        {state.status === "success" && !profileLoading && (
          <div className="border-t border-neutral-200 bg-white p-4 space-y-2">
            <button
              type="submit"
              form="socials-form"
              className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Save socials
            </button>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Back to leaderboard
            </Link>
          </div>
        )}
        {state.status === "error" && (
          <div className="border-t border-neutral-200 bg-white p-4 space-y-2">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              {state.isPermissionError ? "Go to homepage" : "Try again"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StravaCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-10 text-center">
            <h1 className="text-2xl font-semibold text-neutral-900">Loading…</h1>
          </div>
        </div>
      }
    >
      <StravaCallbackContent />
    </Suspense>
  );
}

