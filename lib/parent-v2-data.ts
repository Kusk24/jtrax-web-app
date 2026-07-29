/* Parent portal redesign mock data, ported from JTrax Parent.dc.html.
   Names/courses stay English (backend data); UI strings live in pv2.* */

export type ChildKey = "penny" | "uri";

export interface ChildV2 {
  key: ChildKey;
  name: string;
  id: string;
  level: "Beginner" | "Intermediate";
  age: number;
  photo: string;
  avBg: string;
  clsTitle: string;
  sched: string;
  time: string;
  branch: string;
  room: string;
  teacher: string;
  credits: number;
  valid: string;
  daysLeft: number;
  attended: number;
  total: number;
  completedSessions: number;
  totalSessions: number;
  streak: number;
  practiceWeek: number[];
}

export const childrenV2: ChildV2[] = [
  {
    key: "penny",
    name: "Penny",
    id: "u6612127",
    level: "Beginner",
    age: 8,
    photo: "/parent/penny.jpeg",
    avBg: "#b4c5e4",
    clsTitle: "Beginner Chess (Sec 101)",
    sched: "Mon & Wed",
    time: "2:00 – 3:00 PM",
    branch: "Bangkok",
    room: "Room 1A",
    teacher: "Ms. Serene",
    credits: 2,
    valid: "20 May 2026",
    daysLeft: 10,
    attended: 18,
    total: 20,
    completedSessions: 18,
    totalSessions: 50,
    streak: 12,
    practiceWeek: [18, 26, 15, 32, 20, 40, 17],
  },
  {
    key: "uri",
    name: "Uri",
    id: "u6612129",
    level: "Intermediate",
    age: 10,
    photo: "/parent/uri.jpeg",
    avBg: "#cfd9f0",
    clsTitle: "Intermediate Chess (Sec 101)",
    sched: "Mon",
    time: "9:00 – 10:00 AM",
    branch: "Bangkok",
    room: "Room 1A",
    teacher: "Ms. Serene",
    credits: 14,
    valid: "20 Jun 2026",
    daysLeft: 41,
    attended: 6,
    total: 20,
    completedSessions: 32,
    totalSessions: 50,
    streak: 5,
    practiceWeek: [10, 0, 22, 14, 0, 18, 12],
  },
];

export const getChildV2 = (key: string) =>
  childrenV2.find((c) => c.key === key);

/* Months shown in the attendance calendars. offset = weekday index of day 1
   (Monday-first). */
export const MONTHS = [
  { name: "April 2026", days: 30, offset: 2 },
  { name: "May 2026", days: 31, offset: 5 },
  { name: "June 2026", days: 30, offset: 0 },
];
export const MAY = 1;

/* Per-child attendance records by month index. */
export const ATT: Record<ChildKey, Record<number, { present: number[]; absent: number[] }>> = {
  penny: {
    0: { present: [22, 27, 29], absent: [] },
    1: { present: [5, 10], absent: [3] },
    2: { present: [], absent: [] },
  },
  uri: {
    0: { present: [20, 27], absent: [] },
    1: { present: [10], absent: [3] },
    2: { present: [], absent: [] },
  },
};

export type SenderKind = "teacher" | "branch" | "admin";

export interface AnnouncementV2 {
  id: string;
  sender: SenderKind;
  senderName: string;
  title: string;
  msg: string;
  child: string | null;
  cls: string | null;
  attachment: boolean;
  attachmentImg?: string;
  time: string;
}

export const announcementsV2: AnnouncementV2[] = [
  {
    id: "a1",
    sender: "teacher",
    senderName: "Ms. Serene",
    title: "Class Moved to Room 1B",
    msg: "Penny's Beginner Chess class on Wed will be held in Room 1B instead of 1A due to maintenance.",
    child: "Penny",
    cls: "Beginner Chess (Sec 101)",
    attachment: true,
    attachmentImg: "/parent/classroom-room1b.jpeg",
    time: "Today · 8:10 AM",
  },
  {
    id: "a2",
    sender: "branch",
    senderName: "Bangkok Branch",
    title: "Public Holiday Closure",
    msg: "The Bangkok branch will be closed on May 12 for a public holiday. All classes that day are rescheduled.",
    child: null,
    cls: null,
    attachment: true,
    time: "Yesterday · 5:00 PM",
  },
  {
    id: "a3",
    sender: "admin",
    senderName: "JCA Head Office",
    title: "New Term Starts June 1",
    msg: "Registration for Term 3 opens June 1. Existing students get priority enrollment for two weeks.",
    child: null,
    cls: null,
    attachment: true,
    time: "May 8 · 10:00 AM",
  },
];

export interface NotifV2 {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  child: ChildKey;
}

export const notifsV2: NotifV2[] = [
  {
    id: "n2",
    icon: "✓",
    iconBg: "#E6F4EC",
    title: "Uri — Checked in Successfully",
    body: "Uri is present on May 10, 2026 for Beginner Chess, checked in at 9:00 AM.",
    time: "Today · 9:02 AM",
    child: "uri",
  },
  {
    id: "n4",
    icon: "⏱",
    iconBg: "#FBEEDF",
    title: "Penny — Screen Time Limit Exceeded",
    body: "Penny has exceeded her daily screen time limit of 1 hr 30 min. Consider reviewing her app usage.",
    time: "Today · 4:15 PM",
    child: "penny",
  },
];

export const tournamentV2 = {
  name: "Wellington College Chess Championship 2026",
  image: "/parent/chess-championship-2025.png",
  venue: "Wellington College International School Bangkok",
  date: "Saturday, 7 June 2026",
  timeRange: "9:00 AM – 5:00 PM",
  regDeadline: "5 June 2026",
  day: "7 June 2026",
  fee: "THB 300",
  closesInDays: 5,
};

/* Grouped attendance history rows (all children). */
export const histV2: { date: string; child: ChildKey; status: "Present" | "Absent"; time: string }[] = [
  { date: "May 10, 2026", child: "uri", status: "Present", time: "9:00 – 10:00 AM" },
  { date: "May 10, 2026", child: "penny", status: "Present", time: "2:00 – 3:00 PM" },
  { date: "May 5, 2026", child: "penny", status: "Present", time: "2:00 – 3:00 PM" },
  { date: "May 3, 2026", child: "penny", status: "Absent", time: "2:00 – 3:00 PM" },
  { date: "May 3, 2026", child: "uri", status: "Absent", time: "9:00 – 10:00 AM" },
];

export const todayActivityV2 = [
  { child: "Penny", mins: 32, done: true },
  { child: "Uri", mins: 18, done: false },
];

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const wdOfMonth = (m: number, d: number) =>
  WD[(MONTHS[m].offset + d - 1) % 7];
