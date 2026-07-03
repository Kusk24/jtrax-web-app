import type { Metadata } from "next";
import { TeacherBottomNav, TeacherSideNav } from "@/components/TeacherNav";

export const metadata: Metadata = {
  title: "JTrax — Teacher",
};

export default function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh md:pl-56">
      <TeacherSideNav />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
        {children}
      </main>
      <TeacherBottomNav />
    </div>
  );
}
