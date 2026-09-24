/* The credit line on a parent's card for each child: credits used out of
   everything bought. */

/**
 * Credits spent out of everything bought, for "4 / 20 credits used" — how the
 * office talks about a package. The card used to say "{left} / 20 credits
 * left" with the 20 typed into the message, so a 40-credit package still read
 * as twenty.
 *
 * Never below zero: a balance moved in from another class is counted in the
 * balance but may predate this ledger's purchases.
 */
export function creditsUsed(balance: number, bought: number): number {
  return Math.max(0, Math.round((bought - balance) * 100) / 100);
}
