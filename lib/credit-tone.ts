/* How a course's balance reads against the academy's low-credit line: at or
   below it is low, up to twice it is a heads-up, anything above is fine. */

export type CreditTone = "low" | "near" | "ok";

export function creditTone(credits: number, lowAt: number): CreditTone {
  if (credits <= lowAt) return "low";
  if (credits <= lowAt * 2) return "near";
  return "ok";
}

/** The bar's share of the last top-up, 0–100. Nothing left is an empty bar,
    always; a balance with no top-up to compare with is a full one. */
export function creditShare(credits: number, of: number | null): number {
  if (credits <= 0) return 0;
  if (!of || of <= 0) return 100;
  return Math.max(0, Math.min(100, (credits / of) * 100));
}
