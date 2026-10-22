import Link from "next/link"
import { ArrowLeft, ArrowRight, Info, MapPin } from "lucide-react"
import { FadeIn, FadeInView } from "@/components/ui/motion"
import {
  PresentationFinder,
  type FinderEntry,
  type FinderSession,
} from "@/components/conference/presentation-finder"
import {
  PRESENTATION_ORDER_NOTE,
  getPresentations,
  getSession,
  getSessionSchedule,
  programDays,
  programSessions,
  roomLabel,
  venues,
  type ProgramDay,
  type Venue,
} from "@/data/program"
import type { Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }]
}

export const metadata = {
  title: "Programme — HGS Conference 2026",
}

function sessionWhen(sessionId: string) {
  return getSessionSchedule(sessionId)
    .map((e) => `${e.day.shortDate} · ${e.times.join(", ")} · ${roomLabel(e.room)}`)
    .join(" / ")
}

function venueGroups(day: ProgramDay) {
  const groups: { venue: Venue; span: number }[] = []
  for (const room of day.rooms) {
    const last = groups[groups.length - 1]
    if (last && last.venue === room.venue) last.span++
    else groups.push({ venue: room.venue, span: 1 })
  }
  return groups
}

function DaySchedule({ day, locale }: { day: ProgramDay; locale: Locale }) {
  const groups = venueGroups(day)
  const dayVenues = groups.map((g) => g.venue)
  const sessionHref = (id: string) => `/${locale}/conference2026/program/${id}`

  return (
    <div id={day.id} className="scroll-mt-28 rounded-2xl border border-black/10 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
        <h2 className="text-xl font-semibold text-black">
          {day.weekday}, {day.date}
        </h2>
        <p className="text-xs text-black/45">
          {dayVenues.map((v) => venues[v].name).join(" & ")}
        </p>
      </div>

      {/* Desktop: rooms × time slots */}
      <div className="hidden md:block overflow-x-auto -mx-2 px-2">
        <table
          className="w-full border-separate border-spacing-1 text-left"
          style={{ minWidth: day.rooms.length * 112 + 96 }}
        >
          <thead>
            <tr>
              <th rowSpan={2} className="sticky left-0 z-10 w-24 bg-white" />
              {groups.map((g, i) => (
                <th
                  key={`${g.venue}-${i}`}
                  colSpan={g.span}
                  className="rounded-md bg-black/[0.04] px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-black/50"
                >
                  {g.venue}
                </th>
              ))}
            </tr>
            <tr>
              {day.rooms.map((room, i) => (
                <th
                  key={`${room.venue}-${room.name}-${i}`}
                  className="px-2 pt-1 pb-2 text-center text-xs font-medium text-black/60 whitespace-nowrap"
                >
                  {room.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {day.slots.map((slot) => {
              if (slot.kind === "break") {
                return (
                  <tr key={slot.time}>
                    <th scope="row" className="sticky left-0 z-10 bg-white pr-2 text-xs font-normal text-black/35 whitespace-nowrap">
                      {slot.time}
                    </th>
                    <td colSpan={day.rooms.length} className="rounded-md bg-black/[0.02] px-3 py-1.5 text-center text-xs text-black/40">
                      {slot.label}
                    </td>
                  </tr>
                )
              }
              if (slot.kind === "plenary") {
                return (
                  <tr key={slot.time}>
                    <th scope="row" className="sticky left-0 z-10 bg-white pr-2 text-xs font-medium text-black/60 whitespace-nowrap">
                      {slot.time}
                    </th>
                    <td colSpan={day.rooms.length} className="rounded-lg bg-black px-3 py-3 text-center text-sm font-semibold text-white">
                      {slot.label}
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={slot.time}>
                  <th scope="row" className="sticky left-0 z-10 bg-white pr-2 pt-2 align-top text-xs font-medium text-black/60 whitespace-nowrap">
                    {slot.time}
                  </th>
                  {slot.sessions.map((id, i) => {
                    const session = id ? getSession(id) : undefined
                    return (
                      <td key={`${slot.time}-${i}`} className="align-top">
                        {id && session ? (
                          <Link
                            href={sessionHref(id)}
                            title={`Session ${id}: ${session.title}`}
                            className="block min-h-[5.5rem] rounded-lg border border-black/10 bg-black/[0.02] p-2 hover:border-black/25 hover:bg-black/[0.05] transition-colors"
                          >
                            <span className="block text-xs font-semibold text-black tabular-nums">{id}</span>
                            <span className="mt-0.5 text-[11px] leading-snug text-black/60 line-clamp-3">
                              {session.title}
                            </span>
                          </Link>
                        ) : (
                          <div className="min-h-[5.5rem] rounded-lg border border-dashed border-black/[0.06]" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: one block per time slot */}
      <ol className="md:hidden space-y-4">
        {day.slots.map((slot) => (
          <li key={slot.time}>
            {slot.kind === "sessions" ? (
              <>
                <p className="mb-2 text-xs font-semibold text-black/60">{slot.time}</p>
                <ul className="space-y-1.5">
                  {slot.sessions.map((id, i) => {
                    const session = id ? getSession(id) : undefined
                    if (!id || !session) return null
                    return (
                      <li key={`${slot.time}-${i}`}>
                        <Link
                          href={sessionHref(id)}
                          className="flex items-start gap-3 rounded-xl border border-black/[0.08] bg-black/[0.02] px-3 py-2.5 hover:bg-black/[0.05] transition-colors"
                        >
                          <span className="mt-0.5 w-8 shrink-0 text-xs font-semibold text-black tabular-nums">{id}</span>
                          <span className="min-w-0">
                            <span className="block text-sm leading-snug text-black/75">{session.title}</span>
                            <span className="mt-0.5 block text-[11px] text-black/40">{roomLabel(day.rooms[i])}</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <div
                className={
                  slot.kind === "plenary"
                    ? "rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
                    : "rounded-lg bg-black/[0.03] px-3 py-1.5 text-xs text-black/45"
                }
              >
                <span className="tabular-nums">{slot.time}</span> · {slot.label}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export default async function ProgramPage({ params }: PageProps) {
  const { locale } = await params
  const validLocale = (locale === "el" ? "el" : "en") as Locale

  const finderSessions: FinderSession[] = []
  const finderEntries: FinderEntry[] = []
  for (const session of programSessions) {
    const id = String(session.id)
    finderSessions.push({
      id,
      title: session.title,
      organizers: session.organizers,
      topic: session.topic,
      when: sessionWhen(id),
    })
    for (const p of getPresentations(id)) {
      finderEntries.push({
        sessionId: id,
        code: p.code,
        title: p.title,
        authors: p.authors.map((a) => a.name).join(", "),
      })
    }
  }

  return (
    <>
      <section className="relative pt-32 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href={`/${validLocale}/conference2026`}
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Conference
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Conference Programme
            </h1>
            <p className="mt-2 text-sm text-black/50">
              13th HGS International Conference · 27–28 November 2026 · Athens
              <span className="ml-2 inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-black/40">
                {programSessions.length} sessions · {finderEntries.length} presentations
              </span>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {programDays.map((day) => (
                <a
                  key={day.id}
                  href={`#${day.id}`}
                  className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm text-black/70 hover:border-black/25 hover:text-black transition-colors"
                >
                  {day.weekday} {day.shortDate.split(" ").slice(1).join(" ")}
                </a>
              ))}
              <a
                href="#all-sessions"
                className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm text-black/70 hover:border-black/25 hover:text-black transition-colors"
              >
                All sessions
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <FadeInView delay={0.05}>
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50 px-5 py-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-sm text-amber-900/90 leading-relaxed">{PRESENTATION_ORDER_NOTE}</p>
            </div>
          </FadeInView>

          <FadeInView delay={0.08}>
            <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-base font-semibold text-black mb-3">Search the programme</h2>
              <PresentationFinder locale={validLocale} sessions={finderSessions} entries={finderEntries} />
            </div>
          </FadeInView>

          {programDays.map((day) => (
            <FadeInView key={day.id} delay={0.1}>
              <DaySchedule day={day} locale={validLocale} />
            </FadeInView>
          ))}

          <FadeInView delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(venues) as Venue[]).map((v) => (
                <div key={v} className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-black/40" />
                  <div>
                    <p className="text-sm font-medium text-black/80">{venues[v].name}</p>
                    <p className="text-xs text-black/50">{venues[v].address}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeInView>

          <FadeInView delay={0.1}>
            <div id="all-sessions" className="scroll-mt-28 rounded-2xl border border-black/10 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-black mb-4">All sessions</h2>
              <ul className="divide-y divide-black/[0.06]">
                {programSessions.map((session) => {
                  const id = String(session.id)
                  const count = getPresentations(id).length
                  return (
                    <li key={id}>
                      <Link
                        href={`/${validLocale}/conference2026/program/${id}`}
                        className="group flex items-start gap-4 py-4 -mx-2 px-2 rounded-lg hover:bg-black/[0.02] transition-colors"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-semibold text-black/50 tabular-nums">
                          {id}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-black leading-snug group-hover:underline underline-offset-4 decoration-black/20">
                            {session.title}
                          </span>
                          <span className="mt-1 block text-xs text-black/50">{session.organizers}</span>
                          <span className="mt-1.5 block text-xs text-black/40 leading-relaxed">{sessionWhen(id)}</span>
                        </span>
                        <span className="hidden sm:flex shrink-0 items-center gap-1 text-xs text-black/40 group-hover:text-black transition-colors">
                          {count} {count === 1 ? "presentation" : "presentations"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </FadeInView>
        </div>
      </section>
    </>
  )
}
