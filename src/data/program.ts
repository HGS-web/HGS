// Conference 2026 programme (from Program.xlsx, sheet "Program").
// Session ids match src/data/sessions.ts; presentations per session live in
// presentations.json (registered abstracts). Sessions whose organisers sent
// the final order list presentations in that order with a `slot`; the rest
// stay alphabetical by first author until their order arrives.
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
  /** Title of the talk, if the event is one. */
  title?: string
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
  /** 1-based index into the session's time slots, once the order is confirmed. */
  slot?: number
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
      // HUA rooms use the university's own numbering (Changes_EGE4, 10 Nov 2026).
      { venue: "HUA", name: "Ceremony Hall" },
      { venue: "HUA", name: "Room 1.1" },
      { venue: "HUA", name: "Room 1.1 (Lab)" },
      { venue: "HUA", name: "Room 1.2" },
      { venue: "HUA", name: "Room 2.1" },
      { venue: "HUA", name: "Room 2.1 (Lab)" },
      { venue: "HUA", name: "Room 3.1" },
    ],
    slots: [
      { kind: "sessions", time: "09:30–11:00", sessions: ["39", "3", "4", "7", "27", "5", "32", "35", "9", "23"] },
      { kind: "break", time: "11:00–11:30", label: "Coffee break" },
      { kind: "sessions", time: "11:30–13:00", sessions: ["38", "19", "4", "7", "27", "5", "32", "35", "9", "23"] },
      { kind: "break", time: "13:00–14:00", label: "Lunch break at HUA" },
      { kind: "plenary", time: "14:00–16:00", label: "Plenary session" },
      { kind: "break", time: "16:00–16:30", label: "Coffee break" },
      { kind: "sessions", time: "16:30–18:00", sessions: ["6", "16", "22", "7", "17", "1", "32", "35", "21", "23"] },
      { kind: "break", time: "18:00–18:30", label: "Break" },
      { kind: "sessions", time: "18:30–20:00", sessions: ["6", "16", "22", "7", "17", "1", "32", "36a", "21", "34"] },
    ],
  },
  {
    id: "day2",
    weekday: "Saturday",
    date: "28 November 2026",
    shortDate: "Sat 28 Nov",
    rooms: [
      { venue: "HUA", name: "Ceremony Hall" },
      { venue: "HUA", name: "Room 1.1" },
      { venue: "HUA", name: "Room 1.1 (Lab)" },
      { venue: "HUA", name: "Room 1.2" },
      { venue: "HUA", name: "Room 2.1" },
      { venue: "HUA", name: "Room 2.1 (Lab)" },
      { venue: "HUA", name: "Room 2.3" },
      { venue: "HUA", name: "Room 3.1" },
    ],
    slots: [
      { kind: "sessions", time: "09:30–11:00", sessions: ["20", "29", "8", "18", "13", "12", "11", "28"] },
      { kind: "break", time: "11:00–11:30", label: "Coffee break" },
      { kind: "sessions", time: "11:30–13:00", sessions: ["37", "36", "8", "18", "13", "12", "11", "28"] },
      { kind: "break", time: "13:00–14:00", label: "Lunch break" },
      { kind: "sessions", time: "14:00–15:30", sessions: ["37", "36", "31", "18", "2", "12", "10", "28"] },
      { kind: "break", time: "15:30–16:00", label: "Coffee break" },
      { kind: "sessions", time: "16:00–17:30", sessions: ["37", "36b", "33", "30", "2", "15", "10", "14"] },
      { kind: "break", time: "17:30–18:00", label: "Coffee break" },
      {
        kind: "sessions",
        time: "18:00–19:30",
        sessions: [
          "37",
          {
            label: "Geosystems Hellas",
            title:
              "Octave Geospatial Solutions: Innovative Technologies and Applications (Presented by Geosystems Hellas, Official Distributor in Greece)",
            note: "Sponsor presentation",
          },
          "33",
          "30",
          "2",
          "24",
          "25",
          "14",
        ],
      },
    ],
  },
]

export const plenaryWelcome = [
  {
    heading: "Representatives of the Host Institutions",
    items: ["Harokopio University of Athens (HUA)", "National Centre for Social Research (EKKE)"],
  },
  { heading: "Representatives of the Hellenic Geographical Society (HGS)", items: [] },
]

export interface KeynoteSpeaker {
  name: string
  role: string
  title: string
  /** Square portrait under public/. */
  photo?: string
  abstract?: string
  bio?: string[]
}

