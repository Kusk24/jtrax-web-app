import { Suspense } from "react";
import StudentGame from "./StudentGame";

/* StudentGame reads `?screen=`, which needs a Suspense boundary. */
export default function StudentPage() {
  return (
    <Suspense fallback={null}>
      <StudentGame />
    </Suspense>
  );
}
