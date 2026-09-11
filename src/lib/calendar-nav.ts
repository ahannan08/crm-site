import type { NavSubItem } from "./document-nav";

export const calendarSubItems: NavSubItem[] = [
  {
    href: "/calendar/appointments",
    label: "View Appointments",
    match: (path) => path.startsWith("/calendar"),
  },
];

export function isCalendarSectionActive(path: string): boolean {
  return path.startsWith("/calendar");
}
