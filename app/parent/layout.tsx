import type { Metadata } from "next";
import { DM_Sans, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ParentBottomNav2, ParentSideNav } from "@/components/parent/ParentNav2";
import { ParentDataProvider } from "@/components/parent/ParentData";
import { SESSION_COOKIE, fetchMeOrDown } from "@/lib/session";

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
export default async function ParentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const me = await fetchMeOrDown(store.get(SESSION_COOKIE)?.value);

  /* An unreachable server is not a sign-in problem. Redirecting to login here
     told a signed-in parent their session was gone whenever the backend was;
     saying what actually happened is the whole point. */
  if (me === "down") {
    const t = await getTranslations("pv2");
    return (
      <div
        className={`${dmSans.variable} ${poppins.variable} flex min-h-dvh items-center justify-center px-5 font-pp-sans text-pp-ink [background:radial-gradient(1200px_800px_at_50%_-10%,#f3efe6_0%,#f7f9fc_60%)]`}
      >
        <div className="flex w-full max-w-[380px] flex-col items-center gap-3 rounded-xl border-[1.5px] border-pp-line bg-white p-6 text-center shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          <span className="font-pp-display text-lg font-semibold">{t("serverDownTitle")}</span>
          <span className="text-[12.5px] leading-relaxed text-pp-muted">{t("serverDownBody")}</span>
          <a
            href="/parent"
            className="mt-1 rounded-xl bg-pp-navy px-6 py-2.5 text-sm font-bold text-white"
          >
            {t("retry")}
          </a>
        </div>
      </div>
    );
  }
  if (!me || me.role !== "Parent") redirect("/");

  return (
    <div
      className={`${dmSans.variable} ${poppins.variable} min-h-dvh font-pp-sans text-pp-ink [background:radial-gradient(1200px_800px_at_50%_-10%,#f3efe6_0%,#f7f9fc_60%)]`}
    >
      {/* The provider wraps the shell, not just the page: the sidebar greets
          the signed-in parent by name, so it needs the data too. */}
      <ParentDataProvider>
        <div className="mx-auto flex min-h-dvh w-full max-w-[410px] md:max-w-[760px] flex-col bg-white shadow-[0_0_0_1px_rgba(35,53,94,.06),0_30px_80px_rgba(35,53,94,.18)] lg:max-w-none lg:flex-row">
          <ParentSideNav />
          <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
            <main className="flex-1 bg-pp-bg">{children}</main>
            <ParentBottomNav2 />
          </div>
        </div>
      </ParentDataProvider>
    </div>
  );
}
