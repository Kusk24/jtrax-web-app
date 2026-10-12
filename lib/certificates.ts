/**
 * Certificates by course, as the server works them out: hours of each course
 * (private and group together) against the requirement, and whether the
 * academy has certified the child. Read-only here — only the office certifies.
 */
export type CertificateCourse = "starters" | "juniors" | "nxt";

export type CourseCertificate = {
  course: CertificateCourse;
  hours: number;
  status: "in_progress" | "certified";
  certificate_id?: string;
  certified_at?: string;
  hours_at_certification?: number;
};

export type StudentCertificates = { student_name?: string; required_hours: number; courses: CourseCertificate[] };

export async function fetchCertificates(studentId: string): Promise<StudentCertificates> {
  const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/certificates`, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as StudentCertificates;
  return Array.isArray(data?.courses) ? data : { required_hours: 50, courses: [] };
}

/** 35.5, not 35.50 or 35.4999. */
export const fmtHours = (h: number) => String(Math.round(h * 10) / 10);

/** Share of the requirement, 0–100. */
export const progressPct = (hours: number, required: number) =>
  required > 0 ? Math.min(100, Math.round((hours / required) * 100)) : 0;
