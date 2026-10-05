import { describe, expect, it } from "vitest";
import { mapUrlOf, regulationUrlOf } from "./parent-v2-data";

describe("regulationUrlOf", () => {
  it("opens the uploaded file through this app", () => {
    expect(regulationUrlOf("trn_1", true, "")).toBe("/api/tournaments/trn_1/regulation");
  });
  it("falls back to a link the office pasted", () => {
    expect(regulationUrlOf("trn_1", false, "https://example.com/rules.pdf")).toBe("https://example.com/rules.pdf");
  });
  it("is empty when there is nothing, or nothing safe, to open", () => {
    expect(regulationUrlOf("trn_1", false, "")).toBe("");
    expect(regulationUrlOf("trn_1", false, "javascript:alert(1)")).toBe("");
  });
});

describe("mapUrlOf", () => {
  it("prefers the exact map link", () => {
    expect(mapUrlOf("https://maps.app.goo.gl/abc", "JCA Hall", "Bangkok")).toBe("https://maps.app.goo.gl/abc");
  });
  it("searches the venue's name and address otherwise", () => {
    expect(mapUrlOf("", "JCA Hall", "Bangkok")).toBe(
      "https://www.google.com/maps/search/?api=1&query=JCA%20Hall%2C%20Bangkok",
    );
  });
  it("is empty with no venue at all", () => {
    expect(mapUrlOf("", "", "  ")).toBe("");
  });
});
