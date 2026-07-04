"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Search, XCircle, CheckCircle2, Check } from "lucide-react";
import { CheckinHeader } from "@/components/CheckinHeader";
import { SessionProgress } from "@/components/SessionProgress";
import { RosterRow } from "@/components/RosterRow";
import { roster, upcomingClass } from "@/lib/teacher-data";

export default function ManualCheckinPage() {
  const t = useTranslations("checkin");
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
        subtitle={t("classSubtitle", { course: upcomingClass.course, section: upcomingClass.section.replace("Sec ", "") })}
      />

      <SessionProgress count={presentIds.size} total={roster.length} />

      <label className="flex items-center gap-2 rounded-full border-2 border-line bg-card px-4 py-2.5 shadow-clay">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchStudents")}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setPresentIds(new Set())}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brick px-4 py-2 text-sm font-semibold text-white shadow-clay hover:brightness-110"
        >
          <XCircle className="size-4" /> {t("allAbsent")}
        </button>
        <button
          onClick={() => setPresentIds(new Set(roster.map((s) => s.id)))}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-olive px-4 py-2 text-sm font-semibold text-white shadow-clay hover:brightness-110"
        >
          <CheckCircle2 className="size-4" /> {t("allPresent")}
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
                  aria-label={
                    present
                      ? t("markAbsent", { name: student.name })
                      : t("markPresent", { name: student.name })
                  }
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
            {t("noMatch", { query })}
          </p>
        )}
      </div>

      <Link
        href="/teacher/dismissal/may10-sec101"
        className="sticky bottom-20 z-10 mt-2 rounded-2xl bg-navy py-3 text-center font-bold text-white shadow-clay-lg hover:bg-navy-deep lg:bottom-6"
      >
        {t("finish")}
      </Link>
    </div>
  );
}
