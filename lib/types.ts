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
