"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut, Plus } from "lucide-react";

export const TopNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkUserId = async () => {
      if (typeof window !== "undefined") {
        const storedUserId = localStorage.getItem("founderpace_userId");
        setUserId(storedUserId);
        
        // Fetch slug from API if userId exists
        if (storedUserId) {
          try {
            const response = await fetch(`/api/user/${storedUserId}/slug`);
            if (response.ok) {
              const data = await response.json();
              setUserSlug(data.slug);
            }
          } catch (error) {
            console.error("Failed to fetch user slug:", error);
          }
        } else {
          setUserSlug(null);
        }
      }
    };
    
    // Check on mount
    checkUserId();
    
    // Listen for storage changes (when localStorage is updated from another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "founderpace_userId") {
        checkUserId();
      }
    };
    
    // Listen for custom event (when localStorage is updated in same tab)
    const handleCustomStorageChange = () => {
      checkUserId();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorageChange", handleCustomStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorageChange", handleCustomStorageChange);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("founderpace_userId");
      setUserId(null);
      router.push("/");
      router.refresh();
    }
  };

  // Don't render until after mount to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Don't show nav if user is not logged in
  if (!userId) {
    return null;
  }

  return (
    <nav className="fixed top-0 right-0 z-50 p-2 sm:p-4 max-w-[calc(100vw-1rem)]">
      <div className="flex items-center justify-end gap-1 sm:gap-1.5 lg:gap-2 flex-wrap">
        <Link
          href="/challenges"
          className={`inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-semibold shadow-sm transition hover:bg-neutral-50 hover:border-neutral-300 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-sm ${
            pathname === "/challenges" ? "text-neutral-900 border-neutral-300" : "text-neutral-700"
          }`}
        >
          Challenges
        </Link>
        {userId && (
          <Link
            href="/challenges/create"
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-300 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-sm"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Create Challenge</span>
            <span className="sm:hidden">Create</span>
          </Link>
        )}
        <Link
          href={userSlug ? `/founder/${userSlug}?edit=1` : userId ? `/founder/${userId}?edit=1` : "#"}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-300 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-sm"
        >
          <Settings className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
          <span className="hidden sm:inline">Edit Profile</span>
          <span className="sm:hidden">Edit</span>
        </Link>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:border-neutral-300 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-sm"
        >
          <LogOut className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Out</span>
        </button>
      </div>
    </nav>
  );
};

