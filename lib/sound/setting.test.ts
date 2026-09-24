/**
 * The sound switch. On until turned off, remembered per device, and never able
 * to break the board when storage is missing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("the sound switch", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is on until turned off, and remembers being turned off", async () => {
    vi.stubGlobal("window", { localStorage: fakeStorage(), addEventListener() {}, removeEventListener() {} });
    const { isSoundOn, setSoundOn } = await import("./setting");
    expect(isSoundOn()).toBe(true);
    setSoundOn(false);
    expect(isSoundOn()).toBe(false);
    setSoundOn(true);
    expect(isSoundOn()).toBe(true);
  });

  it("still obeys the switch when storage refuses to save it", async () => {
    const broken = {
      getItem: () => {
        throw new Error("private window");
      },
      setItem: () => {
        throw new Error("private window");
      },
    };
    vi.stubGlobal("window", { localStorage: broken, addEventListener() {}, removeEventListener() {} });
    const { setSoundOn, soundAllowed } = await import("./setting");
    expect(soundAllowed()).toBe(true);
    setSoundOn(false);
    expect(soundAllowed()).toBe(false);
  });
});
