/**
 * The emailed pay link, and the two calls it makes.
 *
 * The code in the link is the only thing that lets a stranger pay for an entry,
 * so these check it is read from after the `#` (never sent in a URL) and always
 * travels in a request body.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryError, getPublicEntry, payForPublicEntry, readPayLink } from "./registration";

const CODE = "a".repeat(64);

describe("readPayLink", () => {
  it("reads the entry from the query and the code from after the #", () => {
    expect(readPayLink("?entry=treg_1", `#code=${CODE}`)).toEqual({ entry: "treg_1", code: CODE });
  });

  it("refuses a link with the code missing, cut short or in the query", () => {
    expect(readPayLink("?entry=treg_1", "")).toBeNull();
    expect(readPayLink("?entry=treg_1", "#code=abc")).toBeNull();
    expect(readPayLink(`?entry=treg_1&code=${CODE}`, "")).toBeNull();
    expect(readPayLink("", `#code=${CODE}`)).toBeNull();
  });
});

describe("the pay calls", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(status: number, body: unknown) {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("posts the code in the body, never in the URL", async () => {
    const fetchMock = stubFetch(200, { url: "https://checkout.stripe.com/c/pay/cs_1" });
    await expect(payForPublicEntry("treg_1", CODE)).resolves.toBe("https://checkout.stripe.com/c/pay/cs_1");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/public/tournament-registrations/treg_1/pay");
    expect(url).not.toContain(CODE);
    expect(JSON.parse(init.body as string)).toEqual({ code: CODE });
  });

  it("keeps the status, so the page can tell a dead link from a paid entry", async () => {
    stubFetch(404, { error: "this payment link does not work" });
    const err = await getPublicEntry("treg_1", CODE).catch((e) => e);
    expect(err).toBeInstanceOf(EntryError);
    expect((err as EntryError).status).toBe(404);
  });
});
