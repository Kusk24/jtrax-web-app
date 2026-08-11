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

/** Resolves a session token to the signed-in identity, or undefined. */
export async function fetchMe(token: string | undefined): Promise<BackendIdentity | undefined> {
  if (!token) return undefined;
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    return (await res.json()) as BackendIdentity;
  } catch {
    return undefined;
  }
}

/** Where each role lands after sign-in, or null when this app has no portal
    for it (staff use the separate admin console) — returning a portal the
    role can't enter would bounce between "/" and that portal forever. */
export function homeFor(role: string): string | null {
  if (role === "Parent") return "/parent";
  if (role === "Student") return "/student";
  if (role === "Teacher") return "/teacher";
  return null;
}
