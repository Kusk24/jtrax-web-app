import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TeacherBottomNav, TeacherSideNav } from "@/components/TeacherNav";
import { SESSION_COOKIE, fetchMe } from "@/lib/session";

export const metadata: Metadata = {
  title: "JTrax — Teacher",
};

/** The guard lives on the layout so every route under /teacher inherits it —
    the parent and student portals gate the same way. */
export default async function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const me = await fetchMe(store.get(SESSION_COOKIE)?.value);
  if (!me || me.role !== "Teacher") redirect("/");

  return (
    <div className="min-h-dvh lg:pl-56">
      <TeacherSideNav />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-8 lg:pb-10 lg:pt-8">
        {children}
      </main>
      <TeacherBottomNav />
    </div>
  );
}
