import { ParentHeader } from "@/components/ParentHeader";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { notifications } from "@/lib/parent-data";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <ParentHeader />
      <NotificationsPanel items={notifications} />
    </div>
  );
}
