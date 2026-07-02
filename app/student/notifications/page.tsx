import { StudentHeader } from "@/components/StudentHeader";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { notifications } from "@/lib/student-data";

export default function StudentNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <StudentHeader />
      <NotificationsPanel items={notifications} />
    </div>
  );
}
