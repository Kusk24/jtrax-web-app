import { useTranslations } from "next-intl";
import { Avatar } from "./Avatar";
import type { RosterStudent } from "@/lib/types";

/** One student line in a teacher attendance list; `action` renders on the right. */
export function RosterRow({
  student,
  action,
}: {
  student: RosterStudent;
  action?: React.ReactNode;
}) {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-3 rounded-card border-2 border-line bg-card p-3 shadow-clay">
      <Avatar
        name={student.name}
        colorClass={student.avatarColor}
        sizeClass="size-10"
        textClass="text-base"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{student.name}</p>
        <p className="text-[11px] text-muted">
          {t("common.idLabel", { id: student.studentId })} •{" "}
          {t("roster.sessions", {
            used: student.sessionsUsed,
            total: student.sessionsTotal,
          })}
        </p>
        <p
          className={`text-[11px] ${student.lowCredits ? "font-semibold text-brick" : "text-muted"}`}
        >
          {t("roster.creditsLine", {
            count: student.creditsRemaining,
            date: student.expiresOn,
          })}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
