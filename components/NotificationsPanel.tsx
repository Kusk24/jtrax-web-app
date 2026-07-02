"use client";

import { useState } from "react";
import { AlertTriangle, Check, Hourglass } from "lucide-react";
import type { NotificationItem } from "@/lib/types";

const kindStyles: Record<
  NotificationItem["kind"],
  { icon: typeof AlertTriangle; box: string; iconClass: string }
> = {
  alert: { icon: AlertTriangle, box: "bg-peach", iconClass: "fill-peach-ink text-peach" },
  success: { icon: Check, box: "bg-olive", iconClass: "text-white" },
  expiry: { icon: Hourglass, box: "bg-brick-soft", iconClass: "text-brick" },
};

export function NotificationsPanel({ items }: { items: NotificationItem[] }) {
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const visible = items.filter((n) => filter === "all" || n.unread);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">Notifications</h2>
        <div className="flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-5 py-1 text-xs font-semibold capitalize ${
                filter === f
                  ? "bg-navy text-white"
                  : "border border-line bg-card text-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-card">
        {visible.map((n) => {
          const { icon: Icon, box, iconClass } = kindStyles[n.kind];
          return (
            <li key={n.id} className="flex gap-4 bg-card/70 px-4 py-5">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${box}`}>
                <Icon className={`size-6 ${iconClass}`} strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-bold text-ink">{n.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>
              </div>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="bg-card/70 px-4 py-10 text-center text-sm text-muted">
            No notifications.
          </li>
        )}
      </ul>
    </>
  );
}
