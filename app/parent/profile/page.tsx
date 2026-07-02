import Link from "next/link";
import {
  ContactRound,
  Phone,
  Mail,
  Info,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { parent, children } from "@/lib/parent-data";

export default function ParentProfilePage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-center text-2xl font-extrabold text-navy">My Profile</h1>

      <div className="flex items-center gap-4 rounded-card border border-line bg-card p-4 shadow-sm">
        <Avatar name={parent.name} colorClass={parent.avatarColor} sizeClass="size-14" />
        <div>
          <p className="font-bold text-ink">{parent.name}</p>
          <p className="text-xs text-muted">ID: {parent.parentId}</p>
          <p className="text-xs text-muted">{parent.role}</p>
        </div>
      </div>

      <section>
        <h2 className="font-extrabold text-ink">My Children ({children.length})</h2>
        <ul className="mt-3 flex flex-wrap gap-6">
          {children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/parent/profile/${child.id}`}
                className="flex flex-col items-center gap-1"
              >
                <Avatar name={child.name} colorClass={child.avatarColor} sizeClass="size-14" />
                <span className="text-sm font-bold text-ink">{child.name}</span>
                <span className="text-[10px] text-muted">ID: {child.studentId}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-line bg-card p-4 shadow-sm">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <ContactRound className="size-5 text-navy" /> Contact Information
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-olive-soft">
              <Phone className="size-4 text-olive" />
            </span>
            <div>
              <p className="text-[11px] text-muted">Phone</p>
              <p className="text-sm text-ink">{parent.phone}</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-navy-soft">
              <Mail className="size-4 text-navy" />
            </span>
            <div>
              <p className="text-[11px] text-muted">Email</p>
              <p className="text-sm text-ink">{parent.email}</p>
            </div>
          </li>
        </ul>
      </section>

      <section className="rounded-card border border-line bg-card p-4 shadow-sm">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <Info className="size-5 text-navy" /> More
        </h2>
        <ul className="mt-2">
          <li>
            <button className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-sm text-ink hover:bg-cream">
              <Phone className="size-4 text-navy" /> Contact School
              <ChevronRight className="ml-auto size-4 text-muted" />
            </button>
          </li>
          <li>
            <button className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-sm text-ink hover:bg-cream">
              <Settings className="size-4 text-navy" /> Settings
              <ChevronRight className="ml-auto size-4 text-muted" />
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}
