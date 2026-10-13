/* A registration closed in the console while the form was open: the server
   answers 404, and the error keeps that status so the form can say
   "registration isn't open" rather than "not found". */
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryError, registerForTournament, scanIDCard } from "./registration";

afterEach(() => vi.unstubAllGlobals());

function answer(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));
}

describe("a registration closed while the form is open", () => {
  it("fails the ID card scan with its 404", async () => {
    answer(404, { error: "not found" });
    const err = await scanIDCard("trn_closed", new File(["x"], "card.jpg", { type: "image/jpeg" })).catch((e) => e);
    expect(err).toBeInstanceOf(EntryError);
    expect(err.status).toBe(404);
  });

  it("fails the entry with its 404", async () => {
    answer(404, { error: "not found" });
    const err = await registerForTournament("trn_closed", {
      name: "Somchai", email: "s@example.com", phone: "0812345678", acceptTerms: true, idCheck: "idc_1",
    } as Parameters<typeof registerForTournament>[1]).catch((e) => e);
    expect(err).toBeInstanceOf(EntryError);
    expect(err.status).toBe(404);
  });
});
