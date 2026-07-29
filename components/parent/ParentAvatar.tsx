/* Initials avatar for the parent — the sandy.png asset arrived truncated
   past the DesignSync 256KiB cap, so the photo is not usable. */
export function ParentAvatar({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center bg-pp-deep font-pp-display font-semibold text-white ${className}`}
    >
      S
    </span>
  );
}
