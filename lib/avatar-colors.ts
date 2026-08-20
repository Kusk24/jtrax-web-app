/** Avatar tints. Distinct hues tell people apart at a glance, but they stay in
 *  the academy's family instead of Tailwind's default rainbow. Every pair is at
 *  least 4.5:1, so the initial is readable, not decorative. */
export const AVATAR_TINTS = {
  navy: "bg-[#dbe4f5] text-[#24417c]",
  mint: "bg-[#d8ece1] text-[#2c624a]",
  sky: "bg-[#d6e7f4] text-[#1d5470]",
  lilac: "bg-[#e2e0f3] text-[#474184]",
  sand: "bg-[#f2e7d3] text-[#75521f]",
  rose: "bg-[#f6dee1] text-[#8b3843]",
} as const;

export type AvatarTint = (typeof AVATAR_TINTS)[keyof typeof AVATAR_TINTS];
