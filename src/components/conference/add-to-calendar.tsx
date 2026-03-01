"use client";

import { CalendarPlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AddToCalendarProps {
  title: string;
  start: string;   // YYYYMMDD
  end?: string;     // YYYYMMDD (exclusive, day after last day)
}

function formatICS(title: string, start: string, end: string) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HGS//Conference//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,
    "DESCRIPTION:13th International Conference of the Hellenic Geographical Society",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function AddToCalendar({ title, start, end }: AddToCalendarProps) {
  const endDate = end ?? nextDay(start);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${start}/${endDate}` +
    `&details=${encodeURIComponent("HGS 13th International Conference – Geography Matters")}`;

  const outlookUrl =
    `https://outlook.live.com/calendar/0/action/compose` +
    `?subject=${encodeURIComponent(title)}` +
    `&startdt=${fmtISO(start)}` +
    `&enddt=${fmtISO(endDate)}` +
    `&allday=true` +
    `&body=${encodeURIComponent("HGS 13th International Conference – Geography Matters")}`;

  function downloadICS() {
    const blob = new Blob([formatICS(title, start, endDate)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-medium text-black/40 hover:text-black/70 hover:border-black/20 transition-colors cursor-pointer"
        aria-label="Add to calendar"
      >
        <CalendarPlus className="h-3 w-3" />
        <span className="hidden sm:inline">Add to calendar</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs text-black/60 hover:bg-black/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            Google Calendar
          </a>
          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs text-black/60 hover:bg-black/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            Outlook Web
          </a>
          <button
            onClick={downloadICS}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-black/60 hover:bg-black/5 transition-colors cursor-pointer"
          >
            Download .ics
          </button>
        </div>
      )}
    </div>
  );
}

/** YYYYMMDD → next day as YYYYMMDD */
function nextDay(d: string) {
  const date = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/** YYYYMMDD → YYYY-MM-DD */
function fmtISO(d: string) {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}
