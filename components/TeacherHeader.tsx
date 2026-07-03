import Link from "next/link";
import { Avatar } from "./Avatar";
import { teacher } from "@/lib/teacher-data";

export function TeacherHeader({ classCount }: { classCount: number }) {
  return (
    <header className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-navy">Hi, {teacher.name} !</h1>
          <span className="rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Teacher
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          You have {classCount === 1 ? "one class" : `${classCount} classes`} today.
        </p>
      </div>
      <Link href="/teacher/profile" aria-label="My profile">
        <Avatar name={teacher.name} colorClass={teacher.avatarColor} sizeClass="size-11" />
      </Link>
    </header>
  );
}