// Abstracts and bios as sent by the speakers (S. Spyrellis, 11 Nov 2026).
export const keynoteSpeakers: KeynoteSpeaker[] = [
  {
    name: "Robert Musil",
    role: "PD MMag. Dr., Director, Institute for Urban and Regional Research, Austrian Academy of Sciences (ÖAW)",
    title: "A Second Quantitative Revolution? The Potentials and Risks of AI in Human Geography",
    photo: "/keynotes/musil.jpg",
    abstract:
      "During the 1950s, the growing availability of digital computing power triggered a sweeping transformation that reshaped scientific practice in the humanities and, consequently, in human geography. Given the profound impact of artificial intelligence (AI) on society, the media, the labor market, businesses, and science, this presentation examines the methodological and conceptual implications of AI-based applications for the field of human geography. On the one hand, new data sources and analytical tools allow us to revisit traditional questions in human geography – spatial inequalities, urban decline, and urban upgrading – from a fresh perspective. First, new microscale data will disaggregate research, enabling much finer-grained analysis of socio-spatial inequalities. Second, urban research will focus more on visual aspects, such as building condition, decline, and vacancy in ground-floor zones. These new methodological approaches and the data they generate will also have conceptual implications for existing concepts in human geography. On the other hand, implementing AI-based approaches requires new research practices and new collaborations. While the quantitative revolution of the 1960s took place amid increasing critique of the traditional Länderkundlichen paradigm, today an indifferent, passive attitude toward new technologies seems to dominate. From the perspective of our discipline, the risk of AI is that the main questions of human geography will be further developed by other disciplines. Historical experience shows that it is not the technology itself, but how we apply it, that will determine whether our discipline undergoes another revolution.",
    bio: [
      "Robert Musil studied geography and history at the University of Vienna and finished his PhD at the University Innsbruck in 2005. His cumulative habilitation work in the field of human geography was approved in 2015 at the University of Vienna. Since 2001, Robert Musil has been a researcher at the Institute for Urban and Regional Research (ISR); between 2007 and 2009 he was post-doc assistant at the University of Salzburg, and between 2014 and 2016 he was visiting professor for economic geography at the University of Vienna.",
      "Robert Musil leads the research group ‘Housing and Urban Economy’ and since January 1, 2026, he has been appointed director of the ISR. His research interests lie at the juncture of economic and urban geography. His current research includes commodification strategies and ownership structures on urban and regional housing markets, urban inequalities in the context of ground floor zones and the impact of housing market segmentation on patterns of microsegregation.",
    ],
  },
  {
    name: "Costis Hadjimichalis",
    role: "Professor Emeritus, Department of Geography, Harokopio University of Athens (HUA)",
    title: "Reclaiming Critical Geographical Thinking",
    photo: "/keynotes/hadjimichalis.jpg",
    abstract:
      "The lack of critical thinking in geography, is an international problem whose emergence I have been observing over the past several decades, long before the widespread use of AI. I am referring primarily to the choice of research topics, the methods used to approach them, and the absence of critical questions across all branches of physical and human geography, cartographic representations and statistical calculations, as reflected in academic publications, dissertations, conferences and applied policies. Using examples from published research and applications of wide-used concepts, such us sustainable development, I will try to draw an alternative agenda beyond the hegemonic neoliberal discourse, dominant in academia and everyday life.",
    bio: [
      "Costis Hadjimichalis is Professor Emeritus at the Department of Geography, Harokopio University Athens. He previously held a position at the Department of Urban and Regional Planning, Aristotle University of Thessaloniki, and has been visiting professor at Roskilde University (Denmark), UCLA and Berkeley (USA), Panteion University, Athens (Greece), Oslo National University (Norway), NIRSA (Ireland), Macquarie University (Australia) and Universitá deggli Studi di Padova (Italy). His current research and publications concern uneven geographical development, local and regional development, radical geography, democracy and spatial justice and landscape analysis. He has been section editor of Regional Development for the International Encyclopaedia of Human Geographer, Elsevier and founding editor of the Greek journal Geographies. Among his recent books are Space in Left Thought (co-author Dina Vaiou, in Greek 2012), Debt Crisis and Land Dispossession (2014 in Greek, 2016 in German), Crises Spaces. Structures, struggles and solidarity in Southern Europe, London: Routledge (2017, paperback 2019, modified Greek edition 2018), Sketching urbanities in the Mediterranean (in Greek, 2021, in Spanish 2025), and forthcoming: Why Sustainable, Resilient, and Smart Development Is Unattainable: A Radical Geographical Response (2027).",
    ],
  },
  {
    name: "Maria Papadopoulou",
    role: "Professor, School of Rural, Surveying and Geoinformatics Engineering, National Technical University of Athens (NTUA)",
    title: "From Geographical to Management Challenges",
  },
]

export const PRESENTATION_ORDER_NOTE =
  "Where the session organisers have confirmed it, presentations are listed in their final order by time slot. The remaining sessions are listed in alphabetical order (by first author) until their final order is announced."

/** Shown on a session page whose order is not yet confirmed. */
export const PROVISIONAL_ORDER_NOTE =
  "Presentations are currently listed in alphabetical order (by first author). The final order of presentations has not yet been confirmed and will be announced soon."

const presentations = presentationsData as Record<string, Presentation[]>

export function getPresentations(sessionId: string): Presentation[] {
  return presentations[sessionId] ?? []
}

/** True once the organisers' order (with time slots) is in presentations.json. */
export function hasConfirmedOrder(sessionId: string): boolean {
  return getPresentations(sessionId).some((p) => p.slot !== undefined)
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

/** A session's time slots in programme order, labelled with their day. */
export function getSessionSlots(sessionId: string): { day: ProgramDay; room: ProgramRoom; time: string }[] {
  return getSessionSchedule(sessionId).flatMap((e) => e.times.map((time) => ({ day: e.day, room: e.room, time })))
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
