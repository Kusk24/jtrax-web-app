import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, fetchMe } from "@/lib/session";
import { DM_Sans, Poppins } from "next/font/google";

/* The same pairing as the console and the parent portal: DM Sans for body
   copy, Poppins for display.

   This screen used Chewy and Comic Relief — a rounded, hand-drawn set chosen
   to read as a child's app. Three faces across three surfaces meant a family
   moving between the parent portal and their child's saw two different
   products, and the academy is one. The playfulness lives in the colour,
   spacing and the squishy press feedback, none of which this touches. */
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "JTrax — Student",
};

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const me = await fetchMe(store.get(SESSION_COOKIE)?.value);
  if (!me || me.role !== "Student") redirect("/");

  return (
    <div
      className={`${dmSans.variable} ${poppins.variable} flex min-h-dvh w-full items-center justify-center bg-sv-tan font-sv-body sm:py-6`}
    >
      {children}
    </div>
  );
}
