"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};

/**
 * Reusable user avatar component.
 * Shows the profile picture if available, otherwise shows initials.
 * Falls back to initials if the image fails to load.
 */
export function UserAvatar({ name, avatar, size = "md", className }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const showImage = avatar && !imgError;

  return (
    <>
      {showImage ? (
        <img
          src={avatar}
          alt={name}
          onError={() => setImgError(true)}
          className={cn(
            "rounded-full object-cover border-2 border-primary/20 shadow-sm",
            SIZE_CLASSES[size],
            className
          )}
        />
      ) : (
        <div
          className={cn(
            "grid place-items-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm",
            SIZE_CLASSES[size],
            className
          )}
        >
          {initials}
        </div>
      )}
    </>
  );
}
