"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type ChallengeJoinButtonProps = {
  challengeId: string;
  authorizeUrl?: string;
};

export const ChallengeJoinButton = ({ challengeId, authorizeUrl }: ChallengeJoinButtonProps) => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("founderpace_userId");
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      // Check if user is already joined
      fetch(`/api/challenges/${challengeId}/progress/${userId}`)
        .then((res) => {
          if (res.ok) {
            setIsJoined(true);
          }
        })
        .catch(() => {
          // Not joined yet
        });
    }
  }, [userId, challengeId]);

  const handleJoin = async () => {
    if (!userId) {
      setError("Please log in to join challenges");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join challenge");
      }

      setIsJoined(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join challenge");
    } finally {
      setIsJoining(false);
    }
  };

  if (!userId) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
        <p className="text-sm text-neutral-600">Please log in to join this challenge</p>
        {authorizeUrl && (
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
        )}
      </div>
    );
  }

  if (isJoined) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-semibold text-green-700">You've joined this challenge!</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleJoin}
        disabled={isJoining}
        className="w-full rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isJoining ? "Joining..." : "Join Challenge"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

