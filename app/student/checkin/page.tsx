import { attendanceSession } from "@/lib/student-data";
import { CheckinFlow, type CheckinPhase } from "./CheckinFlow";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;

  // ?state= lets us preview each screen while there is no backend driving it.
  let initialPhase: CheckinPhase = attendanceSession.active ? "verifying" : "not-started";
  if (state === "not-started" || state === "success") initialPhase = state;

  return <CheckinFlow initialPhase={initialPhase} />;
}
