import type { Metadata } from "next";
import { ParentBottomNav, ParentSideNav } from "@/components/ParentNav";

export const metadata: Metadata = {
  title: "JTrax — Parent",
};

export default function ParentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh md:pl-56">
      <ParentSideNav />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-8">
        {children}
      </main>
      <ParentBottomNav />
    </div>
  );
}
