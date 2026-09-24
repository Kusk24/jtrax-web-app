/**
 * The credit line on a child's card: used out of everything bought.
 *
 * It said "{left} / 20 credits left" with the 20 written into the message, so
 * it was wrong for any package that was not twenty credits.
 */
import { describe, expect, it } from "vitest";
import { creditsUsed } from "./credits-used";
import en from "../messages/en.json";
import th from "../messages/th.json";

describe("credits used out of the total", () => {
  it("is what was bought less what is left", () => {
    expect(creditsUsed(15, 20)).toBe(5);
    expect(creditsUsed(36, 40)).toBe(4);
  });

  it("keeps half-hour classes as halves", () => {
    expect(creditsUsed(17.5, 20)).toBe(2.5);
  });

  it("never goes below zero", () => {
    expect(creditsUsed(25, 20)).toBe(0);
  });

  it("takes the total from the ledger, not from the message", () => {
    for (const messages of [en, th]) {
      const label = messages.pv2.creditsUsedLabel;
      expect(label).toContain("{total");
      expect(label).not.toMatch(/\b20\b/);
    }
  });
});
