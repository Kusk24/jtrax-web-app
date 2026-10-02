/* Challenge used to be its own tab. It now lives inside Play, with every other
   way of playing someone — this address stays so old links and bookmarks
   still land in the right place. */
import { redirect } from "next/navigation";

export default function ChallengePage() {
  redirect("/student/play#challenge");
}
