import {
  Users,
  Phone,
  Mail,
  Info,
  ChevronRight,
  CalendarDays,
  MapPin,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { CreditBar } from "@/components/CreditBar";
import {
  student,
  parentContacts,
  enrolledClasses,
  classStats,
} from "@/lib/student-data";

export default function StudentProfilePage() {
  const low = student.lowCredits;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-center text-2xl font-extrabold text-navy">My Profile</h1>

      <div className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} colorClass={student.avatarColor} sizeClass="size-14" />
          <div>
            <p className="font-bold text-ink">{student.name}</p>
            <p className="text-xs text-muted">ID: {student.studentId}</p>
            <p className="text-xs text-muted">
              {student.level} | {student.age} years old
            </p>
          </div>
        </div>
        <div className={`mt-4 rounded-xl p-4 ${low ? "bg-brick-soft/70" : "bg-olive-soft/70"}`}>
          <div className="flex items-baseline justify-between">
            <p className={`font-bold ${low ? "text-brick" : "text-ink"}`}>Remaining Credits</p>
            <p className={`text-lg font-extrabold ${low ? "text-brick" : "text-ink"}`}>
              {student.credits.remaining}
              <span className="text-xs font-semibold text-muted">/{student.credits.total}</span>
            </p>
          </div>
          <div className="mt-2">
            <CreditBar
              remaining={student.credits.remaining}
              total={student.credits.total}
              low={low}
              trackClass="bg-white/70"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            Valid until {student.credits.validUntil}
          </p>
        </div>
      </div>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <Users className="size-5 text-navy" /> Parents Contact
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {parentContacts.map((contact) => (
            <li key={contact.name} className="flex items-center gap-3">
              <Avatar name={contact.name} colorClass={contact.avatarColor} sizeClass="size-11" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy">{contact.name}</p>
                <p className="text-xs text-muted">{contact.relation}</p>
              </div>
              <a
                href={`tel:${contact.phone}`}
                aria-label={`Call ${contact.name}`}
                className="rounded-full p-2 text-navy hover:bg-navy-soft/40"
              >
                <Phone className="size-5" />
              </a>
              <a
                href={`mailto:${contact.email}`}
                aria-label={`Email ${contact.name}`}
                className="rounded-full p-2 text-navy hover:bg-navy-soft/40"
              >
                <Mail className="size-5" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <GraduationCap className="size-5 text-navy" /> Enrolled Classes
        </h2>
        {enrolledClasses.map((session) => (
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
              <span className="font-bold text-ink">
                {classStats.attended}/{student.credits.total}
              </span>
              <span className="block text-muted">classes attended</span>
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 px-3">
            <ClipboardList className="size-5 shrink-0 text-navy" />
            <p className="text-xs">
              <span className="font-bold text-ink">{classStats.remaining}</span>
              <span className="block text-muted">classes remaining</span>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <Info className="size-5 text-navy" /> More
        </h2>
        <ul className="mt-2">
          <li>
            <button className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-sm text-ink hover:bg-cream">
              <Phone className="size-4 text-navy" /> Contact School
              <ChevronRight className="ml-auto size-4 text-muted" />
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}
