/* The portal's service worker: it shows a notification the backend pushed,
   and opens the right page when one is clicked. It does nothing else — no
   caching, no fetch handling — so the portal behaves exactly as it does
   without it.

   A push carries { title, body, data: { notificationId, type, … } } — the
   same notification the inbox gets (jtrax-backend internal/notify). */

/** Where a click lands: the same screens the phone opens for a parent
    (jtrax-mobile-app src/lib/push.ts). */
function notificationUrl(data) {
  return data && data.type === "announcement" ? "/parent/announcements" : "/parent/notifications";
}

/** What the backend's POST /push-subscriptions takes for a browser. */
function subscriptionBody(sub) {
  const json = sub.toJSON();
  return {
    channel: "webpush",
    endpoint: json.endpoint,
    p256dh: json.keys && json.keys.p256dh,
    auth: json.keys && json.keys.auth,
    user_agent: self.navigator ? String(self.navigator.userAgent).slice(0, 200) : "",
  };
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let msg = {};
  try {
    msg = event.data ? event.data.json() : {};
  } catch {
    /* Not ours, or garbled: still say something rather than nothing, since
       a push the browser shows nothing for counts against the site. */
  }
  const data = msg.data || {};
  event.waitUntil(
    self.registration.showNotification(msg.title || "JTrax", {
      body: msg.body || "",
      icon: "/icon.png",
      // One notification per inbox row, even if a push arrives twice.
      tag: data.notificationId || undefined,
      data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = notificationUrl(event.notification.data);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        if ("navigate" in open) {
          try {
            await open.navigate(url);
            return;
          } catch {
            /* Not ours to steer (opened before this worker took over). */
          }
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});

/* The browser can replace a subscription on its own (keys rotated, push
   service moved). The new one is registered straight away, with the session
   cookie the request carries, so the alerts keep coming without the parent
   having to switch them on again. */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const options = event.oldSubscription && event.oldSubscription.options;
      const sub = event.newSubscription || (options && (await self.registration.pushManager.subscribe(options)));
      if (!sub) return;
      await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionBody(sub)),
      });
    })(),
  );
});
