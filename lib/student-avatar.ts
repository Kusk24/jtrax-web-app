/**
 * A student's emoji avatar, chosen on Profile. Kept in this browser only — the
 * user chose that over a backend field — so another device shows the initial
 * until the student picks one there too.
 */

/** The five offered by default; any other emoji from the keyboard works too. */
export const DEFAULT_AVATARS = ["🦁", "🐼", "🦊", "🐸", "🦉"] as const;

const key = (studentId: string) => `jtrax.avatar.${studentId}`;

/** The first emoji in what was typed, or "" when there is none — so a word,
    a letter or three emojis pasted together all come out as one emoji or
    nothing. */
export function firstEmoji(input: string): string {
  const text = input.trim();
  if (!text) return "";
  const segments =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment)
      : Array.from(text);
  const first = segments[0] ?? "";
  return /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(first) ? first : "";
}

export function loadAvatar(studentId: string): string {
  if (!studentId) return "";
  try {
    return firstEmoji(window.localStorage.getItem(key(studentId)) ?? "");
  } catch {
    return "";
  }
}

export function saveAvatar(studentId: string, emoji: string) {
  if (!studentId) return;
  try {
    if (emoji) window.localStorage.setItem(key(studentId), emoji);
    else window.localStorage.removeItem(key(studentId));
  } catch {
    /* Storage off: the avatar lasts until the page is reloaded. */
  }
}
