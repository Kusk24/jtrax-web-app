/* How a family reaches the school. The office keeps these in the console's
   Settings → Academy Contact (academy_* on the backend, served at
   /public/academy); ACADEMY_CONTACT is the website's set, used for any field
   left empty or when the backend cannot be reached. */
export type AcademyContact = {
  phones: string[];
  email: string;
  /** A link LINE opens. */
  line: string;
};

export const ACADEMY_CONTACT: AcademyContact = {
  phones: ["02-853-9836", "099-0156-156"],
  email: "jcachess@gmail.com",
  line: "https://lin.ee/7fhq3N1",
};

/** "02-853-9836 / 099-0156-156" is two numbers. */
export function splitPhones(raw: string): string[] {
  return raw.split(/\s*[/,\n]\s*/).map((p) => p.trim()).filter(Boolean);
}

/** What the office typed for LINE, as a link: a link as is, "lin.ee/…" with
    its scheme, an "@id" as LINE's add-friend link. Mirrors the backend. */
export function lineHref(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes("/")) return `https://${v}`;
  return `https://line.me/R/ti/p/@${encodeURIComponent(v.replace(/^@/, ""))}`;
}

/** The public endpoint's fields as the registration form uses them. */
export function contactFrom(c: { phone?: string; email?: string; lineId?: string }): AcademyContact {
  const phones = splitPhones(c.phone ?? "");
  return {
    phones: phones.length ? phones : ACADEMY_CONTACT.phones,
    email: c.email?.trim() || ACADEMY_CONTACT.email,
    line: lineHref(c.lineId ?? "") || ACADEMY_CONTACT.line,
  };
}
