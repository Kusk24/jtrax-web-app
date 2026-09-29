"use client";

/* The student portal's building blocks.
 *
 * The same system as the parent portal and the console (jtrax-admin/DESIGN.md):
 * 16px cards on a 1.5px line, pill buttons, Poppins for headings and figures,
 * the pp-* palette. What is particular to the student portal is here too —
 * stat cards, the streak calendar — so every screen draws them the
 * same way.
 *
 * No emoji anywhere: icons are lucide's (which has the chess pieces) or drawn
 * here, so they take the text colour and scale with it.
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, type LucideIcon } from "lucide-react";

export type Tone = "blue" | "amber" | "green" | "plum" | "orange" | "navy" | "red";

/** Icon well and figure colours per tone — each pair clears 4.5:1 as text. */
export const TONE: Record<Tone, { well: string; ink: string; bar: string }> = {
  blue: { well: "bg-pp-soft", ink: "text-pp-blue", bar: "bg-pp-blue" },
  navy: { well: "bg-[#e3e9f6]", ink: "text-pp-navy", bar: "bg-pp-navy" },
  amber: { well: "bg-[#fbeedf]", ink: "text-[#9c5a1b]", bar: "bg-[#e0a23a]" },
  orange: { well: "bg-[#fff0e6]", ink: "text-[#b85a14]", bar: "bg-[#f08a3c]" },
  green: { well: "bg-pp-green-soft", ink: "text-pp-green", bar: "bg-[#3f9a6c]" },
  plum: { well: "bg-[#eae6f5]", ink: "text-[#5c4a8a]", bar: "bg-[#7d68c2]" },
  red: { well: "bg-pp-red-soft", ink: "text-pp-red", bar: "bg-pp-red" },
};

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-[18px] ${className}`}>{children}</section>;
}

/** The page's own title — the only h1 on a screen. */
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="m-0 font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">{title}</h1>
        {sub && <p className="mt-1 text-[14px] text-pp-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** A card's heading, with an optional "see all" link on the right. */
export function SectionHeader({ title, href, linkLabel, icon: Icon }: { title: string; href?: string; linkLabel?: string; icon?: LucideIcon }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-pp-display text-[16px] font-semibold text-pp-ink">
        {Icon && <Icon className="size-[18px] text-pp-blue" strokeWidth={2} aria-hidden />}
        {title}
      </h2>
      {href && linkLabel && (
        <Link href={href} className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-pp-blue hover:underline">
          {linkLabel}
          <ChevronRight className="size-4" strokeWidth={2.2} aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function IconWell({ icon: Icon, tone = "blue", size = "md" }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-12 rounded-2xl" : size === "sm" ? "size-8 rounded-lg" : "size-10 rounded-xl";
  const glyph = size === "lg" ? "size-6" : size === "sm" ? "size-4" : "size-5";
  return (
    <span className={`flex shrink-0 items-center justify-center ${box} ${TONE[tone].well} ${TONE[tone].ink}`} aria-hidden>
      <Icon className={glyph} strokeWidth={2} />
    </span>
  );
}

/** One figure with its label. */
export function StatCard({ icon, value, label, tone = "blue" }: { icon: LucideIcon; value: React.ReactNode; label: string; tone?: Tone }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-3.5 sm:p-4">
      <IconWell icon={icon} tone={tone} />
      <span className="flex min-w-0 flex-col">
        <span className="font-pp-display text-[19px] font-bold leading-tight text-pp-ink">{value}</span>
        <span className="mt-0.5 text-[12.5px] font-medium leading-tight text-pp-muted">{label}</span>
      </span>
    </div>
  );
}

/** A bar that fills smoothly when its value changes. */
export function ProgressBar({ value, max, tone = "blue", label, thick = false }: { value: number; max: number; tone?: Tone; label?: string; thick?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={`${thick ? "h-3" : "h-2"} w-full overflow-hidden rounded-full bg-pp-soft`}
    >
      <div className={`h-full rounded-full ${TONE[tone].bar} transition-[width] duration-700 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Avatar({ name, size = 56, ring = false }: { name: string; size?: number; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-pp-soft font-pp-display font-bold text-pp-blue ${ring ? "ring-4 ring-white/25" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.trim().charAt(0).toUpperCase() || "S"}
    </span>
  );
}

/** This week, a square per day, lit on the days practised. */
export function StreakCalendar({ practised, today }: { practised: string[]; today: string }) {
  const t = useTranslations("sv2");
  const lit = new Set(practised);
  const end = new Date(today + "T00:00:00");
  // This week, Monday to Sunday: the days still to come are shown faintly,
  // so the pupil can see how much of the week is left to keep the streak.
  const start = new Date(end);
  start.setDate(end.getDate() - ((end.getDay() + 6) % 7));
  const rows: { key: string; day: number; future: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    rows.push({ key, day: d.getDate(), future: d > end });
  }
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="grid grid-cols-7 gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map((w) => (
          <span key={w} className="text-center text-[11px] font-semibold text-pp-muted">{t(`weekday.${w}`)}</span>
        ))}
        {rows.map((d) => (
          <span
            key={d.key}
            title={d.key}
            className={`flex aspect-square items-center justify-center rounded-lg text-[11.5px] font-semibold ${
              d.future
                ? "border-[1.5px] border-dashed border-pp-line text-pp-faint"
                : lit.has(d.key)
                  ? "bg-[#f08a3c] text-white"
                  : d.key === today
                    ? "border-[1.5px] border-pp-blue text-pp-blue"
                    : "bg-pp-bg text-pp-faint"
            }`}
          >
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-pp-line bg-pp-bg px-5 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-pp-soft text-pp-blue" aria-hidden>
        <Icon className="size-6" strokeWidth={1.8} />
      </span>
      <p className="font-pp-display text-[15px] font-semibold text-pp-ink">{title}</p>
      {body && <p className="max-w-[340px] text-[13px] leading-relaxed text-pp-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export const primaryPill =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-[7px] rounded-full border-none bg-pp-blue px-5 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-pp-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-pp-faint";
export const secondaryPill =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-[7px] rounded-full border border-pp-line bg-pp-card px-5 text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft disabled:cursor-not-allowed disabled:text-pp-faint";
/** A clickable card's hover: a lift and the console's shadow, desktop only in practice. */
export const cardHover =
  "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-pp-blue/40 hover:shadow-[0_8px_24px_rgba(36,59,99,.14)]";
