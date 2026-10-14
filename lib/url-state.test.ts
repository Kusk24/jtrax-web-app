import { describe, expect, it } from "vitest";
import { pick, readDraft, withParam } from "./url-state";

describe("pick", () => {
  const steps = ["detail", "register", "payment"] as const;
  it("keeps a known value", () => expect(pick("payment", steps, "detail")).toBe("payment"));
  it("falls back on a missing or forged one", () => {
    expect(pick(null, steps, "detail")).toBe("detail");
    expect(pick("admin", steps, "detail")).toBe("detail");
  });
});

describe("withParam", () => {
  it("adds beside what is already there", () =>
    expect(withParam("?id=t1", "step", "register")).toBe("?id=t1&step=register"));
  it("replaces an existing value", () =>
    expect(withParam("?id=t1&step=register", "step", "payment")).toBe("?id=t1&step=payment"));
  it("drops the default, so the plain address stays plain", () => {
    expect(withParam("?id=t1&step=register", "step", "detail", "detail")).toBe("?id=t1");
    expect(withParam("?tab=unread", "tab", "all", "all")).toBe("");
  });
});

describe("readDraft", () => {
  const isName = (v: unknown): v is { name: string } =>
    typeof v === "object" && v !== null && typeof (v as { name?: unknown }).name === "string";
  it("restores a valid draft", () => expect(readDraft('{"name":"Penny"}', isName)).toEqual({ name: "Penny" }));
  it("ignores nothing, junk and the wrong shape", () => {
    expect(readDraft(null, isName)).toBeNull();
    expect(readDraft("{not json", isName)).toBeNull();
    expect(readDraft('{"name":7}', isName)).toBeNull();
  });
});
