"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";

export const TopNav = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("founderpace_userId");
      setUserId(storedUserId);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("founderpace_userId");
      setUserId(null);
      router.push("/");
      router.refresh();
    }
  };

  // Don't show nav if user is not logged in
  if (!userId) {
    return null;
  }

  return (
    <nav className="fixed top-0 right-0 z-50 p-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/founder/${userId}?edit=1`}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-300"
        >
          <Settings className="h-4 w-4" />
          Edit Profile
        </Link>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-300"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </nav>
  );
};

