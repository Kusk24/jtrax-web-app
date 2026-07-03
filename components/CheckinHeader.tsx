import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function CheckinHeader({
  title = "Attendance",
  subtitle,
  backHref = "/teacher/schedule",
}: {
  title?: string;
  subtitle: string;
  backHref?: string;
}) {
  return (
    <header className="flex items-center gap-3">
      <Link
        href={backHref}
        aria-label="Back"
        className="rounded-full p-1.5 text-navy hover:bg-navy-soft/40"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <div>
        <h1 className="text-xl font-extrabold text-navy">{title}</h1>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
    </header>
  );
}
