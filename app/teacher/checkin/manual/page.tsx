"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, XCircle, CheckCircle2, Check } from "lucide-react";
import { CheckinHeader } from "@/components/CheckinHeader";
import { SessionProgress } from "@/components/SessionProgress";
import { RosterRow } from "@/components/RosterRow";
import { roster, upcomingClass } from "@/lib/teacher-data";

export default function ManualCheckinPage() {
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const visible = roster.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const toggle = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <CheckinHeader
        subtitle={`${upcomingClass.course} - Section ${upcomingClass.section.replace("Sec ", "")}`}
      />

      <SessionProgress count={presentIds.size} total={roster.length} />

      <label className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 shadow-sm">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Students.."
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setPresentIds(new Set())}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brick px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          <XCircle className="size-4" /> All Absent
        </button>
        <button
          onClick={() => setPresentIds(new Set(roster.map((s) => s.id)))}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-olive px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          <CheckCircle2 className="size-4" /> All Present
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {visible.map((student) => {
          const present = presentIds.has(student.id);
          return (
            <RosterRow
              key={student.id}
              student={student}
              action={
                <button
                  onClick={() => toggle(student.id)}
                  aria-label={`Mark ${student.name} ${present ? "absent" : "present"}`}
                  aria-pressed={present}
                  className={`flex size-11 items-center justify-center rounded-xl border-2 transition-colors ${
                    present
                      ? "border-olive bg-olive text-white"
                      : "border-line bg-card text-transparent hover:border-navy/40"
                  }`}
                >
                  <Check className="size-5" strokeWidth={3} />
                </button>
              }
            />
          );
        })}
        {visible.length === 0 && (
          <p className="rounded-card bg-card/70 px-4 py-8 text-center text-sm text-muted">
            No students match “{query}”.
          </p>
        )}
      </div>

      <Link
        href="/teacher/attendance/may10-sec101"
        className="mt-2 rounded-xl bg-navy py-3 text-center font-semibold text-white shadow-sm hover:bg-navy-deep"
      >
        Finish Attendance
      </Link>
    </div>
  );
}
