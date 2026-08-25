"use client";

/**
 * The console's page header, in the portal: a left-aligned display title with
 * an optional line under it.
 *
 * Every screen used to open with a full-bleed centred band in pp-soft, which
 * put the title in a different place, size and alignment from the console's —
 * the two apps read as two products. Same 23px display / 14px body pairing
 * here as `page-kit.tsx`'s PageHeader.
 */
export function ParentPageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col">
      <h1 className="m-0 font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">
        {title}
      </h1>
      {sub && <p className="mt-1 text-sm text-pp-muted">{sub}</p>}
    </div>
  );
}
