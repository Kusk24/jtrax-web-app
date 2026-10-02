import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DM_Sans, Poppins } from "next/font/google";
import { SESSION_COOKIE, fetchMe } from "@/lib/session";
import { StudentBottomNav, StudentSideNav } from "@/components/student/StudentNav";

/* The parent portal's pairing (app/parent/layout.tsx): DM Sans for body copy,
   Poppins for display — one design system for the family's two accounts. */
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "JTrax — Student",
};

/* The student portal in the parent portal's shell (app/parent/layout.tsx):
   sidebar from a laptop up, a tab bar along the bottom below that, and the
   page using the width it is given. It used to be a 390×844 phone drawn in
   the middle of the screen — on a laptop, a small phone on a large tan wall,
   and nothing like the parent portal a family had just come from. */
export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const me = await fetchMe(store.get(SESSION_COOKIE)?.value);
  if (!me || me.role !== "Student") redirect("/");

  /* The account's saved Appearance, server-rendered as the parent shell does,
     so dark arrives dark with no flash. */
  const theme = me.themePreference === "Dark" ? "dark" : me.themePreference === "Light" ? "light" : "system";

  return (
    <div
      data-theme={theme}
      /* `student-shell` scopes the admin console's design (jtrax-admin/DESIGN.md)
         to this portal: its text colours, focus ring and flat buttons. */
      className={`${dmSans.variable} ${poppins.variable} min-h-dvh student-shell font-pp-sans text-pp-ink [background:radial-gradient(1200px_800px_at_50%_-10%,var(--color-pp-bd-a)_0%,var(--color-pp-bd-b)_60%)]`}
    >
      <div className="mx-auto flex min-h-dvh w-full flex-col bg-pp-card shadow-[0_0_0_1px_rgba(35,53,94,.06),0_30px_80px_rgba(35,53,94,.18)] lg:flex-row">
        {/* The nav reads `?screen=`, which needs a Suspense boundary. */}
        <Suspense fallback={<div className="hidden w-[232px] flex-none lg:block" />}>
          <StudentSideNav />
        </Suspense>
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          {/* A slim centred label on phones; the sidebar carries the brand on wide screens. */}
          <div className="bg-pp-bg px-4 pt-2.5 text-center lg:hidden">
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-pp-blue">JTrax — Student</span>
          </div>
          <main className="flex-1 bg-pp-bg px-4 pb-10 pt-2.5 lg:px-6 lg:pt-6">
            <div className="mx-auto w-full max-w-[1180px]">{children}</div>
          </main>
          <Suspense fallback={null}>
            <StudentBottomNav />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
