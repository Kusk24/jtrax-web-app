import type {
  Student,
  ClassSession,
  NotificationItem,
  AttendanceRecord,
} from "./types";

export const student: Student = {
  id: "penny",
  name: "Penny",
  studentId: "u6612127",
  level: "Beginner",
  age: 8,
  avatarColor: "bg-amber-200 text-amber-900",
  credits: { used: 18, remaining: 2, total: 20, validUntil: "20 May 2026" },
  lowCredits: true,
};

export const parentContacts = [
  {
    name: "Sandy Jones",
    relation: "Mother",
    avatarColor: "bg-rose-200 text-rose-800",
    phone: "+66123456789",
    email: "sandy01234@gmail.com",
  },
  {
    name: "Mile Jones",
    relation: "Father",
    avatarColor: "bg-sky-200 text-sky-900",
    phone: "+66123456790",
    email: "mile.jones@gmail.com",
  },
];

export const enrolledClasses: ClassSession[] = [
  {
    id: "penny-chess",
    childId: "penny",
    course: "Beginner Chess",
    section: "Sec 101",
    day: "Mon, Wed",
    time: "02:00 PM - 03:00 PM",
    teacher: "Ms. Serene",
    location: "Bangkok",
    room: "Room 1A",
  },
];

export const classStats = { attended: 18, remaining: 2 };

export const upcomingToday: ClassSession = {
  id: "today-chess",
  childId: "penny",
  course: "Beginner Chess",
  section: "Sec 101",
  day: "Mon",
  time: "02:00 PM - 03:00 PM",
  teacher: "Ms. Serene",
  location: "Bangkok",
  room: "Room 1A",
};

/**
 * Mock state of the teacher-controlled attendance session for today's class.
 * Flip `active` to false to see the "not started" screen (or use ?state=not-started).
 */
export const attendanceSession = {
  active: true,
  course: "Beginner Chess",
  section: "Section 101",
  checkinTime: "02:10 PM",
};

export const scheduleWeek = [
  { date: 10, label: "MON", isToday: true },
  { date: 11, label: "TUE", isToday: false },
  { date: 12, label: "WED", isToday: false },
  { date: 13, label: "THU", isToday: false },
  { date: 14, label: "FRI", isToday: false },
  { date: 15, label: "SAT", isToday: false },
];

export const scheduleByDate: Record<number, ClassSession[]> = {
  10: [{ ...upcomingToday, id: "sch-mon" }],
  12: [{ ...upcomingToday, id: "sch-wed", day: "Wed" }],
};

export const attendanceHistory: AttendanceRecord[] = [
  {
    id: "sa1",
    childId: "penny",
    date: "May 10, 2026",
    course: "Beginner Chess",
    section: "Sec 101",
    time: "9:00 AM - 10:00 AM",
    location: "Bangkok",
    status: "present",
    creditsAfter: "1/20 credits",
  },
  {
    id: "sa2",
    childId: "penny",
    date: "May 9, 2026",
    course: "Beginner Chess",
    section: "Sec 101",
    time: "9:00 AM - 10:00 AM",
    location: "Bangkok",
    status: "absent",
    creditsAfter: "2/20 credits",
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "sn1",
    kind: "success",
    title: "Checked in Successfully.",
    body: "You are present on May 10, 2026 for Beginner Chess, checked in at 9:00 AM.",
    unread: true,
  },
  {
    id: "sn2",
    kind: "alert",
    title: "Almost Out of Credits.",
    body: "You only have two credits left for course - Beginner Chess. Please ask your parents to contact the office to top up.",
    unread: true,
  },
  {
    id: "sn3",
    kind: "expiry",
    title: "Credits Expiring Soon.",
    body: "Your credits will be expired in 5 days. Please join the class to use up the remaining credit before expired.",
    unread: true,
  },
];
