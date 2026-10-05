"use client";

/* An id with a small copy button — the child's Student ID on their profile,
   which a parent types into the public tournament form for the student price. */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

export function CopyId({ id }: { id: string }) {
  const t = useTranslations("pv2");
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-xs font-semibold text-pp-ink">{id}</span>
      <button
        type="button"
        aria-label={t("copyStudentId")}
        onClick={() => {
          navigator.clipboard?.writeText(id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }).catch(() => {});
        }}
        className="flex size-6 cursor-pointer items-center justify-center rounded-md text-pp-muted hover:bg-pp-soft hover:text-pp-ink"
      >
        {copied ? <Check className="size-3.5 text-pp-green" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      </button>
    </span>
  );
}
