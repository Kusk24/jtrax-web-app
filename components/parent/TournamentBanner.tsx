import { Trophy } from "lucide-react";
import { PawnIcon } from "@/components/PawnIcon";

/* Designed banner: the original poster asset arrived truncated past the
   DesignSync 256KiB cap, so the art is rebuilt as a gradient composition. */
export function TournamentBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(135deg,var(--color-pp-deep) 0%,#1E3F87 55%,#162F5C 100%)",
      }}
    >
      {/* faint chessboard field */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[.08]"
        style={{
          backgroundImage:
            "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)",
          backgroundSize: "44px 44px",
        }}
      />
      <PawnIcon className="absolute -left-3 -bottom-4 size-24 text-white opacity-15" />
      <PawnIcon className="absolute right-6 -top-3 size-16 rotate-12 text-white opacity-10" />
      <div className="relative flex flex-col items-center gap-1.5 text-white">
        <Trophy className="size-7 opacity-90" strokeWidth={1.6} />
        <span className="font-pp-display text-[15px] font-bold uppercase tracking-[.22em]">
          Chess Championship
        </span>
        <span className="rounded-full border border-white/40 px-3 py-0.5 text-[10.5px] font-bold tracking-[.3em]">
          2026
        </span>
      </div>
    </div>
  );
}
