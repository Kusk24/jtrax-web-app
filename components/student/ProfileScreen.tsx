"use client";

/* Profile: the pupil as a chess player, each fact once, compact.
 *
 * Who they are (name, login ID, level) on one row, three numbers (rating,
 * games played, puzzles solved), this week's streak with the current count,
 * and the account settings last. No points: the student panel has none. */
import { useTranslations } from "next-intl";
import { Flame, LogOut, Pencil, Trophy } from "lucide-react";
import { LichessCard } from "@/components/student/LichessCard";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { SignOutButton } from "@/components/SignOutButton";
import { StreakCalendar, secondaryPill } from "./kit";
import { SummaryPills, stCard } from "./HomeScreen";
import { ProfileEditSheet } from "./ProfileEditSheet";
import { loadAvatar, saveAvatar } from "@/lib/student-avatar";
import { useEffect, useState } from "react";
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
  const [editing, setEditing] = useState(false);
  /* The emoji avatar lives in this browser; read after the first paint. */
  const [avatar, setAvatar] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setAvatar(loadAvatar(data.studentId)), 0);
    return () => clearTimeout(id);
  }, [data.studentId]);
  const tc = useTranslations("common");
  const p = data.progress;

  return (
    <div className="st-enter mx-auto flex w-full max-w-[640px] flex-col gap-5">
      {/* Who, centred: the avatar, then the name, then the login ID and level. */}
      <section className="flex flex-col items-center gap-2 pt-1 text-center">
        {/* The avatar opens the editor; the pencil says it can be changed. */}
        <button type="button" onClick={() => setEditing(true)} aria-label={t3("editProfile")} className="relative cursor-pointer">
          <span className="flex size-20 items-center justify-center rounded-full bg-pp-soft font-pp-display text-[32px] font-bold text-pp-blue ring-4 ring-pp-card" aria-hidden>
            {/* Their emoji, or the white knight until they choose one. */}
            <span className="st-badge-reveal inline-block text-[40px] leading-none">{avatar || "♘"}</span>
          </span>
          <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-st-brand text-white ring-2 ring-pp-card" aria-hidden>
            <Pencil className="size-2.5" strokeWidth={2.6} />
          </span>
        </button>
        <div className="flex min-w-0 max-w-full flex-col items-center gap-1">
          <h1 className="max-w-full truncate font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">{data.name || "—"}</h1>
          <p className="flex items-center justify-center gap-2 text-[12px] text-pp-muted">
            @{data.studentId || "—"}
            {/* The level the office set. */}
            {data.level && (
              <span className="rounded-full bg-pp-plum-soft px-2 py-0.5 text-[10.5px] font-bold text-pp-deep">{data.level}</span>
            )}
          </p>
        </div>
      </section>

      {editing && (
        <ProfileEditSheet
          name={data.name}
          studentId={data.studentId}
          avatar={avatar}
          onClose={() => setEditing(false)}
          onSave={async (next) => {
            const cleanName = next.name.trim();
            if (cleanName !== data.name && !(await data.rename(cleanName))) return false;
            saveAvatar(data.studentId, next.avatar);
            setAvatar(next.avatar);
            return true;
          }}
        />
      )}

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
        <SectionTitle>{t3("account")}</SectionTitle>
        <LichessCard />
      </section>

      <section className="flex flex-col gap-2">
        <AppearancePicker />
      </section>

      <section className="flex flex-col gap-2">
        <ChangePasswordForm tone="student" />
        <SignOutButton className={`${secondaryPill} w-full lg:hidden`}>
          <LogOut className="size-4" aria-hidden /> {tc("signOut")}
        </SignOutButton>
      </section>
    </div>
  );
}
