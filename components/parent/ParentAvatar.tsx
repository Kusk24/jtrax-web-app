"use client";

/* Initials avatar for the parent — the sandy.png asset arrived truncated past
   the DesignSync 256KiB cap, so the photo is not usable.

   The initial is the signed-in parent's. It was a hard-coded "S", from the
   sample parent the portal shipped with, so every family in the academy wore
   somebody else's letter. */
import { useParentData } from "@/components/parent/ParentData";

export function ParentAvatar({ className = "" }: { className?: string }) {
  const { parent } = useParentData();
  return (
    <span
      className={`flex items-center justify-center bg-pp-deep font-pp-display font-semibold text-white ${className}`}
    >
      {(parent.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
