import { describe, expect, it } from "vitest";
import { base64UrlToBytes, sameKey, subscriptionBody } from "./browser-push";

describe("base64UrlToBytes", () => {
  it("reads a VAPID key, which is base64url without padding", () => {
    // 0xfb 0xff 0xbf is "+/+/" in base64 and "-_-_" in base64url.
    expect([...base64UrlToBytes("-_-_")]).toEqual([0xfb, 0xff, 0xbf]);
    expect(base64UrlToBytes("AQ").length).toBe(1);
  });
});

describe("sameKey", () => {
  const key = "BAEC"; // bytes 4, 1, 2
  it("matches a subscription made with the server's key", () => {
    expect(sameKey(new Uint8Array([4, 1, 2]).buffer, key)).toBe(true);
  });
  it("catches one made with an old key, or none", () => {
    expect(sameKey(new Uint8Array([4, 1, 3]).buffer, key)).toBe(false);
    expect(sameKey(new Uint8Array([4, 1]).buffer, key)).toBe(false);
    expect(sameKey(null, key)).toBe(false);
  });
});

describe("subscriptionBody", () => {
  it("is what the backend registers a browser with", () => {
    const body = subscriptionBody(
      { endpoint: "https://fcm.googleapis.com/fcm/send/x", keys: { p256dh: "pk", auth: "au" } },
      "a".repeat(300),
    );
    expect(body).toEqual({
      channel: "webpush",
      endpoint: "https://fcm.googleapis.com/fcm/send/x",
      p256dh: "pk",
      auth: "au",
      user_agent: "a".repeat(200),
    });
  });
});
