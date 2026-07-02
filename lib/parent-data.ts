import type {
  Child,
  ClassSession,
  NotificationItem,
  AttendanceRecord,
} from "./types";

export type { Child, ClassSession, NotificationItem, AttendanceRecord };

export const parent = {
  name: "Sandy Jones",
  firstName: "Sandy",
  parentId: "p10012",
  role: "Guardian",
  phone: "+66123456789",
  email: "sandy01234@gmail.com",
  avatarColor: "bg-rose-200 text-rose-800",
};

export const children: Child[] = [
  {
    id: "penny",
    name: "Penny",
    studentId: "u6612127",
    level: "Beginner",
    age: 8,
    avatarColor: "bg-amber-200 text-amber-900",
    credits: { used: 18, remaining: 2, total: 20, validUntil: "20 May 2026" },
    lowCredits: true,
  },
  {
    id: "uri",
    name: "Uri",
    studentId: "u6612129",
    level: "Beginner",
    age: 8,
    avatarColor: "bg-violet-200 text-violet-900",
    credits: { used: 6, remaining: 14, total: 20, validUntil: "20 June 2026" },
    lowCredits: false,
  },
];

export const enrolledClasses: Record<string, ClassSession[]> = {
  penny: [
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
  ],
  uri: [
    {
      id: "uri-chess",
      childId: "uri",
      course: "Beginner Chess",
      section: "Sec 101",
      day: "Mon, Wed",
      time: "09:00 AM - 10:00 AM",
      teacher: "Ms. Serene",
      location: "Bangkok",
      room: "Room 1A",
    },
  ],
};

export const upcomingClasses: ClassSession[] = [
  {
    id: "up-1",
    childId: "penny",
    course: "Beginner Chess",
    section: "Sec 101",
    day: "Mon",
    time: "02:00 PM - 03:00 PM",
    teacher: "Ms. Serene",
    location: "Bangkok",
    room: "Room 1A",
  },
];

/** Schedule week shown on the Schedule tab (May 2026). */
export const scheduleWeek = [
  { date: 10, label: "MON", isToday: true },
  { date: 11, label: "TUE", isToday: false },
  { date: 12, label: "WED", isToday: false },
  { date: 13, label: "THU", isToday: false },
  { date: 14, label: "FRI", isToday: false },
  { date: 15, label: "SAT", isToday: false },
];

export const scheduleByDate: Record<number, ClassSession[]> = {
  10: [
    {
      id: "sch-uri",
      childId: "uri",
      course: "Beginner Chess",
      section: "Sec 101",
      day: "Mon",
      time: "9:00 AM - 10:00 AM",
      teacher: "Ms. Serene",
      location: "Bangkok",
      room: "Room 1A",
      status: "present",
    },
    {
      id: "sch-penny",
      childId: "penny",
      course: "Beginner Chess",
      section: "Sec 101",
      day: "Mon",
      time: "02:00 PM - 03:00 PM",
      teacher: "Ms. Serene",
      location: "Bangkok",
      room: "Room 1A",
    },
  ],
  12: [
    {
      id: "sch-uri-wed",
      childId: "uri",
      course: "Beginner Chess",
      section: "Sec 101",
      day: "Wed",
      time: "9:00 AM - 10:00 AM",
      teacher: "Ms. Serene",
      location: "Bangkok",
      room: "Room 1A",
    },
    {
      id: "sch-penny-wed",
      childId: "penny",
      course: "Beginner Chess",
      section: "Sec 101",
      day: "Wed",
      time: "02:00 PM - 03:00 PM",
      teacher: "Ms. Serene",
      location: "Bangkok",
      room: "Room 1A",
    },
  ],
};

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    kind: "alert",
    title: "Penny - Almost Out of Credits.",
    body: "Penny only left two credits for course - Beginner Chess. Please contact the office to top up.",
    unread: true,
  },
  {
    id: "n2",
    kind: "success",
    title: "Uri - Checked in Successfully.",
    body: "Uri is present on May 10, 2026 for Beginner Chess, checked in at 9:00 AM.",
    unread: true,
  },
  {
    id: "n3",
    kind: "expiry",
    title: "Penny - Credits Expiring Soon.",
    body: "Penny's credits will be expired in 5 days. Please join the class to use up the remaining credit before expired.",
    unread: true,
  },
];

export const attendanceHistory: AttendanceRecord[] = [
  {
    id: "a1",
    childId: "uri",
    date: "May 10, 2026",
    course: "Beginner Chess",
    section: "Sec 101",
    time: "9:00 AM - 10:00 AM",
    location: "Bangkok",
    status: "present",
    creditsAfter: "14/20 credits",
  },
  {
    id: "a2",
    childId: "uri",
    date: "May 9, 2026",
    course: "Beginner Chess",
    section: "Sec 101",
    time: "9:00 AM - 10:00 AM",
    location: "Bangkok",
    status: "absent",
    creditsAfter: "15/20 credits",
  },
  {
    id: "a3",
    childId: "penny",
    date: "May 9, 2026",
    course: "Beginner Chess",
    section: "Sec 101",
    time: "9:00 AM - 10:00 AM",
    location: "Bangkok",
    status: "absent",
    creditsAfter: "3/20 credits",
  },
];

export const childAttendanceHistory: Record<
  string,
  { course: string; section: string; when: string; status: "present" | "absent" }[]
> = {
  penny: [
    { course: "Beginner Chess (Sec 101)", section: "Sec 101", when: "May 12, Mon 9:00 AM - 10:00 AM", status: "present" },
    { course: "Beginner Chess (Sec 101)", section: "Sec 101", when: "May 5, Tue 9:00 AM - 10:00 AM", status: "present" },
    { course: "Beginner Chess (Sec 101)", section: "Sec 101", when: "May 4, Mon 9:00 AM - 10:00 AM", status: "present" },
  ],
  uri: [
    { course: "Beginner Chess (Sec 101)", section: "Sec 101", when: "May 12, Mon 9:00 AM - 10:00 AM", status: "present" },
    { course: "Beginner Chess (Sec 101)", section: "Sec 101", when: "May 5, Tue 9:00 AM - 10:00 AM", status: "present" },
    { course: "Beginner Chess (Sec 101)", section: "Sec 101", when: "May 4, Mon 9:00 AM - 10:00 AM", status: "present" },
  ],
};

export function getChild(id: string): Child | undefined {
  return children.find((c) => c.id === id);
}
