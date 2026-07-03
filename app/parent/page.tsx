import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { ParentHeader } from "@/components/ParentHeader";
import { Avatar } from "@/components/Avatar";
import { ClassCard } from "@/components/ClassCard";
import { children, upcomingClasses, getChild } from "@/lib/parent-data";

export default function ParentHome() {
  const t = useTranslations("home");
  const lowCreditChild = children.find((c) => c.lowCredits);
  return (
    <div className="flex flex-col gap-6">
      <ParentHeader />

      {lowCreditChild && (
        <div className="flex items-center gap-4 rounded-card bg-peach px-5 py-4">
          <AlertTriangle className="size-7 shrink-0 fill-peach-ink text-peach" />
          <div>
            <p className="font-bold text-ink">
              {t("lowCreditsTitleChild", { name: lowCreditChild.name })}
            </p>
            <p className="text-xs text-muted">{t("lowCreditsBody")}</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-lg font-extrabold text-ink">{t("myChildren")}</h2>
        <ul className="mt-3 flex flex-wrap gap-6">
          {children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/parent/profile/${child.id}`}
                className="flex flex-col items-center gap-1"
              >
                <Avatar
                  name={child.name}
                  colorClass={child.avatarColor}
                  sizeClass="size-14"
                  badge={child.lowCredits}
                />
                <span className={`text-sm font-bold ${child.lowCredits ? "text-brick" : "text-ink"}`}>
                  {child.name}
                </span>
                <span className="text-[10px] text-muted">ID: {child.studentId}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-extrabold text-ink">{t("upcomingClasses")}</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {upcomingClasses.map((session) => {
            const child = getChild(session.childId);
            if (!child) return null;
            return <ClassCard key={session.id} session={session} child={child} />;
          })}
        </div>
      </section>
    </div>
  );
}
