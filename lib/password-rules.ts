/**
 * The backend's password rule (jtrax-backend internal/auth/policy.go), checked
 * on the way in so a form can say what is wrong before a round trip: 8 or more
 * characters, at least one letter and one digit, and the two new-password
 * boxes agreeing.
 */
export type PasswordProblem = "short" | "weak" | "mismatch";

export function checkNewPassword(next: string, confirm: string): PasswordProblem | null {
  if ([...next].length < 8) return "short";
  if (!/\p{L}/u.test(next) || !/\p{Nd}/u.test(next)) return "weak";
  if (next !== confirm) return "mismatch";
  return null;
}
