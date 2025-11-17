"use client";

import { FormEvent, useState, useTransition } from "react";
import { Socials } from "@/lib/types";

type SocialsFormProps = {
  userId: string;
  initialSocials?: Socials;
  initialStartupName?: string;
};

const sanitizeHandle = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const withoutDomains = withoutProtocol
    .replace(/^www\./i, "")
    .replace(/^(x|twitter|instagram|linkedin)\.com\//i, "");
  const withoutAt = withoutDomains.replace(/^@/, "");
  const parts = withoutAt.split(/[/?]/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
};

const sanitizeLinkedIn = (value: string) => {
  if (!value) return "";
  const cleaned = sanitizeHandle(value);
  return cleaned.replace(/^in\//, "").replace(/^company\//, "");
};

const sanitizeWebsite = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const SocialsForm = ({
  userId,
  initialSocials,
  initialStartupName,
}: SocialsFormProps) => {
  const [socials, setSocials] = useState<Socials>({
    x_handle: initialSocials?.x_handle ?? "",
    linkedin: initialSocials?.linkedin ?? "",
    instagram: initialSocials?.instagram ?? "",
    website: initialSocials?.website ?? "",
  });
  const [startupName, setStartupName] = useState(initialStartupName ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const normalizedSocials: Socials = {
        x_handle: sanitizeHandle(socials.x_handle ?? ""),
        instagram: sanitizeHandle(socials.instagram ?? ""),
        linkedin: sanitizeLinkedIn(socials.linkedin ?? ""),
        website: sanitizeWebsite(socials.website ?? ""),
      };
      const res = await fetch("/api/user/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, socials: normalizedSocials, startupName }),
      });
      setMessage(res.ok ? "Saved" : "Unable to save");
      if (res.ok) {
        setSocials(normalizedSocials);
      }
    });
  };

  const handleChange = (key: keyof Socials, value: string) => {
    setSocials((prev) => ({ ...prev, [key]: value }));
  };

  const fields: {
    key: keyof Socials;
    label: string;
    placeholder: string;
    helper?: string;
  }[] = [
    {
      key: "website",
      label: "Website",
      placeholder: "https://yourstartup.com",
    },
    {
      key: "x_handle",
      label: "X handle",
      placeholder: "@founderpace",
      helper: "Handle only. We'll remove https:// for you.",
    },
    {
      key: "instagram",
      label: "Instagram handle",
      placeholder: "@founderpace",
    },
    {
      key: "linkedin",
      label: "LinkedIn handle",
      placeholder: "in/founder",
      helper: "Just the handle (e.g. in/founder).",
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Social links
        </h4>
        <p className="text-sm text-neutral-500">
          Optional but public. Add them now — updating later will require manual help while
          we finish the profile editor.
        </p>
      </div>
      <label className="block text-sm font-medium text-neutral-700">
        Startup name
        <input
          value={startupName}
          onChange={(e) => setStartupName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          placeholder="Acme Robotics"
        />
      </label>
      {fields.map(({ key, label, placeholder, helper }) => (
        <label key={key} className="block text-sm font-medium text-neutral-700">
          {label}
          <input
            value={socials[key] ?? ""}
            onChange={(e) => handleChange(key, e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            placeholder={placeholder}
          />
          {helper && <span className="text-xs text-neutral-400">{helper}</span>}
        </label>
      ))}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save socials"}
      </button>
      {message && <p className="text-center text-xs text-neutral-500">{message}</p>}
    </form>
  );
};

