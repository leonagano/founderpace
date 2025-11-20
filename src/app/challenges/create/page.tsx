"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChallengeRulesetType, challengeRulesetTypes } from "@/lib/types";

export default function CreateChallengePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ruleset_type: "distance_total" as ChallengeRulesetType,
    target_km: "",
    target_minutes: "",
    interval_days: "",
    per_day_km: "",
    per_day_minutes: "",
    required_frequency: "",
    start_date: "",
    end_date: "",
    sponsor_name: "",
    sponsor_logo_url: "",
    sponsor_link: "",
    sponsor_prize_description: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("founderpace_userId");
      if (!storedUserId) {
        router.push("/");
        return;
      }
      setUserId(storedUserId);
      // Set default start date to today
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, start_date: today }));
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const ruleset_config: Record<string, number | undefined> = {};
      if (formData.ruleset_type === "distance_total" && formData.target_km) {
        ruleset_config.target_km = parseFloat(formData.target_km);
      } else if (formData.ruleset_type === "distance_recurring") {
        if (formData.per_day_km) ruleset_config.per_day_km = parseFloat(formData.per_day_km);
        if (formData.interval_days) ruleset_config.interval_days = parseInt(formData.interval_days);
      } else if (formData.ruleset_type === "duration_total" && formData.target_minutes) {
        ruleset_config.target_minutes = parseInt(formData.target_minutes);
      } else if (formData.ruleset_type === "duration_recurring") {
        if (formData.per_day_minutes)
          ruleset_config.per_day_minutes = parseInt(formData.per_day_minutes);
        if (formData.interval_days) ruleset_config.interval_days = parseInt(formData.interval_days);
      } else if (formData.ruleset_type === "frequency_based" && formData.required_frequency) {
        ruleset_config.required_frequency = parseInt(formData.required_frequency);
      }

      const sponsor =
        formData.sponsor_name || formData.sponsor_link || formData.sponsor_prize_description
          ? {
              name: formData.sponsor_name || undefined,
              logo_url: formData.sponsor_logo_url || undefined,
              link: formData.sponsor_link || undefined,
              prize_description: formData.sponsor_prize_description || undefined,
            }
          : undefined;

      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_user_id: userId,
          title: formData.title,
          description: formData.description,
          ruleset_type: formData.ruleset_type,
          ruleset_config,
          start_date: formData.start_date,
          end_date: formData.end_date,
          sponsor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create challenge");
      }

      const { challenge } = await response.json();
      router.push(`/challenges/${challenge._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create challenge");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 lg:px-0">
      <Link href="/" className="flex items-center gap-2 sm:gap-3 pr-20 sm:pr-0">
        <Image
          src="/icon_transparent.png"
          alt="FounderPace icon"
          width={56}
          height={56}
          priority
          className="h-10 w-10 sm:h-14 sm:w-14"
        />
        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-500 sm:text-sm">
          FounderPace
        </span>
      </Link>

      <Link href="/challenges" className="text-xs text-neutral-500 hover:text-neutral-900 sm:text-sm">
        ← Back to challenges
      </Link>

      <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">Create Challenge</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Title *
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              placeholder="Run 120 km in 30 days"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Description *
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              placeholder="Challenge description..."
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Challenge Type *
            <select
              required
              value={formData.ruleset_type}
              onChange={(e) =>
                setFormData({ ...formData, ruleset_type: e.target.value as ChallengeRulesetType })
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            >
              <option value="distance_total">Distance Total (e.g., Run 120 km in 30 days)</option>
              <option value="distance_recurring">Distance Recurring (e.g., 5 km every day)</option>
              <option value="duration_total">Duration Total (e.g., Run 600 minutes this month)</option>
              <option value="duration_recurring">Duration Recurring (e.g., 30 min every 2 days)</option>
              <option value="frequency_based">Frequency Based (e.g., Run 3 times per week)</option>
            </select>
          </label>
        </div>

        {formData.ruleset_type === "distance_total" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Target Distance (km) *
              <input
                type="number"
                step="0.1"
                required
                value={formData.target_km}
                onChange={(e) => setFormData({ ...formData, target_km: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </label>
          </div>
        )}

        {formData.ruleset_type === "distance_recurring" && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Distance per Day (km) *
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.per_day_km}
                  onChange={(e) => setFormData({ ...formData, per_day_km: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Interval (days) *
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.interval_days}
                  onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>
          </>
        )}

        {formData.ruleset_type === "duration_total" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Target Duration (minutes) *
              <input
                type="number"
                required
                value={formData.target_minutes}
                onChange={(e) => setFormData({ ...formData, target_minutes: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </label>
          </div>
        )}

        {formData.ruleset_type === "duration_recurring" && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Duration per Day (minutes) *
                <input
                  type="number"
                  required
                  value={formData.per_day_minutes}
                  onChange={(e) => setFormData({ ...formData, per_day_minutes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Interval (days) *
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.interval_days}
                  onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>
          </>
        )}

        {formData.ruleset_type === "frequency_based" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Required Frequency (times per week) *
              <input
                type="number"
                required
                min="1"
                max="7"
                value={formData.required_frequency}
                onChange={(e) => setFormData({ ...formData, required_frequency: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Start Date *
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              End Date *
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Sponsor (Optional)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Sponsor Name
                <input
                  type="text"
                  value={formData.sponsor_name}
                  onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Sponsor Logo URL
                <input
                  type="url"
                  value={formData.sponsor_logo_url}
                  onChange={(e) => setFormData({ ...formData, sponsor_logo_url: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Sponsor Link
                <input
                  type="url"
                  value={formData.sponsor_link}
                  onChange={(e) => setFormData({ ...formData, sponsor_link: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Prize Description
                <textarea
                  value={formData.sponsor_prize_description}
                  onChange={(e) =>
                    setFormData({ ...formData, sponsor_prize_description: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Challenge"}
        </button>
      </form>
    </div>
  );
}

