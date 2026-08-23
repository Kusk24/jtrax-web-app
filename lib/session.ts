/**
 * Session plumbing shared by the login action, the API proxy and the portal
 * guards. The backend bearer token lives in an httpOnly cookie; client code
 * calls the same-origin /api proxy which attaches it server-side.
 */
export const SESSION_COOKIE = "jtrax_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

export type BackendIdentity = {
  userAccountId: string;
  email: string;
  role: string;
  displayName: string;
  languagePreference: string;
  themePreference: string;
  parentId?: string;
  studentId?: string;
};

/** Resolves a session token to the signed-in identity; "down" when the
    backend cannot be reached at all. The two are different answers: a missing
    or stale session belongs at the sign-in screen, an unreachable server does
    not — bouncing a signed-in parent to login when the backend restarts reads
    as "your account is gone". */
export async function fetchMeOrDown(
  token: string | undefined,
): Promise<BackendIdentity | "down" | undefined> {
  if (!token) return undefined;
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    return (await res.json()) as BackendIdentity;
  } catch {
    return "down";
  }
}

/** Resolves a session token to the signed-in identity, or undefined. */
export async function fetchMe(token: string | undefined): Promise<BackendIdentity | undefined> {
  const me = await fetchMeOrDown(token);
  return me === "down" ? undefined : me;
}

/** Where each role lands after sign-in, or null when this app has no portal
    for it (staff use the separate admin console) — returning a portal the
    role can't enter would bounce between "/" and that portal forever.
    Teacher is one of those: the academy has no teacher workflow, so no
    teacher accounts are issued and there is no portal to send one to. */
export function homeFor(role: string): string | null {
  if (role === "Parent") return "/parent";
  if (role === "Student") return "/student";
  return null;
}
