import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TeacherHome() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold text-navy">Teacher portal</h1>
      <p className="max-w-sm text-sm text-muted">
        The teacher interface hasn&apos;t been designed yet — it will be built from its
        own mockups.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2 text-sm font-semibold text-navy shadow-sm"
      >
        <ArrowLeft className="size-4" /> Back to role selection
      </Link>
    </main>
  );
}
