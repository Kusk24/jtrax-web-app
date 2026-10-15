"use client";

/**
 * The family's own data, on the parent's profile: a copy to download (PDPA
 * s.30–31) and a request to have it erased (s.33). The erasure is carried out
 * by the office — it decides what accounting law makes it keep — so the
 * button sends a request and then shows that one is open, rather than
 * pretending anything was deleted.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, ShieldCheck, Trash2 } from "lucide-react";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";
const panel = "overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card shadow-[0_7px_20px_rgba(35,53,94,.06)]";
const row = "flex w-full items-center gap-3 border-b border-pp-panel px-4 py-3.5 text-left last:border-0";
const icon = "flex size-8 flex-none items-center justify-center rounded-xl";

export function MyData() {
  const t = useTranslations("pv2");
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  /* "" until known, then "Open" / "Done" / "Declined", or "none". */
  const [request, setRequest] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/me/erasure-request", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { status: "" }))
      .then((out: { status?: string }) => live && setRequest(out.status || "none"))
      .catch(() => live && setRequest("none"));
    return () => {
      live = false;
    };
  }, []);

  async function download() {
    setDownloading(true);
    setDownloadFailed(false);
    try {
      const res = await fetch("/api/me/export", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "jtrax-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  async function ask() {
    setSending(true);
    setSendFailed(false);
    try {
      const res = await fetch("/api/me/erasure-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setRequest("Open");
      setConfirming(false);
    } catch {
      setSendFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className={label}>{t("myData")}</span>
      <div className={panel}>
        <button type="button" onClick={download} disabled={downloading} className={`${row} cursor-pointer hover:bg-pp-mist disabled:opacity-60`}>
          <span className={`${icon} bg-pp-soft text-pp-blue`}><Download className="size-4" /></span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px] font-semibold">{downloading ? t("downloadingData") : t("downloadData")}</span>
            <span className="text-[11px] text-pp-muted">{t("downloadDataSub")}</span>
          </span>
        </button>
        {downloadFailed && (
          <p role="alert" className="px-4 pb-3 text-[12px] font-semibold text-pp-danger">{t("downloadDataFailed")}</p>
        )}

        {request === "Open" ? (
          <div className={row}>
            <span className={`${icon} bg-pp-amber-soft text-pp-amber`}><ShieldCheck className="size-4" /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] font-semibold">{t("eraseRequested")}</span>
              <span className="text-[11px] text-pp-muted">{t("eraseRequestedSub")}</span>
            </span>
          </div>
        ) : confirming ? (
          <div className="flex flex-col gap-2.5 px-4 py-3.5">
            <span className="text-[13px] font-semibold">{t("eraseConfirm")}</span>
            <span className="text-[12px] leading-relaxed text-pp-sub">{t("eraseConfirmBody")}</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder={t("eraseNote")}
              aria-label={t("eraseNote")}
              className="w-full rounded-[13px] border-[1.5px] border-pp-line bg-pp-card px-3.5 py-2.5 text-[13px] text-pp-ink outline-none focus:border-pp-blue/60"
            />
            {sendFailed && <p role="alert" className="text-[12px] font-semibold text-pp-danger">{t("eraseFailed")}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="flex-1 cursor-pointer rounded-[12px] border-[1.5px] border-pp-line py-2.5 text-[13px] font-semibold text-pp-ink hover:bg-pp-mist">
                {t("eraseCancel")}
              </button>
              <button type="button" onClick={ask} disabled={sending} className="flex-1 cursor-pointer rounded-[12px] bg-pp-danger py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
                {t("eraseSend")}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} disabled={request === ""} className={`${row} cursor-pointer hover:bg-pp-mist disabled:opacity-60`}>
            <span className={`${icon} bg-pp-red-soft text-pp-danger`}><Trash2 className="size-4" /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] font-semibold">{t("eraseData")}</span>
              <span className="text-[11px] text-pp-muted">{t("eraseDataSub")}</span>
            </span>
          </button>
        )}
      </div>
      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="self-start text-[12px] font-semibold text-pp-blue underline-offset-4 hover:underline">
        {t("privacyLink")}
      </a>
    </div>
  );
}
