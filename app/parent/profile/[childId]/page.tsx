import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { CreditBar } from "@/components/CreditBar";
import {
  children,
  getChild,
  enrolledClasses,
  childAttendanceHistory,
} from "@/lib/parent-data";

export function generateStaticParams() {
  return children.map((c) => ({ childId: c.id }));
}

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const child = getChild(childId);
  if (!child) notFound();

  const low = child.lowCredits;
  const classes = enrolledClasses[child.id] ?? [];
  const history = childAttendanceHistory[child.id] ?? [];
  const attended = child.credits.used;
  const remaining = child.credits.remaining;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative flex items-center justify-center">
        <Link
          href="/parent/profile"
          aria-label="Back to my profile"
          className="absolute left-0 rounded-full p-1.5 text-navy hover:bg-navy-soft/40"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-2xl font-extrabold text-navy">{child.name}&apos;s Profile</h1>
      </div>

      <div className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center gap-4">
          <Avatar name={child.name} colorClass={child.avatarColor} sizeClass="size-14" />
          <div>
            <p className="font-bold text-ink">{child.name}</p>
            <p className="text-xs text-muted">ID: {child.studentId}</p>
            <p className="text-xs text-muted">
              {child.level} | {child.age} years old
            </p>
          </div>
        </div>
        <div className={`mt-4 rounded-xl p-4 ${low ? "bg-brick-soft/70" : "bg-olive-soft/70"}`}>
          <div className="flex items-baseline justify-between">
            <p className={`font-bold ${low ? "text-brick" : "text-ink"}`}>Remaining Credits</p>
            <p className={`text-lg font-extrabold ${low ? "text-brick" : "text-ink"}`}>
              {remaining}
              <span className="text-xs font-semibold text-muted">/{child.credits.total}</span>
            </p>
          </div>
          <div className="mt-2">
            <CreditBar
              remaining={remaining}
              total={child.credits.total}
              low={low}
              trackClass="bg-white/70"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted">Valid until {child.credits.validUntil}</p>
        </div>
      </div>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <GraduationCap className="size-5 text-navy" /> Enrolled Classes
        </h2>
        {classes.map((session) => (
          <div key={session.id} className="mt-4 flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-olive-soft text-2xl">
              ♟️
            </span>
            <div>
              <p className="font-bold text-ink">
                {session.course} ({session.section})
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink">
                <CalendarDays className="size-3.5 text-navy" /> {session.day} {session.time}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink">
                <MapPin className="size-3.5 text-navy" /> {session.location}
              </p>
            </div>
          </div>
        ))}
        <div className="mt-4 grid grid-cols-2 divide-x divide-navy/20 rounded-xl bg-navy-soft/50 py-3">
          <div className="flex items-center justify-center gap-2 px-3">
            <CalendarCheck className="size-5 shrink-0 text-navy" />
            <p className="text-xs">
              <span className="font-bold text-ink">{attended}/{child.credits.total}</span>
              <span className="block text-muted">classes attended</span>
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 px-3">
            <ClipboardList className="size-5 shrink-0 text-navy" />
            <p className="text-xs">
              <span className="font-bold text-ink">{remaining}</span>
              <span className="block text-muted">classes remaining</span>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-extrabold text-ink">
            <History className="size-5 text-navy" /> Attendance History
          </h2>
          <Link href="/parent/attendance" className="text-xs font-bold text-navy">
            View All
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {history.map((item, i) => {
            const present = item.status === "present";
            return (
              <li key={i} className="flex items-center gap-3">
                {present ? (
                  <CheckCircle2 className="size-6 shrink-0 fill-olive text-card" />
                ) : (
                  <XCircle className="size-6 shrink-0 fill-brick text-card" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{item.course}</p>
                  <p className="text-[11px] text-muted">{item.when}</p>
                </div>
                <span
                  className={`text-xs font-semibold ${present ? "text-olive" : "text-brick"}`}
                >
                  {present ? "Present" : "Absent"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
