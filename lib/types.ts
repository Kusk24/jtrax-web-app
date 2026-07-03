export type Student = {
  id: string;
  name: string;
  studentId: string;
  level: string;
  age: number;
  avatarColor: string;
  credits: { used: number; remaining: number; total: number; validUntil: string };
  lowCredits: boolean;
};

/** A parent views a Student as one of their children — same shape. */
export type Child = Student;

export type ClassSession = {
  id: string;
  childId: string;
  course: string;
  section: string;
  day: string;
  time: string;
  teacher: string;
  location: string;
  room: string;
  status?: "present" | "absent";
};

export type NotificationItem = {
  id: string;
  kind: "alert" | "success" | "expiry";
  title: string;
  body: string;
  unread: boolean;
};

export type Teacher = {
  id: string;
  name: string;
  teacherId: string;
  experienceYears: number;
  avatarColor: string;
  phone: string;
  email: string;
};

/** A class as the teacher sees it — roster-level, not tied to one student. */
export type TeacherClass = {
  id: string;
  course: string;
  section: string;
  day: string;
  time: string;
  studentsEnrolled: number;
  capacity: number;
  location: string;
  room: string;
};

/** One student row in a teacher's roster / attendance list. */
export type RosterStudent = {
  id: string;
  name: string;
  studentId: string;
  avatarColor: string;
  sessionsUsed: number;
  sessionsTotal: number;
  creditsRemaining: number;
  expiresOn: string;
  lowCredits: boolean;
};

/** A finished (or in-progress) attendance session for one class meeting. */
export type TeacherAttendanceSession = {
  id: string;
  date: string;
  classId: string;
  course: string;
  section: string;
  time: string;
  location: string;
  presentIds: string[];
  absentIds: string[];
};

export type AttendanceRecord = {
  id: string;
  childId: string;
  date: string;
  course: string;
  section: string;
  time: string;
  location: string;
  status: "present" | "absent";
  creditsAfter: string;
};
