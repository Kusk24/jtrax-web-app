/* The arrival reminder's link: the entry in the path, the code after the #,
   and the code always sent in a body. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { answerArrival, EntryError, getArrival, readArrivalLink, readArrivalLinks } from "./registration";

const CODE = "b".repeat(64);

describe("readArrivalLink", () => {
  it("reads the entry from the path and the code from after the #", () => {
    expect(readArrivalLink("/arrival/treg_1", `#code=${CODE}`)).toEqual({ entry: "treg_1", code: CODE });
  });
  it("refuses a link with no entry or no whole code", () => {
    expect(readArrivalLink("/arrival/treg_1", "#code=abc")).toBeNull();
    expect(readArrivalLink("/arrival/", `#code=${CODE}`)).toBeNull();
  });
});

describe("the arrival calls", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(status: number, body: unknown) {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("sends the answer and the code in the body, never in the URL", async () => {
    const fetchMock = stubFetch(200, { tournamentName: "Open", participantName: "Penny", startDate: "2026-10-09", status: "Confirmed", open: true });
    const out = await answerArrival("treg_1", CODE, "Confirmed");
    expect(out.status).toBe("Confirmed");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/public/arrival/treg_1/answer");
    expect(url).not.toContain(CODE);
    expect(JSON.parse(init.body as string)).toEqual({ code: CODE, answer: "Confirmed" });
  });

  it("keeps a dead link's 404", async () => {
    stubFetch(404, { error: "this link does not work" });
    const err = await getArrival("treg_1", CODE).catch((e) => e);
    expect(err).toBeInstanceOf(EntryError);
    expect((err as EntryError).status).toBe(404);
  });
});

describe("readArrivalLinks", () => {
  const C2 = "c".repeat(64);
  it("reads every child a family's link answers for", () => {
    expect(readArrivalLinks("/arrival/treg_1", `#code=${CODE}&also=treg_2.${C2}`)).toEqual([
      { entry: "treg_1", code: CODE },
      { entry: "treg_2", code: C2 },
    ]);
  });
  it("is one child for an older link", () => {
    expect(readArrivalLinks("/arrival/treg_1", `#code=${CODE}`)).toEqual([{ entry: "treg_1", code: CODE }]);
  });
  it("skips a malformed or repeated extra, and is empty for a broken link", () => {
    expect(readArrivalLinks("/arrival/treg_1", `#code=${CODE}&also=treg_2.short,treg_1.${C2}`)).toEqual([
      { entry: "treg_1", code: CODE },
    ]);
    expect(readArrivalLinks("/arrival/treg_1", "#code=nope")).toEqual([]);
  });
});
