"use client";

/* The ID card step of a parent's tournament entry, after the child is picked:
 * the child's ID card is read for the date of birth, and the categories open
 * to that birth year can be chosen. The server keeps what it read, not the
 * photo, and the entry names the check — the same step as the public form. */
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Lock, Upload } from "lucide-react";
import {
  ageFromDOB, categoryAllows, scanChildIDCard, type PublicCategory,
} from "@/lib/registration";

export type IdCardRead = {
  studentId: string; checkId: string; dateOfBirth: string; name: string;
  /** Off a Thai ID card, for the optional Thai name. */
  thaiName: string; documentType: string;
};

export function TournamentIdCheck({
  tournamentId, studentId, startDate, categories, read, onRead, categoryId, onCategory, children,
}: {
  tournamentId: string;
  studentId: string;
  startDate: string;
  categories: PublicCategory[];
  /** The current read, for this child only. */
  read: IdCardRead | null;
  onRead: (read: IdCardRead | null) => void;
  categoryId: string;
  onCategory: (id: string) => void;
  /** Shown between the ID card and the categories — the player's names. */
  children?: ReactNode;
}) {
  const t = useTranslations("register");
  const [scanning, setScanning] = useState(false);
  const [failed, setFailed] = useState("");

  async function readCard(file: File) {
    setScanning(true);
    setFailed("");
    try {
      const { fields, checkId } = await scanChildIDCard(tournamentId, studentId, file);
      onRead({
        studentId, checkId, dateOfBirth: fields.dateOfBirth.value,
        name: [fields.firstName.value, fields.lastName.value].filter(Boolean).join(" "),
        thaiName: fields.thaiName?.value ?? "",
        documentType: fields.documentType,
      });
      onCategory("");
    } catch (err) {
      onRead(null);
      onCategory("");
      setFailed(err instanceof Error ? err.message : t("scanFailed"));
    } finally {
      setScanning(false);
    }
  }

  const dob = read?.dateOfBirth ?? "";
  const options = categories.map((c) => ({ ...c, ...categoryAllows(c.name, dob, startDate) }));

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
          {t("idCardTitle")}
          <span className="ml-0.5 text-pp-danger" aria-hidden>*</span>
        </span>
        <div className="flex flex-col gap-2.5 rounded-xl border-[1.5px] border-pp-line bg-pp-card p-4">
          <span className="flex items-center gap-1.5 text-[12px] text-pp-sub">
            <Lock className="size-3.5 flex-none" aria-hidden /> {t("idCardHint")}
          </span>
          <label
            className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-pp-line text-[13px] font-semibold text-pp-blue hover:border-pp-blue ${scanning ? "opacity-60" : ""}`}
          >
            <Upload className="size-4" aria-hidden />
            {scanning ? t("scanning") : read ? t("idCardAgain") : t("idCardChoose")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={scanning}
              aria-label={t("idCardTitle")}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void readCard(f);
              }}
            />
          </label>
          {read && (
            <p role="status" className="text-[12.5px] text-pp-ink">
              {t("scanRead", {
                name: read.name || "—",
                dob: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })
                  .format(new Date(`${read.dateOfBirth}T00:00:00`)),
                age: ageFromDOB(read.dateOfBirth, startDate ? new Date(startDate) : new Date()),
              })}
            </p>
          )}
          {failed && (
            <p role="alert" className="text-[12.5px] font-semibold text-pp-danger">{failed}</p>
          )}
        </div>
      </div>

      {children}

      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
            {t("category")}
            <span className="ml-0.5 text-pp-danger" aria-hidden>*</span>
          </span>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("category")}>
            {options.map((c) => {
              const selected = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!c.allowed}
                  onClick={() => onCategory(c.id)}
                  className="flex flex-col items-start gap-0.5 rounded-xl border-[1.5px] bg-pp-card px-3.5 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderColor: selected ? "var(--color-pp-blue)" : "var(--color-pp-line)" }}
                >
                  <span className="text-[13.5px] font-semibold text-pp-ink">{c.name}</span>
                  <span className="text-[11.5px] text-pp-muted">
                    {c.needsDob
                      ? t("categoryNeedsDob")
                      : c.limit === 0
                        ? t("categoryOpen")
                        : t("categoryBornFrom", { year: c.bornFrom })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
