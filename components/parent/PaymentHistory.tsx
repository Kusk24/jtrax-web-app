"use client";

/**
 * The Profile's Payment History: every payment for the family's children,
 * each saying when, for which child, for what, how much, and what it bought —
 * with the receipt one tap on the row away, as a voucher image to save.
 */
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, Download, Loader2, Trophy } from "lucide-react";
import { money } from "@/lib/money";
import type { PaymentRecord } from "@/lib/payment-history";
import { drawReceipt, loadImage } from "@/lib/receipt-image";
import { useParentData } from "@/components/parent/ParentData";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";
const panel = "overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card shadow-[0_7px_20px_rgba(35,53,94,.06)]";

function fmtDay(iso: string, locale: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
}

const credits = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""));

function StatusChip({ status }: { status: PaymentRecord["status"] }) {
  const t = useTranslations("pv2");
  const tone =
    status === "Paid" ? "bg-pp-green-soft text-pp-green"
    : status === "Cancelled" ? "bg-pp-danger-soft text-pp-danger"
    : "bg-pp-amber-soft text-pp-amber";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>{t(`payStatus.${status}`)}</span>;
}

/** The receipt as a voucher image: shown as a picture, saved as one. On a phone
    a long press on it saves it too. */
function Receipt({ p, onClose }: { p: PaymentRecord; onClose: () => void }) {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const { parent } = useParentData();
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    let objectUrl = "";
    (async () => {
      const logo = await loadImage("/parent/jca-logo.png");
      await document.fonts?.ready;
      /* The shell's own font, so the voucher matches the app. */
      const font = getComputedStyle(ref.current ?? document.body).fontFamily || "sans-serif";
      const method = p.method ? (t.has(`payMethodName.${p.method}`) ? t(`payMethodName.${p.method}`) : p.method) : "—";
      const details = [
        { label: t("payDate"), value: fmtDay(p.date, locale) },
        { label: t("receivedFrom"), value: parent.name || "—" },
        { label: t("payChild"), value: p.childName },
        { label: t("payMethod"), value: method },
      ];
      if (p.reference) details.push({ label: t("payReference"), value: p.reference });
      const canvas = drawReceipt(
        {
          school: "JCA Chess School",
          title: t("receiptOfficial"),
          details,
          itemHeader: t("receiptItem"),
          amountHeader: t("receiptAmount"),
          item: p.forWhat,
          itemSub:
            p.kind === "tournament"
              ? t("payTournament")
              : `${t("payCourse")}${p.credits > 0 ? ` · ${t("creditsCount", { count: credits(p.credits) })}` : ""}`,
          itemAmount: money(p.gross || p.paid, locale),
          adjustments:
            p.discount > 0
              ? [
                  { label: t("paySubtotal"), value: money(p.gross, locale) },
                  { label: t("payDiscount"), value: `− ${money(p.discount, locale)}` },
                ]
              : [],
          totalLabel: t("payAmountPaid"),
          total: money(p.paid, locale),
          status: t(`payStatus.${p.status}`),
          statusTone: p.status === "Paid" ? "paid" : p.status === "Cancelled" ? "cancelled" : "pending",
          thanks: t("receiptThanks"),
          footnote: t("receiptFootnote"),
        },
        logo,
        font,
      );
      canvas.toBlob((b) => {
        if (!live || !b) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      }, "image/png");
    })();
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [p, t, locale, parent.name]);

  const fileName = `JCA-${p.id}.png`;
  async function save() {
    if (!blob || !url) return;
    /* On a phone, the share sheet is where "Save Image" lives. */
    const file = new File([blob], fileName, { type: "image/png" });
    if (window.matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        /* Dismissed the sheet — fall back to a download. */
      }
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(28,25,40,.55)] p-4">
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("receiptTitle")}
        className="flex max-h-[92vh] w-full max-w-[420px] flex-col gap-3"
      >
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- a generated blob, not a static asset
            <img src={url} alt={t("receiptTitle")} className="block w-full rounded-2xl" />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-pp-card">
              <Loader2 className="size-6 animate-spin text-pp-faint" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border-[1.5px] border-white/40 bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/20"
          >
            {t("close")}
          </button>
          <button
            onClick={save}
            disabled={!url}
            className="inline-flex flex-[2] cursor-pointer items-center justify-center gap-2 rounded-xl bg-pp-card py-3 text-sm font-bold text-pp-ink hover:bg-pp-mist disabled:opacity-60"
          >
            <Download className="size-4" /> {t("saveImage")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaymentHistory({ payments }: { payments: PaymentRecord[] }) {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const [open, setOpen] = useState<PaymentRecord | null>(null);

  return (
    <div className="flex flex-col gap-3 md:col-span-2">
      <span className={label}>{t("paymentHistory")}</span>
      <div className={panel}>
        {payments.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-pp-muted">{t("noPayments")}</p>
        ) : (
          payments.map((p) => {
            const Kind = p.kind === "tournament" ? Trophy : BookOpen;
            return (
              <button
                key={p.id}
                onClick={() => setOpen(p)}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-pp-panel px-4 py-3.5 text-left last:border-0 hover:bg-pp-mist"
              >
                <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-pp-soft text-pp-blue">
                  <Kind className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[13.5px] font-semibold text-pp-ink">
                    {p.forWhat} <span className="font-normal text-pp-muted">· {p.childName}</span>
                  </span>
                  <span className="truncate text-[11.5px] text-pp-faint">
                    {fmtDay(p.date, locale)}
                  </span>
                </span>
                <span className="flex max-w-[55%] flex-none flex-col items-end gap-1">
                  <span className="text-[14px] font-bold text-pp-ink">{money(p.paid, locale)}</span>
                  <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                    {p.kind === "course" && p.credits > 0 && (
                      <span className="rounded-full bg-pp-green-soft px-2 py-0.5 text-[10px] font-bold text-pp-green">
                        {t("creditsPlus", { count: credits(p.credits) })}
                      </span>
                    )}
                    {p.status !== "Paid" && <StatusChip status={p.status} />}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
      {open && <Receipt p={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
