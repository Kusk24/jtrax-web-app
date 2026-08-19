/* The challenge screen's route.
 *
 * A route rather than a screen in StudentGame's state, for the same reason the
 * board is one: a pupil who follows an invitation, reloads, or comes back from
 * a game should land here rather than at the home screen.
 *
 * The student's own id is resolved on the server from the session, not asked
 * for on the client — it is the one identifier this screen shows about the
 * person using it, and it should come from who they are signed in as.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, fetchMe } from "@/lib/session";
import { ChallengeScreen } from "./ChallengeScreen";

export default async function ChallengePage() {
  const store = await cookies();
  const me = await fetchMe(store.get(SESSION_COOKIE)?.value);
  if (!me?.studentId) redirect("/student");
  return <ChallengeScreen myStudentId={me.studentId} />;
}
