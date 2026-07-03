import { CalendarDays, MapPin, UserSquare2, CheckCircle2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { CreditBar } from "./CreditBar";
import type { Child, ClassSession } from "@/lib/parent-data";

export function ClassCard({
  session,
  child,
  hideStudentPanel = false,
  action,
}: {
  session: ClassSession;
  child: Child;
  /** Student portal: the viewer is the student, so skip the left identity panel. */
  hideStudentPanel?: boolean;
  action?: React.ReactNode;
}) {
  const low = child.lowCredits;
  return (
    <div
      className={`flex overflow-hidden rounded-card border-2 border-navy/20 bg-card shadow-clay ${
        hideStudentPanel ? "border-l-4 border-l-navy" : ""
      }`}
    >
      {!hideStudentPanel && (
        <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1.5 bg-navy-soft/60 px-2 py-4 sm:w-28">
          <Avatar name={child.name} colorClass={child.avatarColor} sizeClass="size-14" />
          <p className={`text-sm font-bold ${low ? "text-brick" : "text-ink"}`}>{child.name}</p>
          <p className="text-[10px] text-muted">ID: {child.studentId}</p>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-navy">
            {session.course} ({session.section})
          </h3>
          {session.status === "present" && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-olive">
              <CheckCircle2 className="size-4 fill-olive text-card" /> Present
            </span>
          )}
        </div>
        <p className="flex items-center gap-2 text-sm text-ink">
          <CalendarDays className="size-4 shrink-0 text-navy" />
          {session.day} {session.time}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink">
          <UserSquare2 className="size-4 shrink-0 text-navy" />
          {session.teacher}
          <MapPin className="ml-1 size-4 shrink-0 text-navy" />
          {session.location} - {session.room}
        </p>
        <div className="mt-auto pt-1">
          <CreditBar
            remaining={child.credits.remaining}
            total={child.credits.total}
            low={low}
          />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-muted">Valid until {child.credits.validUntil}</span>
            <span className={`font-semibold ${low ? "text-brick" : "text-navy"}`}>
              {child.credits.remaining}/{child.credits.total} credits
            </span>
          </div>
          {action && <div className="mt-3 flex justify-end">{action}</div>}
        </div>
      </div>
    </div>
  );
}
