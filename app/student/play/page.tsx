import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Bot, ChevronRight, KeyRound } from "lucide-react";
import { PlayShell, Panel } from "@/components/game/PlayShell";

export default async function PlayPage() {
  const t = await getTranslations("play");

  const modes = [
    { href: "/student/play/ai", icon: Bot, title: t("vsComputer"), body: t("vsComputerBody") },
    { href: "/student/play/friend", icon: KeyRound, title: t("vsFriend"), body: t("vsFriendBody") },
  ];

  return (
    <PlayShell title={t("title")} nav>
      <p className="mb-4 text-[11px] text-[#7083a3]">{t("chooseMode")}</p>
      <div className="flex flex-col gap-3">
        {modes.map(({ href, icon: Icon, title, body }, index) => (
          <Link key={href} href={href} className="block">
            <Panel className={`flex min-h-[80px] items-center gap-3.5 transition-transform active:scale-[0.98] ${index === 0 ? "!border-[#bfe4d8] !bg-[#ebfaf5]" : "!border-[#ded6fa] !bg-[#f3efff]"}`}>
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white ${index === 0 ? "text-[#15906b]" : "text-[#7457d7]"}`}>
                <Icon className="size-6" strokeWidth={2.2} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[14px] font-bold text-[#10264d]">{title}</span>
                <span className="text-[10.5px] leading-snug text-[#7083a3]">{body}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-[#7083a3]" strokeWidth={2.2} />
            </Panel>
          </Link>
        ))}
      </div>
    </PlayShell>
  );
}
