import type { Metadata } from "next";
import { DM_Sans, Poppins } from "next/font/google";
import { ParentBottomNav2, ParentSideNav } from "@/components/parent/ParentNav2";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "JTrax — Parent",
};

/** Parent portal redesign: clean blue design system on a white shell —
    sidebar ≥lg, phone-width card below. */
export default function ParentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${dmSans.variable} ${poppins.variable} min-h-dvh font-pp-sans text-pp-ink [background:radial-gradient(1200px_800px_at_50%_-10%,#f3efe6_0%,#f7f9fc_60%)]`}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-[410px] flex-col bg-white shadow-[0_0_0_1px_rgba(35,53,94,.06),0_30px_80px_rgba(35,53,94,.18)] lg:max-w-none lg:flex-row">
        <ParentSideNav />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <main className="flex-1 bg-pp-bg">{children}</main>
          <ParentBottomNav2 />
        </div>
      </div>
    </div>
  );
}
