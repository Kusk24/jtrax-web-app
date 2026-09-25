/**
 * The proxy forwarded every request body as JSON. That was fine until the
 * tournament entry form uploaded a photo of an ID card, at which point it
 * destroyed the upload two different ways — and the failure surfaced as
 * "image is too large (10 MB maximum)" against a 200 KB file.
 *
 * These are the two things that must stay true.
 */
import { describe, expect, it } from "vitest";
import { forwardAs } from "./proxy-body";

describe("forwarding a JSON body", () => {
  it("sends it as text", () => {
    expect(forwardAs("application/json")).toEqual({ type: "application/json", asText: true });
  });

  /* A browser is entitled to add a charset, and it is still JSON. */
  it("recognises JSON with a charset", () => {
    expect(forwardAs("application/json; charset=utf-8")).toEqual({
      type: "application/json; charset=utf-8",
      asText: true,
    });
  });

  /* A body-less POST sends no type, and there is nothing to corrupt. */
  it("defaults an absent type to JSON", () => {
    expect(forwardAs(null)).toEqual({ type: "application/json", asText: true });
    expect(forwardAs("")).toEqual({ type: "application/json", asText: true });
    expect(forwardAs("   ")).toEqual({ type: "application/json", asText: true });
  });
});

describe("forwarding an upload", () => {
  /* The bug, exactly. Replacing the type drops `boundary=`, and without a
     boundary the server cannot find where the parts begin — so it cannot
     parse the form at all. */
  it("keeps the multipart boundary intact", () => {
    const type = "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const plan = forwardAs(type);
    expect(plan.type).toBe(type);
    expect(plan.type).toContain("boundary=");
  });

  /* The other half. `req.text()` decodes as UTF-8, and a JPEG is not UTF-8 —
     every invalid sequence becomes U+FFFD, which is most of the file. */
  it("reads an upload as bytes, never as text", () => {
    expect(forwardAs("multipart/form-data; boundary=abc").asText).toBe(false);
  });

  /* Not just multipart: anything we do not positively recognise as JSON is
     treated as bytes, because bytes are the answer that cannot corrupt. */
  it("treats anything unrecognised as bytes", () => {
    for (const type of [
      "image/jpeg",
      "application/pdf",
      "application/octet-stream",
      "text/csv",
      "application/x-www-form-urlencoded",
    ]) {
      expect(forwardAs(type)).toEqual({ type, asText: false });
    }
  });

  /* Content types are case-insensitive, and a type that is really JSON must
     not fall through to the byte path — arrayBuffer() on a JSON body would
     work, but it would send a type the backend's decoder does not expect. */
  it("is case-insensitive about JSON", () => {
    expect(forwardAs("Application/JSON").asText).toBe(true);
  });
});
