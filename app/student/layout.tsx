import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, fetchMe } from "@/lib/session";
import { Chewy, Comic_Relief } from "next/font/google";

const chewy = Chewy({ weight: "400", subsets: ["latin"], variable: "--font-chewy" });
const comic = Comic_Relief({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-comic" });

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
      className={`${chewy.variable} ${comic.variable} flex min-h-dvh w-full items-center justify-center bg-sv-tan font-sv-body sm:py-6`}
    >
      {children}
    </div>
  );
}
