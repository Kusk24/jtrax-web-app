import { describe, expect, it } from "vitest";
import { creditsSinceTopUp } from "./credit-total";

describe("creditsSinceTopUp", () => {
  it("is the package bought, before any classes", () => {
    expect(
      creditsSinceTopUp([
        { transaction_date: "2026-09-01", amount: 20 },
        { transaction_date: "2026-09-02", amount: -1 },
        { transaction_date: "2026-09-05", amount: -1 },
      ]),
    ).toBe(20);
  });
  it("counts what was left over when topping up again", () => {
    expect(
      creditsSinceTopUp([
        { transaction_date: "2026-08-01", amount: 20 },
        { transaction_date: "2026-08-20", amount: -17 },
        { transaction_date: "2026-09-01", amount: 20 },
        { transaction_date: "2026-09-02", amount: -2 },
      ]),
    ).toBe(23);
  });
  it("puts a same-day top-up before that day's class", () => {
    expect(
      creditsSinceTopUp([
        { transaction_date: "2026-09-01", amount: -1.5 },
        { transaction_date: "2026-09-01", amount: 10 },
      ]),
    ).toBe(10);
  });
  it("is null with nothing bought", () => {
    expect(creditsSinceTopUp([])).toBeNull();
  });
});
