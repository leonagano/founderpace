import React from "react";
import { Linkedin, Instagram } from "lucide-react";
import Link from "next/link";
import { Socials } from "@/lib/types";

const iconSize = 18;

// X icon component
const XIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const socialConfig = [
  {
    key: "x_handle",
    label: "X",
    icon: <XIcon size={iconSize} />,
    buildUrl: (value: string) => `https://x.com/${value.replace("@", "")}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin size={iconSize} />,
    buildUrl: (value: string) =>
      value.startsWith("http")
        ? value
        : `https://www.linkedin.com/in/${value.replace(/^@/, "")}`,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: <Instagram size={iconSize} />,
    buildUrl: (value: string) => `https://instagram.com/${value.replace("@", "")}`,
  },
] as const satisfies {
  key: keyof Socials;
  label: string;
  icon: React.ReactNode;
  buildUrl: (value: string) => string;
}[];

type SocialLinksProps = {
  socials?: Socials;
};

export const SocialLinks = ({ socials }: SocialLinksProps) => {
  if (!socials) return null;

  const entries = socialConfig
    .map((config) => {
      const value = socials[config.key];
      if (!value) return null;
      return { ...config, value };
    })
    .filter(
      (entry): entry is (typeof socialConfig)[number] & { value: string } =>
        entry !== null
    );

  if (!entries.length) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {entries.map((entry) => (
        <Link
          key={entry.label}
          href={entry.buildUrl(entry.value)}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 hover:border-neutral-900"
          target="_blank"
        >
          {entry.icon}
          {entry.label}
        </Link>
      ))}
    </div>
  );
};

