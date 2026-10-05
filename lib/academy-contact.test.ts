import { describe, expect, it } from "vitest";
import { ACADEMY_CONTACT, contactFrom, lineHref } from "./academy-contact";

describe("academy contact", () => {
  it("reads LINE however the office typed it", () => {
    expect(lineHref("https://lin.ee/7fhq3N1")).toBe("https://lin.ee/7fhq3N1");
    expect(lineHref("lin.ee/7fhq3N1")).toBe("https://lin.ee/7fhq3N1");
    expect(lineHref("@jcachess")).toBe("https://line.me/R/ti/p/@jcachess");
  });

  it("uses what was saved, and the website's details for anything empty", () => {
    expect(contactFrom({ phone: "02-111-2222 / 080-000-0000", lineId: "@jca" })).toEqual({
      phones: ["02-111-2222", "080-000-0000"], email: ACADEMY_CONTACT.email, line: "https://line.me/R/ti/p/@jca",
    });
    expect(contactFrom({})).toEqual(ACADEMY_CONTACT);
  });
});
