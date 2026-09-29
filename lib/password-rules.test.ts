import { describe, expect, it } from "vitest";
import { checkNewPassword } from "./password-rules";

describe("a new password", () => {
  it("needs eight characters", () => {
    expect(checkNewPassword("ab12", "ab12")).toBe("short");
  });
  it("needs a letter and a number", () => {
    expect(checkNewPassword("abcdefgh", "abcdefgh")).toBe("weak");
    expect(checkNewPassword("12345678", "12345678")).toBe("weak");
  });
  it("has to be typed the same twice", () => {
    expect(checkNewPassword("tiger-lamp-42", "tiger-lamp-43")).toBe("mismatch");
  });
  it("passes when it meets the rule, Thai letters included", () => {
    expect(checkNewPassword("tiger-lamp-42", "tiger-lamp-42")).toBeNull();
    expect(checkNewPassword("เสือกระโดด12", "เสือกระโดด12")).toBeNull();
  });
});
