import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { StudentHeader } from "@/components/StudentHeader";
import { ClassCard } from "@/components/ClassCard";
import { student, upcomingToday } from "@/lib/student-data";

export default function StudentHome() {
  return (
    <div className="flex flex-col gap-6">
      <StudentHeader />

      {student.lowCredits && (
        <div className="flex items-center gap-4 rounded-card bg-peach px-5 py-4">
          <AlertTriangle className="size-7 shrink-0 fill-peach-ink text-peach" />
          <div>
            <p className="font-bold text-ink">You have low credits in one course!</p>
            <p className="text-xs text-muted">
              To continue the class, please contact the office to top up.
            </p>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-lg font-extrabold text-ink">Upcoming Classes</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <ClassCard
            session={upcomingToday}
            child={student}
            hideStudentPanel
            action={
              <Link
                href="/student/checkin"
                className="flex items-center gap-1 rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white shadow-clay hover:bg-navy-deep"
              >
                Check-in <ChevronRight className="size-4" />
              </Link>
            }
          />
        </div>
      </section>
    </div>
  );
}
