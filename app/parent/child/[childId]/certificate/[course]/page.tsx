"use client";

/**
 * A child's certificate for one course, as issued by the academy: shown only
 * once the office has certified them. Download is the browser's own
 * save-as-PDF, from a page laid out for printing.
 */
import { use, useEffect, useState } from "react";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { useParentData } from "@/components/parent/ParentData";
import { fetchCertificates, fmtHours, type CourseCertificate } from "@/lib/certificates";

export default function CertificatePage({ params }: { params: Promise<{ childId: string; course: string }> }) {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const router = useRouter();
  const { childId, course } = use(params);
  const { children: kids } = useParentData();
  const ch = kids.find((c) => c.key === childId);
  const [cert, setCert] = useState<CourseCertificate | null | undefined>(undefined);

  useEffect(() => {
    if (!ch) return;
    fetchCertificates(ch.id)
      .then((d) => setCert(d.courses.find((c) => c.course === course && c.status === "certified") ?? null))
      .catch(() => setCert(null));
  }, [ch, course]);

  if (!ch) notFound();
  if (cert === null) {
    return <p className="p-6 text-center text-[13px] text-pp-muted">{t("certNotIssued")}</p>;
  }
  if (cert === undefined) return null;

  const date = cert.certified_at
    ? new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${cert.certified_at.slice(0, 10)}T00:00:00`))
    : "";

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="size-[38px] flex-none cursor-pointer rounded-xl border-[1.5px] border-pp-line bg-pp-card text-base text-pp-ink hover:bg-pp-soft"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-pp-blue px-4 py-2.5 text-[13px] font-bold text-white"
        >
          <Download className="size-4" strokeWidth={2.2} aria-hidden />
          {t("certDownload")}
        </button>
      </div>

      <section className="certificate-print flex aspect-[1.414/1] w-full flex-col items-center justify-center gap-4 rounded-xl border-[6px] border-double border-pp-blue bg-white p-8 text-center text-[#1d2b4f] shadow-[0_8px_24px_rgba(35,53,94,.10)]">
        <Image src="/jca-logo.png" alt="JCA Chess Academy" width={72} height={72} className="h-16 w-auto" />
        <span className="text-[11px] font-bold uppercase tracking-[.3em] text-[#2e5cb8]">{t("certHeading")}</span>
        <span className="font-pp-display text-[30px] font-bold leading-tight">{ch.name}</span>
        <span className="max-w-[520px] text-[14px] leading-relaxed">
          {t("certBody", { course: t(`certCourse_${cert.course}`), hours: fmtHours(cert.hours_at_certification ?? cert.hours) })}
        </span>
        <span className="font-pp-display text-[20px] font-semibold text-[#2e5cb8]">{t(`certCourse_${cert.course}`)}</span>
        <div className="mt-2 flex w-full max-w-[520px] items-end justify-between gap-6 text-[12px]">
          <span className="flex flex-col items-start">
            <span className="font-semibold">{date}</span>
            <span className="text-[#5b6b8c]">{t("certDate")}</span>
          </span>
          <span className="flex flex-col items-end">
            <span className="font-semibold">JCA Chess Academy</span>
            <span className="text-[#5b6b8c]">{cert.certificate_id}</span>
          </span>
        </div>
      </section>
    </div>
  );
}
