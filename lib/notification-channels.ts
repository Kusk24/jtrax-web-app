/**
 * How a notification can reach a parent besides the bell in the portal, and
 * which of those ways they have kept.
 *
 * Only payment receipts and announcements leave the app (the backend's
 * notify.ChannelsFor says which, per type, in `channelsByType`), so only those
 * rows in Settings get Email, Phone and Browser switches. The type's own switch
 * stays the master: a type switched off arrives nowhere.
 */

/** Settings' order: email, then the phone app, then this kind of browser. */
export const OUTSIDE_CHANNELS = ["email", "mobile", "webpush"] as const;
export type OutsideChannel = (typeof OUTSIDE_CHANNELS)[number];

/** The ways besides the bell this type can arrive, in Settings' order. None
    when the server did not say (an older backend), so nothing is offered that
    might do nothing. */
export function outsideChannels(byType: Record<string, string[]> | undefined, type: string): OutsideChannel[] {
  const allowed = byType?.[type] ?? [];
  return OUTSIDE_CHANNELS.filter((c) => allowed.includes(c));
}

export const channelKey = (type: string, channel: string) => `${type}:${channel}`;

/** The saved per-channel choices, keyed type:channel. Only overrides are
    stored, so anything absent is on. */
export function channelPrefsFrom(rows: Array<{ type?: unknown; channel?: unknown; enabled?: unknown }>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const row of rows) {
    if (typeof row.type === "string" && typeof row.channel === "string" && row.channel !== "inapp") {
      out[channelKey(row.type, row.channel)] = Boolean(row.enabled);
    }
  }
  return out;
}

/** Whether a type still reaches the parent this way. On until switched off. */
export function channelOn(prefs: Record<string, boolean>, type: string, channel: string): boolean {
  return prefs[channelKey(type, channel)] ?? true;
}
