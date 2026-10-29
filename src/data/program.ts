// Conference 2026 programme (from Program.xlsx, sheet "Program").
// Session ids match src/data/sessions.ts; presentations per session live in
// presentations.json (registered abstracts, listed alphabetically by first
// author until the organisers send the final order).
import presentationsData from "./presentations.json"
import { sessions, type Session } from "./sessions"

export type Venue = "EKKE" | "HUA"

export interface ProgramRoom {
  venue: Venue
  name: string
}

/** A room booking that is not a conference session, e.g. a sponsor presentation. */
export interface ProgramEvent {
  label: string
  note?: string
}

/** A session id, another event, or null for an empty room. */
export type ProgramCell = string | ProgramEvent | null

export type ProgramSlot =
  | { kind: "sessions"; time: string; sessions: ProgramCell[] }
  | { kind: "break"; time: string; label: string }
  | { kind: "plenary"; time: string; label: string }

export interface ProgramDay {
  id: string
  weekday: string
  date: string
  shortDate: string
  rooms: ProgramRoom[]
  slots: ProgramSlot[]
}

export interface PresentationAuthor {
  name: string
  affiliation: string
}

export interface Presentation {
  code: string
  title: string
  authors: PresentationAuthor[]
  abstract: string
}

export const venues: Record<Venue, { name: string; address: string }> = {
  EKKE: {
    name: "National Centre for Social Research (EKKE)",
    address: "Archimidous 8, 17675, Kallithea, Athens",
  },
  HUA: {
    name: "Harokopio University of Athens (HUA)",
    address: "El. Venizelou Ave. 70, 17676, Kallithea, Athens",
  },
}

export const programDays: ProgramDay[] = [
  {
    id: "day1",
    weekday: "Friday",
    date: "27 November 2026",
    shortDate: "Fri 27 Nov",
    rooms: [
      { venue: "EKKE", name: "Room I.1" },
      { venue: "EKKE", name: "Room I.2" },
      { venue: "EKKE", name: "Main Hall" },
      { venue: "HUA", name: "Ceremony Hall" },
      { venue: "HUA", name: "Room 1" },
      { venue: "HUA", name: "Room 2" },
      { venue: "HUA", name: "Room 3" },
      { venue: "HUA", name: "Room 4" },
      { venue: "HUA", name: "Room 5" },
      { venue: "HUA", name: "Room 6" },
    ],
    slots: [
      { kind: "sessions", time: "09:30–11:00", sessions: ["39", "3", "4", "7", "9", "23", "27", "35", "32", "5"] },
      { kind: "break", time: "11:00–11:30", label: "Coffee break" },
      { kind: "sessions", time: "11:30–13:00", sessions: ["38", "19", "4", "7", "9", "23", "27", "35", "32", "5"] },
      { kind: "break", time: "13:00–14:00", label: "Lunch break at HUA" },
      { kind: "plenary", time: "14:00–16:00", label: "Plenary session" },
      { kind: "break", time: "16:00–16:30", label: "Coffee break" },
      { kind: "sessions", time: "16:30–18:00", sessions: ["6", "21", "22", "7", "16", "23", "17", "35", "32", "1"] },
      { kind: "break", time: "18:00–18:30", label: "Break" },
      { kind: "sessions", time: "18:30–20:00", sessions: ["6", "21", "22", "7", "16", "34", "17", "36a", "32", "1"] },
    ],
  },
  {
    id: "day2",
    weekday: "Saturday",
    date: "28 November 2026",
    shortDate: "Sat 28 Nov",
    rooms: [
      { venue: "HUA", name: "Ceremony Hall" },
      { venue: "HUA", name: "Room 1" },
      { venue: "HUA", name: "Room 2" },
      { venue: "HUA", name: "Room 3" },
      { venue: "HUA", name: "Room 4" },
      { venue: "HUA", name: "Room 5" },
      { venue: "HUA", name: "Room 6" },
      { venue: "HUA", name: "Room 7" },
    ],
    slots: [
      { kind: "sessions", time: "09:30–11:00", sessions: ["20", "8", "13", "12", "11", "28", "18", "36"] },
      { kind: "break", time: "11:00–11:30", label: "Coffee break" },
      { kind: "sessions", time: "11:30–13:00", sessions: ["37", "8", "13", "12", "11", "28", "18", "36"] },
      { kind: "break", time: "13:00–14:00", label: "Lunch break" },
      { kind: "sessions", time: "14:00–16:00", sessions: ["37", "10", "2", "12", "31", "28", "18", "36b"] },
      { kind: "break", time: "16:00–16:30", label: "Coffee break" },
      { kind: "sessions", time: "16:30–18:00", sessions: ["37", "10", "2", "15", "33", "29", "30", "36"] },
      { kind: "break", time: "18:00–18:30", label: "Coffee break" },
      {
        kind: "sessions",
        time: "18:30–20:00",
        sessions: ["37", "25", "2", "24", "33", "14", "30", { label: "GEOSYSTEM", note: "Sponsor presentation" }],
      },
    ],
  },
]

export const PRESENTATION_ORDER_NOTE =
  "Presentations are currently listed in alphabetical order (by first author) within each session. The final order of presentations has not yet been confirmed and will be announced soon."

const presentations = presentationsData as Record<string, Presentation[]>

export function getPresentations(sessionId: string): Presentation[] {
  return presentations[sessionId] ?? []
}

export interface SessionScheduleEntry {
  day: ProgramDay
  room: ProgramRoom
  times: string[]
}

/** Every (day, room) a session meets in, with its time slots in order. */
export function getSessionSchedule(sessionId: string): SessionScheduleEntry[] {
  const entries: SessionScheduleEntry[] = []
  for (const day of programDays) {
    for (const slot of day.slots) {
      if (slot.kind !== "sessions") continue
      slot.sessions.forEach((id, roomIndex) => {
        if (id !== sessionId) return
        const room = day.rooms[roomIndex]
        const existing = entries.find((e) => e.day === day && e.room === room)
        if (existing) existing.times.push(slot.time)
        else entries.push({ day, room, times: [slot.time] })
      })
    }
  }
  return entries
}

/** Sessions that appear in the programme, in sessions.ts order. */
export const programSessions: Session[] = sessions.filter(
  (s) => getSessionSchedule(String(s.id)).length > 0
)

export function getSession(sessionId: string): Session | undefined {
  return sessions.find((s) => String(s.id) === sessionId)
}

export function roomLabel(room: ProgramRoom): string {
  return `${room.venue} · ${room.name}`
}
