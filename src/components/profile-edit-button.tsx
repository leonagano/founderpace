"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Settings } from "lucide-react";

type ProfileEditButtonProps = {
  profileUserId: string;
};

export const ProfileEditButton = ({ profileUserId }: ProfileEditButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUserId = localStorage.getItem("founderpace_userId");
    setIsOwnProfile(storedUserId === profileUserId);
    
    // Check if we're in edit mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    setIsEditMode(urlParams.get("edit") === "1");
  }, [profileUserId]);

  if (!isOwnProfile) {
    return null;
  }

  const toggleEdit = () => {
    if (isEditMode) {
      // Exit edit mode
      router.push(pathname);
    } else {
      // Enter edit mode
      router.push(`${pathname}?edit=1`);
    }
  };

  
};

