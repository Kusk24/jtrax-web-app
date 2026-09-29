"use client";

/* Profile: the pupil as a chess player, each fact once, compact.
 *
 * Who they are (name, login ID, level) on one row, three numbers (rating,
 * games played, puzzles solved), this week's streak with the current count,
 * and the account settings last. No points: the student panel has none. */
import { useTranslations } from "next-intl";
import { Flame, LogOut, Trophy } from "lucide-react";
import { LichessCard } from "@/components/student/LichessCard";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { SignOutButton } from "@/components/SignOutButton";
import { StreakCalendar, secondaryPill } from "./kit";
import { SummaryPills, stCard } from "./HomeScreen";
import { AppearancePicker } from "./AppearancePicker";
import type { StudentData } from "./useStudentData";

function academyToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="px-0.5 text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">{children}</h2>;
}

export function ProfileScreen({ data }: { data: StudentData }) {
  const t = useTranslations("st");
  const t3 = useTranslations("sv3");
  const tp = useTranslations("pv2");
  const tc = useTranslations("common");
  const p = data.progress;

  return (
    <div className="st-enter mx-auto flex w-full max-w-[640px] flex-col gap-5">
      {/* Who: the initial, the name and the login ID, on one row. */}
      <section className="flex min-w-0 items-center gap-3 px-0.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pp-soft text-[18px] font-bold text-pp-blue" aria-hidden>
          {data.name.trim().charAt(0).toUpperCase() || "S"}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">{data.name || "—"}</h1>
          <p className="flex items-center gap-2 text-[12px] text-pp-muted">
            @{data.studentId || "—"}
            {/* The level the office set. */}
            {data.level && (
              <span className="rounded-full bg-pp-plum-soft px-2 py-0.5 text-[10.5px] font-bold text-pp-deep">{data.level}</span>
            )}
          </p>
        </div>
      </section>

      <SummaryPills data={data} />

      <section className="flex flex-col gap-2">
        <div className={`${stCard} p-3`}>
          {/* The current streak lives here, with the week it is counted on. */}
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-pp-ink">
              <Flame className="size-4 fill-orange-400 text-orange-500" strokeWidth={2.2} aria-hidden /> {t("dailyStreak")}
            </span>
            <span className="rounded-full bg-st-orange-soft px-2.5 py-0.5 text-[12.5px] font-bold text-st-orange">
              {t("daysN", { n: p?.streak.current ?? 0 })}
            </span>
          </div>
          <StreakCalendar practised={p?.practisedDays ?? []} today={academyToday()} />
          <p className="mt-2 text-[11.5px] text-pp-muted">{t("streakHint")}</p>
          {/* The best run so far, as the card's last line. */}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-pp-line pt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-pp-muted">
              <Trophy className="size-4 text-st-gold" strokeWidth={2.2} aria-hidden /> {t("longestStreak")}
            </span>
            <span className="text-[13px] font-bold text-pp-ink">{t("daysN", { n: p?.streak.longest ?? 0 })}</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>{tp("appearance")}</SectionTitle>
        <AppearancePicker />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t3("account")}</SectionTitle>
        <LichessCard />
        <ChangePasswordForm tone="student" />
        <SignOutButton className={`${secondaryPill} w-full lg:hidden`}>
          <LogOut className="size-4" aria-hidden /> {tc("signOut")}
        </SignOutButton>
      </section>
    </div>
  );
}
