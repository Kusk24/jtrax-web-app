import { describe, expect, it } from "vitest";
import { homeAnnouncements } from "./home-announcements";

const now = new Date("2026-10-05T12:00:00Z");
const ann = (id: string, postedAt: string) => ({ id, postedAt });

describe("homeAnnouncements", () => {
  it("shows only the last 30 days, newest first", () => {
    const out = homeAnnouncements([
      ann("may", "2026-05-09T17:00:00"),
      ann("sep27", "2026-09-27T12:57:05.735Z"),
      ann("oct1", "2026-10-01T09:00:00Z"),
      ann("sep1", "2026-09-01T09:00:00Z"),
    ], now);
    expect(out.map((a) => a.id)).toEqual(["oct1", "sep27"]);
  });

  it("keeps at most three", () => {
    const out = homeAnnouncements(
      ["01", "02", "03", "04"].map((d) => ann(d, `2026-10-${d}T09:00:00Z`)), now);
    expect(out.map((a) => a.id)).toEqual(["04", "03", "02"]);
  });

  it("leaves an undated one to the full list", () => {
    expect(homeAnnouncements([ann("x", "")], now)).toEqual([]);
  });
});
