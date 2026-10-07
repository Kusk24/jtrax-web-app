/**
 * Browser notifications for the parent portal: whether this browser can have
 * them, switching them on (permission, subscription, registration with the
 * backend) and off, and letting go of them on sign-out.
 *
 * The backend writes every notification to the inbox; with a browser
 * subscribed it also sends it through that browser's push service, and
 * `public/sw.js` shows it — whether or not a JTrax tab is open. The academy's
 * VAPID public key comes from the backend, which answers 404 until browser
 * push is set up there; the switch is then left out entirely.
 *
 * Nothing here throws into the page except `enableBrowserPush`, whose caller
 * shows the failure next to the switch.
 */

export type BrowserPushState =
  /** The server has no key: browser push is not set up, show nothing. */
  | "unavailable"
  /** No service workers or Push API here (Safari outside a Home Screen app). */
  | "unsupported"
  /** The parent, or the browser, blocked notifications for this site. */
  | "blocked"
  | "off"
  | "on";

/** A VAPID key as PushManager wants it: base64url text to bytes. */
export function base64UrlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Whether a subscription was made with this key — after the server's keys
    change, an old subscription can no longer be sent to. */
export function sameKey(subscribedWith: ArrayBuffer | null | undefined, key: string): boolean {
  if (!subscribedWith) return false;
  const a = new Uint8Array(subscribedWith);
  const b = base64UrlToBytes(key);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** What the backend's POST /push-subscriptions takes for a browser; the
    service worker builds the same shape when the browser renews one. */
export function subscriptionBody(sub: PushSubscriptionJSON, userAgent: string) {
  return {
    channel: "webpush",
    endpoint: sub.endpoint ?? "",
    p256dh: sub.keys?.p256dh ?? "",
    auth: sub.keys?.auth ?? "",
    user_agent: userAgent.slice(0, 200),
  };
}

function supported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

let cachedKey: string | null = null;

async function serverKey(): Promise<string | null> {
  if (cachedKey) return cachedKey;
  const res = await fetch("/api/push-subscriptions/webpush-key", { cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as { publicKey?: string };
  cachedKey = body.publicKey || null;
  return cachedKey;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

async function register(sub: PushSubscription): Promise<boolean> {
  const res = await fetch("/api/push-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscriptionBody(sub.toJSON(), navigator.userAgent)),
  });
  return res.ok;
}

async function unregister(sub: PushSubscription): Promise<void> {
  await fetch("/api/push-subscriptions", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => false);
}

/** Where this browser stands. A browser that is already subscribed is
    registered again — cheap, and it re-binds the subscription to whoever is
    signed in now, should someone else have used it before. */
export async function browserPushState(): Promise<BrowserPushState> {
  try {
    if (!supported()) return "unsupported";
    const key = await serverKey();
    if (!key) return "unavailable";
    if (Notification.permission === "denied") return "blocked";
    const sub = await currentSubscription();
    if (!sub) return "off";
    if (!sameKey(sub.options.applicationServerKey, key)) {
      await unregister(sub);
      return "off";
    }
    register(sub).catch(() => {});
    return Notification.permission === "granted" ? "on" : "off";
  } catch {
    return "unsupported";
  }
}

/** Asks for permission, subscribes and registers this browser. Call from the
    switch's click: Safari only shows the prompt in answer to one. */
export async function enableBrowserPush(): Promise<BrowserPushState> {
  if (!supported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission === "denied") return "blocked";
  if (permission !== "granted") return "off";
  const key = await serverKey();
  if (!key) return "unavailable";

  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) }));
  if (!(await register(sub))) {
    await sub.unsubscribe().catch(() => false);
    throw new Error("could not register this browser");
  }
  return "on";
}

/** Stops this browser's notifications, here and on the server. */
export async function disableBrowserPush(): Promise<BrowserPushState> {
  const sub = supported() ? await currentSubscription().catch(() => null) : null;
  if (sub) await unregister(sub);
  return "off";
}

/** On sign-out, while the session still exists: the next person to use this
    browser must not get the last one's notifications. Never throws. */
export async function forgetBrowserPush(): Promise<void> {
  await disableBrowserPush().catch(() => {});
}
