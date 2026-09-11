export type AppointmentType = "meeting" | "follow_up" | "consultation" | "document_review";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  title: string;
  clientName: string;
  date: string;
  time: string;
  durationMin: number;
  type: AppointmentType;
  status: AppointmentStatus;
  assignedTo: string;
  location: string;
  notes?: string;
}

export const APPOINTMENT_TYPES: { value: AppointmentType; label: string; color: string }[] = [
  { value: "meeting", label: "Meeting", color: "bg-indigo-100 text-indigo-800" },
  { value: "follow_up", label: "Follow-up", color: "bg-purple-100 text-purple-800" },
  { value: "consultation", label: "Consultation", color: "bg-cyan-100 text-cyan-800" },
  { value: "document_review", label: "Document Review", color: "bg-amber-100 text-amber-800" },
];

export const DUMMY_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1",
    title: "Visa Consultation",
    clientName: "Priya Sharma",
    date: "2026-09-08",
    time: "10:00",
    durationMin: 45,
    type: "consultation",
    status: "completed",
    assignedTo: "Priya Sharma",
    location: "Office - Room 2",
  },
  {
    id: "apt-2",
    title: "Follow-up Call",
    clientName: "Mohd Saleem",
    date: "2026-09-09",
    time: "11:30",
    durationMin: 30,
    type: "follow_up",
    status: "completed",
    assignedTo: "Abdul Rasheed",
    location: "Phone Call",
  },
  {
    id: "apt-3",
    title: "Document Review",
    clientName: "Irfan Syed",
    date: "2026-09-10",
    time: "14:00",
    durationMin: 60,
    type: "document_review",
    status: "scheduled",
    assignedTo: "Sohaib Mohammad",
    location: "Office - Room 1",
    notes: "Bring passport and bank statements",
  },
  {
    id: "apt-4",
    title: "Meeting Booked",
    clientName: "Anita Desai",
    date: "2026-09-11",
    time: "09:30",
    durationMin: 45,
    type: "meeting",
    status: "scheduled",
    assignedTo: "Priya Sharma",
    location: "Office - Room 2",
  },
  {
    id: "apt-5",
    title: "Schengen Visa Discussion",
    clientName: "Rahul Khan",
    date: "2026-09-11",
    time: "15:00",
    durationMin: 30,
    type: "consultation",
    status: "scheduled",
    assignedTo: "Abdul Rasheed",
    location: "Video Call",
  },
  {
    id: "apt-6",
    title: "Follow-up",
    clientName: "Mohd Masthan Baba",
    date: "2026-09-12",
    time: "10:30",
    durationMin: 30,
    type: "follow_up",
    status: "scheduled",
    assignedTo: "Sohaib Mohammad",
    location: "Phone Call",
  },
  {
    id: "apt-7",
    title: "UK Visitor Visa Meeting",
    clientName: "Mohd Saleem",
    date: "2026-09-15",
    time: "12:00",
    durationMin: 45,
    type: "meeting",
    status: "scheduled",
    assignedTo: "Abdul Rasheed",
    location: "Office - Room 1",
  },
  {
    id: "apt-8",
    title: "Document Collection",
    clientName: "Priya Sharma",
    date: "2026-09-18",
    time: "16:00",
    durationMin: 20,
    type: "document_review",
    status: "scheduled",
    assignedTo: "Priya Sharma",
    location: "Office Reception",
  },
  {
    id: "apt-9",
    title: "Initial Consultation",
    clientName: "Irfan Syed",
    date: "2026-09-22",
    time: "11:00",
    durationMin: 60,
    type: "consultation",
    status: "scheduled",
    assignedTo: "Sohaib Mohammad",
    location: "Office - Room 2",
  },
  {
    id: "apt-10",
    title: "Cancelled Follow-up",
    clientName: "Anita Desai",
    date: "2026-09-25",
    time: "13:00",
    durationMin: 30,
    type: "follow_up",
    status: "cancelled",
    assignedTo: "Priya Sharma",
    location: "Phone Call",
  },
];

export function labelForAppointmentType(type: AppointmentType): string {
  return APPOINTMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function appointmentTypeColor(type: AppointmentType): string {
  return APPOINTMENT_TYPES.find((t) => t.value === type)?.color ?? "bg-gray-100 text-gray-800";
}

export function appointmentsForDate(date: string): Appointment[] {
  return DUMMY_APPOINTMENTS.filter((a) => a.date === date).sort((a, b) =>
    a.time.localeCompare(b.time)
  );
}
