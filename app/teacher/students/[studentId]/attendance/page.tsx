import { notFound } from "next/navigation";
import { CheckinHeader } from "@/components/CheckinHeader";
import { AttendanceHistoryList } from "@/components/AttendanceHistoryList";
import { roster } from "@/lib/teacher-data";
import { attendanceHistory } from "@/lib/student-data";

/** The same screen the student sees on their own Attendance tab; the records
    are the shared mock until the backend serves per-student history. */
export default async function TeacherStudentAttendancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = roster.find((s) => s.id === studentId);
  if (!student) notFound();

  return (
    <div className="flex flex-col gap-4">
      <CheckinHeader
        titleKey="attendance.historyTitle"
        subtitle={student.name}
        backHref={`/teacher/students/${student.id}`}
      />
      <AttendanceHistoryList
        records={attendanceHistory}
        name={student.name}
        avatarColor={student.avatarColor}
      />
    </div>
  );
}
