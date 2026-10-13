/**
 * A failed ID card scan says why, with the code it came with. Every failure
 * used to read "the card could not be read", so a tester could not tell a
 * blurry photo from a refused key.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTranslator } from "next-intl";
import en from "../messages/en.json";
import th from "../messages/th.json";
import { ScanError, scanIDCard } from "./registration";
import { SCAN_REASONS, scanErrorText } from "./scan-error";

const t = createTranslator({ locale: "en", messages: en, namespace: "register" }) as unknown as (
  key: string, values?: Record<string, string | number>,
) => string;

describe("scanErrorText", () => {
  it("says the reason and shows the code with the scan service's status", () => {
    const text = scanErrorText(new ScanError(502, "could not read the card: …", "quota", 429), t);
    expect(text).toContain("limit is used up");
    expect(text).toContain("(error: quota 429)");
  });

  it("shows a code alone when the scan service was never asked", () => {
    const text = scanErrorText(new ScanError(422, "could not read the date of birth", "no_date_of_birth"), t);
    expect(text).toContain("Could not read the date of birth");
    expect(text).toContain("(error: no_date_of_birth)");
  });

  it("names a reply that never came from the server by its HTTP status", () => {
    // nginx refusing a large photo answers HTML, so there is no reason code.
    const text = scanErrorText(new ScanError(413, ""), t);
    expect(text).toContain("too large");
    expect(text).toContain("(error: http 413)");
  });

  it("falls back to the server's own sentence for a code it does not know", () => {
    const text = scanErrorText(new ScanError(403, "that child is not yours"), t);
    expect(text).toBe("that child is not yours (error: http 403)");
  });

  it("says the photo was not sent when there was no answer at all", () => {
    const text = scanErrorText(new TypeError("Failed to fetch"), t);
    expect(text).toContain("could not be sent");
    expect(text).toContain("(error: Failed to fetch)");
  });

  it("has a sentence for every reason, in English and Thai", () => {
    for (const messages of [en, th]) {
      const why = (messages.register as { scanWhy: Record<string, string> }).scanWhy;
      for (const reason of [...SCAN_REASONS, "busy", "server", "unsent"]) {
        expect(why[reason], reason).toBeTruthy();
      }
    }
  });
});

describe("scanIDCard", () => {
  afterEach(() => vi.unstubAllGlobals());

  const photo = () => new File([new Uint8Array([0xff, 0xd8, 0xff])], "card.jpg", { type: "image/jpeg" });

  it("keeps the server's reason and the scan service's status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "could not read the card: …", reason: "model_unavailable", status: 404 }),
      { status: 502 },
    )));
    const err = await scanIDCard("trn_1", photo()).catch((e) => e);
    expect(err).toBeInstanceOf(ScanError);
    expect(err).toMatchObject({ status: 502, reason: "model_unavailable", upstream: 404 });
  });

  it("keeps the HTTP status of a reply that is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>413</html>", { status: 413 })));
    const err = await scanIDCard("trn_1", photo()).catch((e) => e);
    expect(err).toMatchObject({ status: 413, reason: "", upstream: 0 });
  });
});
