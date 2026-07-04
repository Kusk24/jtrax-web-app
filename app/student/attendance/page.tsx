import { useTranslations } from "next-intl";
import { AttendanceHistoryList } from "@/components/AttendanceHistoryList";
import { student, attendanceHistory } from "@/lib/student-data";

export default function StudentAttendancePage() {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-2xl font-extrabold text-navy">
        {t("attendance.historyTitle")}
      </h1>
      <AttendanceHistoryList
        records={attendanceHistory}
        name={student.name}
        avatarColor={student.avatarColor}
      />
    </div>
  );
}
