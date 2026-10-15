/* The privacy notice tick travels with the entry: the server refuses an entry
   without it (PDPA s.23), so a form that forgot to send it could never work. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerForTournament } from "./registration";

afterEach(() => vi.unstubAllGlobals());

describe("an entry's privacy notice", () => {
  it("is sent as the form's own answer", async () => {
    const sent: FormData[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(init.body as FormData);
      return new Response(JSON.stringify({ registrationId: "treg_1" }), { status: 201 });
    }));
    const base = { name: "Somchai", email: "s@example.com", phone: "0812345678", acceptTerms: true, idCheck: "idc_1" };
    await registerForTournament("trn_1", { ...base, privacyNotice: true } as Parameters<typeof registerForTournament>[1]);
    await registerForTournament("trn_1", { ...base, privacyNotice: false } as Parameters<typeof registerForTournament>[1]);
    expect(sent.map((b) => b.get("privacyNotice"))).toEqual(["true", "false"]);
  });
});
