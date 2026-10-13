import { contactFrom, type AcademyContact } from "@/lib/academy-contact";

const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

/** The academy's contact details, from the office's settings; the website's
    own set when the backend cannot be reached. */
export async function fetchContact(): Promise<AcademyContact> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/academy`, { cache: "no-store" });
    return contactFrom(res.ok ? await res.json() : {});
  } catch {
    return contactFrom({});
  }
}
