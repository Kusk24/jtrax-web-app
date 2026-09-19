/**
 * Formatting an amount of money.
 *
 * One place, because the ISO code is the whole point: the academy's currency
 * is baht, and "฿" and "B" and "K" have all been read as something else by
 * somebody. `Intl` with `currencyDisplay: "code"` always says THB.
 */
export function money(amount: number, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "THB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}
