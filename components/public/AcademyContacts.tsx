/* How to reach the academy: its phones, email and LINE, as the office keeps
   them in Settings → Academy Contact. On the registration form's closing
   note and on the page a closed or unknown registration link shows. */
import { useTranslations } from "next-intl";
import { Mail, MessageCircle, Phone } from "lucide-react";
import type { AcademyContact } from "@/lib/academy-contact";

export function AcademyContacts({ contact }: { contact: AcademyContact }) {
  const t = useTranslations("register");
  return (
    <div className="w-full max-w-md rounded-xl bg-[#edf4ff] px-4 py-3 text-left text-[12.5px] text-pp-ink">
      <p className="font-semibold">{t("contactTitle")}</p>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5">
        <Phone className="size-3.5 text-pp-blue" aria-hidden />
        {contact.phones.map((p, i) => (
          <span key={p}>
            {i > 0 && " · "}
            <a className="font-semibold text-pp-blue" href={`tel:${p.replace(/[^\d+]/g, "")}`}>{p}</a>
          </span>
        ))}
      </p>
      <p className="mt-1 flex items-center gap-1.5">
        <Mail className="size-3.5 text-pp-blue" aria-hidden />
        <a className="font-semibold text-pp-blue" href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>
      <p className="mt-1 flex items-center gap-1.5">
        <MessageCircle className="size-3.5 text-pp-blue" aria-hidden />
        <a className="font-semibold text-pp-blue" href={contact.line} target="_blank" rel="noopener noreferrer">LINE</a>
      </p>
    </div>
  );
}
