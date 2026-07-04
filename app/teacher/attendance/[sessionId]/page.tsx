"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Pencil } from "lucide-react";
import { CheckinHeader } from "@/components/CheckinHeader";
import { SessionProgress } from "@/components/SessionProgress";
import { RosterRow } from "@/components/RosterRow";
import { roster, sessionHistory } from "@/lib/teacher-data";
import type { RosterStudent } from "@/lib/types";

const PREVIEW_COUNT = 3;

export default function AttendanceSummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const t = useTranslations();
  const { sessionId } = use(params);
  const session = sessionHistory.find((s) => s.id === sessionId);
  if (!session) notFound();

  const [presentIds, setPresentIds] = useState<Set<string>>(
    new Set(session.presentIds),
  );
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const inSession = new Set([...session.presentIds, ...session.absentIds]);
  const students = roster.filter((s) => inSession.has(s.id));
  const present = students.filter((s) => presentIds.has(s.id));
  const absent = students.filter((s) => !presentIds.has(s.id));

  const toggle = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const row = (student: RosterStudent, isPresent: boolean) =>
    editing ? (
      <div key={student.id} className="flex items-stretch gap-2">
        <div className="flex-1">
          <RosterRow student={student} />
        </div>
        <button
          onClick={() => toggle(student.id)}
          className={`w-20 shrink-0 rounded-card text-sm font-semibold text-white shadow-clay hover:brightness-110 ${
            isPresent ? "bg-brick" : "bg-olive"
          }`}
        >
          {isPresent ? t("common.absent") : t("common.present")}
        </button>
      </div>
    ) : (
      <Link key={student.id} href={`/teacher/students/${student.id}`}>
        <RosterRow
          student={student}
          action={
            isPresent && session.dismissedAt[student.id] ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-olive">
                <Clock className="size-3" />
                {t("dismissal.pickedUpAt", {
                  time: session.dismissedAt[student.id],
                })}
              </span>
            ) : undefined
          }
        />
      </Link>
    );

  return (
    <div className="flex flex-col gap-4">
      <CheckinHeader
        titleKey="attendance.summaryTitle"
        subtitle={`${session.course} - Section ${session.section.replace("Sec ", "")}`}
        backHref="/teacher/attendance"
      />

      <SessionProgress count={present.length} total={students.length} />

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-ink">
            {t("attendance.presentStudents", { count: present.length })}
          </h2>
          <div className="flex items-center gap-3 text-sm font-semibold text-navy">
            <button onClick={() => setShowAll((v) => !v)} className="hover:text-navy-deep">
              {showAll ? t("common.showLess") : t("common.viewAll")}
            </button>
            <button
              onClick={() => setEditing((v) => !v)}
              aria-pressed={editing}
              className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                editing ? "bg-navy text-white" : "bg-navy-soft/60 hover:bg-navy-soft"
              }`}
            >
              <Pencil className="size-3.5" /> {editing ? t("common.done") : t("common.edit")}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {(showAll ? present : present.slice(0, PREVIEW_COUNT)).map((s) => row(s, true))}
        </div>
      </section>

      <section>
        <h2 className="font-extrabold text-ink">
          {t("attendance.absentStudents", { count: absent.length })}
        </h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {absent.map((s) => row(s, false))}
          {absent.length === 0 && (
            <p className="rounded-card bg-card/70 px-4 py-6 text-center text-sm text-muted">
              {t("attendance.everyonePresent")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
