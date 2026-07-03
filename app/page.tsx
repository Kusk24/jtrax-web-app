import Link from "next/link";
import { GraduationCap, Users, Presentation, ArrowRight } from "lucide-react";

const roles = [
  {
    href: "/student",
    label: "Student",
    description: "Check your schedule, credits and attendance.",
    icon: GraduationCap,
    accent: "bg-olive-soft text-olive",
  },
  {
    href: "/parent",
    label: "Parent",
    description: "Follow your children's classes, credits and check-ins.",
    icon: Users,
    accent: "bg-navy-soft text-navy",
  },
  {
    href: "/teacher",
    label: "Teacher",
    description: "Manage your classes and take attendance.",
    icon: Presentation,
    accent: "bg-brick-soft text-brick",
  },
];

export default function RoleSelectPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <h1 className="text-4xl font-extrabold tracking-tight text-navy">JTrax</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Choose how you want to sign in
      </p>
      <div className="mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {roles.map(({ href, label, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-card border-2 border-line bg-card p-5 shadow-clay transition hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md sm:flex-col sm:items-start sm:gap-3 sm:p-6"
          >
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
              <Icon className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-bold text-ink">
                {label}
                <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-navy" />
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted">
        Temporary role selection — will be replaced by login once the backend is ready.
      </p>
    </main>
  );
}
