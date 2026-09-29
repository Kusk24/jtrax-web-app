/* How a course's balance reads against the academy's low-credit line: at or
   below it is low, up to twice it is a heads-up, anything above is fine. */

export type CreditTone = "low" | "near" | "ok";

export function creditTone(credits: number, lowAt: number): CreditTone {
  if (credits <= lowAt) return "low";
  if (credits <= lowAt * 2) return "near";
  return "ok";
}

/** The bar's share of the last top-up, 0–100; full when there is no top-up to compare with. */
export function creditShare(credits: number, of: number | null): number {
  if (!of || of <= 0) return 100;
  return Math.max(0, Math.min(100, (credits / of) * 100));
}
