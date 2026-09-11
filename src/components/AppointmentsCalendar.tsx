"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react";
import {
  DUMMY_APPOINTMENTS,
  appointmentTypeColor,
  labelForAppointmentType,
  type Appointment,
} from "@/lib/appointments-data";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function AppointmentsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-09-01"));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-09-11"));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of DUMMY_APPOINTMENTS) {
      const list = map.get(apt.date) ?? [];
      list.push(apt);
      map.set(apt.date, list);
    }
    for (const [key, list] of map) {
      map.set(
        key,
        list.sort((a, b) => a.time.localeCompare(b.time))
      );
    }
    return map;
  }, []);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedAppointments = appointmentsByDate.get(selectedKey) ?? [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">View Appointments</h1>
        <p className="text-sm text-slate-500">Calendar view of scheduled client appointments</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date("2026-09-11");
                  setCurrentMonth(startOfMonth(today));
                  setSelectedDate(today);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-indigo-50">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-indigo-800"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDate.get(dateKey) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const selected = isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[100px] border-b border-r border-slate-100 p-2 text-left transition-colors ${
                    inMonth ? "bg-white" : "bg-slate-50/80"
                  } ${selected ? "ring-2 ring-inset ring-indigo-500" : "hover:bg-indigo-50/40"}`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      today
                        ? "bg-indigo-600 font-semibold text-white"
                        : inMonth
                          ? "font-medium text-slate-800"
                          : "text-slate-400"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  <div className="mt-1 space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${appointmentTypeColor(apt.type)}`}
                      >
                        {formatTime(apt.time)} {apt.clientName.split(" ")[0]}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <p className="text-[10px] font-medium text-indigo-600">
                        +{dayAppointments.length - 2} more
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-indigo-900">
              {format(selectedDate, "EEEE, dd MMM yyyy")}
            </h3>
            <p className="text-xs text-indigo-700/80">
              {selectedAppointments.length} appointment
              {selectedAppointments.length === 1 ? "" : "s"}
            </p>
          </div>

          {selectedAppointments.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              No appointments on this day
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {selectedAppointments.map((apt) => (
                <li key={apt.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{apt.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${appointmentTypeColor(apt.type)}`}
                    >
                      {labelForAppointmentType(apt.type)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{apt.clientName}</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(apt.time)} · {apt.durationMin} min
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {apt.location}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {apt.assignedTo}
                    </p>
                  </div>
                  {apt.notes && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                      {apt.notes}
                    </p>
                  )}
                  <span
                    className={`mt-2 inline-block text-[10px] font-medium capitalize ${
                      apt.status === "cancelled"
                        ? "text-red-600"
                        : apt.status === "completed"
                          ? "text-green-600"
                          : "text-indigo-600"
                    }`}
                  >
                    {apt.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
