/**
 * public/sw.js, run against a stand-in for the browser: a push becomes a
 * notification with the inbox's words, and a click opens the page the phone
 * would. The worker is a plain script the browser loads, so it is evaluated
 * here as one, with `self` and `fetch` handed in.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

type Handler = (event: Record<string, unknown>) => void;

function loadWorker(windows: { url: string }[] = []) {
  const handlers: Record<string, Handler> = {};
  const shown: { title: string; options: Record<string, unknown> }[] = [];
  const opened: string[] = [];
  const navigated: string[] = [];
  const fetched: { url: string; body: unknown }[] = [];
  const clients = windows.map((w) => ({
    url: w.url,
    focus: vi.fn(async () => {}),
    navigate: vi.fn(async (u: string) => void navigated.push(u)),
  }));
  const self = {
    location: { origin: "https://portal.example" },
    navigator: { userAgent: "Chrome" },
    addEventListener: (type: string, fn: Handler) => (handlers[type] = fn),
    skipWaiting: () => {},
    clients: {
      claim: async () => {},
      matchAll: async () => clients,
      openWindow: async (u: string) => void opened.push(u),
    },
    registration: {
      showNotification: async (title: string, options: Record<string, unknown>) => void shown.push({ title, options }),
      pushManager: { subscribe: async () => null },
    },
  };
  const fetchStub = async (url: string, init: { body: string }) => {
    fetched.push({ url, body: JSON.parse(init.body) });
    return { ok: true };
  };
  const code = readFileSync(join(__dirname, "..", "public", "sw.js"), "utf8");
  new Function("self", "fetch", code)(self, fetchStub);

  /** Fires an event and waits for what it handed to waitUntil. */
  async function fire(type: string, event: Record<string, unknown>) {
    let pending: Promise<unknown> = Promise.resolve();
    handlers[type]({ ...event, waitUntil: (p: Promise<unknown>) => (pending = p) });
    await pending;
  }
  return { fire, shown, opened, navigated, fetched, clients };
}

const push = (msg: unknown) => ({ data: { json: () => msg } });

describe("the service worker", () => {
  it("shows a push as the inbox's notification", async () => {
    const w = loadWorker();
    await w.fire(
      "push",
      push({ title: "Penny has arrived", body: "Checked in at 13:59", data: { notificationId: "ntf_1", type: "check_in" } }),
    );
    expect(w.shown).toEqual([
      {
        title: "Penny has arrived",
        options: {
          body: "Checked in at 13:59",
          icon: "/icon.png",
          tag: "ntf_1",
          data: { notificationId: "ntf_1", type: "check_in" },
        },
      },
    ]);
  });

  it("still shows something for a push it cannot read", async () => {
    const w = loadWorker();
    await w.fire("push", { data: { json: () => JSON.parse("{") } });
    expect(w.shown[0].title).toBe("JTrax");
  });

  it("opens the notifications page, or announcements for an announcement", async () => {
    const w = loadWorker();
    const click = (data: unknown) => ({ notification: { data, close: () => {} } });
    await w.fire("notificationclick", click({ type: "check_in" }));
    await w.fire("notificationclick", click({ type: "announcement" }));
    expect(w.opened).toEqual(["/parent/notifications", "/parent/announcements"]);
  });

  it("brings an open portal tab forward instead of opening another", async () => {
    const w = loadWorker([{ url: "https://elsewhere.example/" }, { url: "https://portal.example/parent" }]);
    await w.fire("notificationclick", { notification: { data: { type: "low_credit" }, close: () => {} } });
    expect(w.clients[1].focus).toHaveBeenCalled();
    expect(w.navigated).toEqual(["/parent/notifications"]);
    expect(w.opened).toEqual([]);
  });

  it("registers a renewed subscription with the backend", async () => {
    const w = loadWorker();
    const renewed = {
      toJSON: () => ({ endpoint: "https://fcm.googleapis.com/fcm/send/new", keys: { p256dh: "pk", auth: "au" } }),
    };
    await w.fire("pushsubscriptionchange", { newSubscription: renewed });
    expect(w.fetched).toEqual([
      {
        url: "/api/push-subscriptions",
        body: {
          channel: "webpush",
          endpoint: "https://fcm.googleapis.com/fcm/send/new",
          p256dh: "pk",
          auth: "au",
          user_agent: "Chrome",
        },
      },
    ]);
  });
});
