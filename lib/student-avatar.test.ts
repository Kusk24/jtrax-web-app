import { describe, expect, it } from "vitest";
import { DEFAULT_AVATARS, firstEmoji } from "./student-avatar";

describe("an emoji avatar", () => {
  it("keeps a single emoji, including joined and flag emojis", () => {
    expect(firstEmoji("🦊")).toBe("🦊");
    expect(firstEmoji("👩‍🚀")).toBe("👩‍🚀");
    expect(firstEmoji("🇹🇭")).toBe("🇹🇭");
  });

  it("takes only the first of several", () => {
    expect(firstEmoji("🐼🦁")).toBe("🐼");
  });

  it("is nothing for letters, words or blank input", () => {
    expect(firstEmoji("M")).toBe("");
    expect(firstEmoji("hello")).toBe("");
    expect(firstEmoji("   ")).toBe("");
  });

  it("offers five defaults, each a real emoji", () => {
    expect(DEFAULT_AVATARS).toHaveLength(5);
    for (const e of DEFAULT_AVATARS) expect(firstEmoji(e)).toBe(e);
  });
});
