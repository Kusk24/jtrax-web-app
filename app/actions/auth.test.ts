/* Signing in to the portal: a parent or student lands in their portal; a
   staff account is told to use the Admin Console and keeps no session here;
   wrong credentials get one message that says nothing about which part. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet, get: () => undefined, delete: vi.fn() }),
}));
const redirect = vi.fn((to: string) => {
  throw new Error(`redirect:${to}`);
});
vi.mock("next/navigation", () => ({ redirect: (to: string) => redirect(to) }));

// The suite runs without the "@/" alias; hand it the real module.
vi.mock("@/lib/session", async () => await import("../../lib/session"));

const { signIn } = await import("./auth");

function form(email: string, password: string) {
  const f = new FormData();
  f.set("email", email);
  f.set("password", password);
  return f;
}

function backendAnswers(status: number, body: unknown) {
  const fetchMock = vi.fn(async (url: string) =>
    String(url).endsWith("/auth/logout")
      ? new Response(null, { status: 204 })
      : new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  cookieSet.mockClear();
  redirect.mockClear();
});

describe("signIn", () => {
  it("sends a parent to their portal", async () => {
    backendAnswers(200, { token: "tok", user: { role: "Parent" } });
    await expect(signIn({}, form("sandy@example.com", "pw"))).rejects.toThrow("redirect:/parent");
    expect(cookieSet).toHaveBeenCalled();
  });

  it.each(["Admin", "Receptionist"])("tells a %s account to use the Admin Console, keeping no session", async (role) => {
    const fetchMock = backendAnswers(200, { token: "tok", user: { role } });
    expect(await signIn({}, form("staff@jca.ac.th", "pw"))).toEqual({ error: "staff" });
    expect(cookieSet).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/auth/logout"))).toBe(true);
  });

  it("answers wrong credentials with the one generic error", async () => {
    backendAnswers(401, { error: "invalid email or password" });
    expect(await signIn({}, form("stu_penny", "nope"))).toEqual({ error: "invalid" });
  });
});
