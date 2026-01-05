"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ActivityGrid } from "@/components/activity-grid";
import { buildStravaAuthorizeUrl } from "@/lib/strava";

type TokenData = {
  access_token: string;
  expires_at: number;
};

function HomeContent() {
  const searchParams = useSearchParams();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have token in URL params (from OAuth callback)
    const accessToken = searchParams.get("access_token");
    const expiresAt = searchParams.get("expires_at");

    if (accessToken && expiresAt) {
      const tokenData: TokenData = {
        access_token: accessToken,
        expires_at: parseInt(expiresAt, 10),
      };
      
      // Store in sessionStorage
      sessionStorage.setItem("strava_token", JSON.stringify(tokenData));
      setTokenData(tokenData);
      
      // Clean URL
      window.history.replaceState({}, "", "/");
    } else {
      // Check sessionStorage
      const stored = sessionStorage.getItem("strava_token");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as TokenData;
          // Check if token is still valid (not expired)
          const now = Math.floor(Date.now() / 1000);
          if (parsed.expires_at > now) {
            setTokenData(parsed);
          } else {
            sessionStorage.removeItem("strava_token");
          }
        } catch (e) {
          sessionStorage.removeItem("strava_token");
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (tokenData) {
      fetchActivities();
    }
  }, [tokenData]);

  const fetchActivities = async () => {
    if (!tokenData) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/activities", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const authorizeUrl = buildStravaAuthorizeUrl();
    window.location.href = authorizeUrl;
  };

  const urlError = searchParams.get("error");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      {!tokenData ? (
        <div className="text-center space-y-8 max-w-2xl">
          <h1 className="text-6xl sm:text-7xl font-semibold">FounderPace</h1>
          <p className="text-neutral-400 text-xl sm:text-2xl">
            Generate a visual 365-dot grid of your Strava activities for 2025
          </p>
          {urlError && (
            <div className="text-red-400 text-base">
              {urlError === "no_code" ? "Authorization cancelled" : decodeURIComponent(urlError)}
            </div>
          )}
          <button
            onClick={handleConnect}
            className="transition-opacity hover:opacity-90 scale-150 sm:scale-[1.75]"
          >
            <Image
              src="/btn_strava_connect_with_orange.png"
              alt="Connect with Strava"
              width={193}
              height={48}
              className="h-auto w-auto"
            />
          </button>
          <p></p>
          <a
            href="https://buy.stripe.com/fZu14m1UQ2mgcuwgQTbbG0A"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 text-lg hover:text-neutral-300 underline"
          >
            Your brand here
          </a>
        </div>
      ) : (
        <div className="w-full max-w-6xl space-y-6">
          {loading && (
            <div className="text-center text-neutral-400">Loading your activities...</div>
          )}
          {error && (
            <div className="text-center text-red-400">Error: {error}</div>
          )}
          {!loading && !error && activities.length > 0 && (
            <ActivityGrid activities={activities} />
          )}
          {!loading && !error && activities.length === 0 && (
            <div className="text-center text-neutral-400">
              No activities found for 2025
            </div>
          )}
        </div>
      )}
      <footer className="mt-auto pt-8 pb-4 text-center">
        <p className="text-neutral-500 text-sm">
          Created by <a href="https://x.com/leonagano" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white underline">Leo</a>
        </p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
