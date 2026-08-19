/* The frame every page with no sign-in shares.
 *
 * These pages are the academy's public face — a link on a poster, a QR code in
 * a hall, a message forwarded to a grandparent — so they use the clean-blue
 * `pp-*` system the admin console and the parent portal already share, rather
 * than the cream-and-brick palette of the student game. One product, one look,
 * and nothing here that hints at an app you have to sign in to.
 *
 * The fonts are loaded here rather than in the root layout because the root is
 * Fredoka/Nunito for the student side; DM Sans and Poppins belong to this
 * design system, and `--font-pp-sans` in globals.css expects them by name.
 */
import type { ReactNode } from "react";
import { DM_Sans, Poppins } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export function PublicShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={`${dmSans.variable} ${poppins.variable} min-h-dvh bg-pp-mist font-pp-sans text-pp-ink`}>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pp-faint">
            JCA Chess Academy
          </p>
          <h1 className="mt-1.5 font-pp-display text-2xl font-bold tracking-tight text-pp-navy sm:text-[28px]">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-sm text-pp-muted">{subtitle}</p>}
        </header>
        {children}
      </main>
      <footer className="pb-8 text-center text-xs text-pp-faint">
        JCA Chess Academy
      </footer>
    </div>
  );
}

/** A white card on the mist background — the console's one repeating shape. */
export function PublicCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-pp-line bg-white p-5 shadow-[0_1px_2px_rgba(35,53,94,.04)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}
