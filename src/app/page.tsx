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
  const [activitiesByYear, setActivitiesByYear] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

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
    if (tokenData && selectedYears.length > 0) {
      fetchActivitiesForYears(selectedYears);
    }
  }, [tokenData, selectedYears]);

  const fetchActivitiesForYears = async (years: number[]) => {
    if (!tokenData) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch activities for all selected years in parallel
      const fetchPromises = years.map(async (year) => {
        // Check if we already have data for this year
        if (activitiesByYear[year]) {
          return { year, activities: activitiesByYear[year] };
        }

        const res = await fetch(`/api/activities?year=${year}`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch activities for ${year}`);
        }

        const data = await res.json();
        return { year, activities: data.activities || [] };
      });

      const results = await Promise.all(fetchPromises);
      
      // Update state with all fetched activities
      const newActivitiesByYear = { ...activitiesByYear };
      results.forEach(({ year, activities }) => {
        newActivitiesByYear[year] = activities;
      });
      setActivitiesByYear(newActivitiesByYear);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  };

  const handleYearToggle = (year: number) => {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        // Remove year if already selected
        return prev.filter((y) => y !== year);
      } else {
        // Add year if not selected
        return [...prev, year].sort((a, b) => b - a); // Sort descending
      }
    });
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
            Generate a visual 365-dot grid of your Strava activities
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
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center mt-8">
            <div className="flex flex-col items-center">
              <p className="text-neutral-500 text-sm mb-2">Heatmap View</p>
              <Image
                src="/heatmap-sample.png"
                alt="Heatmap sample"
                width={600}
                height={600}
                className="rounded-lg border border-neutral-800 max-w-full h-auto"
              />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-neutral-500 text-sm mb-2">Grid View</p>
              <Image
                src="/grid-sample.png"
                alt="Grid sample"
                width={600}
                height={600}
                className="rounded-lg border border-neutral-800 max-w-full h-auto"
              />
            </div>
          </div>
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
          {/* Year Selector - Checkboxes */}
          <div className="flex flex-col items-center gap-4">
            <label className="text-neutral-400 text-sm">Select years to visualize:</label>
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
              {Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <label
                    key={year}
                    className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={() => handleYearToggle(year)}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-orange-500 focus:ring-orange-500 focus:ring-2"
                    />
                    <span className="text-neutral-300 text-sm">{year}</span>
                  </label>
                );
              })}
            </div>
            {selectedYears.length === 0 && (
              <p className="text-neutral-500 text-sm">Please select at least one year</p>
            )}
          </div>
          {loading && (
            <div className="text-center text-neutral-400">Loading your activities...</div>
          )}
          {error && (
            <div className="text-center text-red-400">Error: {error}</div>
          )}
          {!loading && !error && selectedYears.length > 0 && (
            <ActivityGrid activitiesByYear={activitiesByYear} selectedYears={selectedYears} />
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
