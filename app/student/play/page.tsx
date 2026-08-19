import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Bot, Users } from "lucide-react";
import { PlayShell, Panel } from "@/components/game/PlayShell";

export default async function PlayPage() {
  const t = await getTranslations("play");

  const modes = [
    { href: "/student/play/ai", icon: Bot, title: t("vsComputer"), body: t("vsComputerBody") },
    { href: "/student/play/friend", icon: Users, title: t("vsFriend"), body: t("vsFriendBody") },
  ];

  return (
    <PlayShell title={t("title")}>
      <div className="flex flex-col gap-3.5">
        {modes.map(({ href, icon: Icon, title, body }) => (
          <Link key={href} href={href} className="block">
            <Panel className="flex items-center gap-3.5 transition-transform active:scale-[0.98]">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sv-gold shadow-[inset_0_0_0_1.5px_rgb(206,219,236)]">
                <Icon className="size-6" strokeWidth={2.2} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{title}</span>
                <span className="text-xs leading-snug opacity-75">{body}</span>
              </span>
            </Panel>
          </Link>
        ))}
      </div>
    </PlayShell>
  );
}
