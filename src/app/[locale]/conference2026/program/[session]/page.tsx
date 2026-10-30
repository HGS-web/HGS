import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Info } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import {
  PROVISIONAL_ORDER_NOTE,
  getPresentations,
  getSession,
  getSessionSchedule,
  getSessionSlots,
  hasConfirmedOrder,
  programSessions,
  venues,
  type Presentation,
} from "@/data/program"
import type { Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string; session: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return ["en", "el"].flatMap((locale) =>
    programSessions.map((s) => ({ locale, session: String(s.id) }))
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { session: id } = await params
  const session = getSession(id)
  return {
    title: session
      ? `Session ${id}: ${session.title} — HGS Conference 2026`
      : "Programme — HGS Conference 2026",
  }
}

/** Authors with superscript affiliation numbers (omitted when everyone shares one). */
function AuthorList({ presentation }: { presentation: Presentation }) {
  const affiliations: string[] = []
  const indexes = presentation.authors.map((a) => {
    if (!a.affiliation) return 0
    let i = affiliations.indexOf(a.affiliation)
    if (i === -1) i = affiliations.push(a.affiliation) - 1
    return i + 1
  })
  const numbered = affiliations.length > 1

  return (
    <div className="mt-2">
      <p className="text-sm text-black/75 leading-relaxed">
        {presentation.authors.map((a, i) => (
          <span key={`${a.name}-${i}`}>
            {a.name}
            {numbered && indexes[i] > 0 && (
              <sup className="ml-px text-[10px] text-black/45">{indexes[i]}</sup>
            )}
            {i < presentation.authors.length - 1 && ", "}
          </span>
        ))}
      </p>
      {affiliations.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs text-black/45 leading-relaxed">
          {affiliations.map((aff, i) => (
            <li key={aff}>
              {numbered && <sup className="mr-0.5 text-[10px]">{i + 1}</sup>}
              {aff}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default async function SessionProgramPage({ params }: PageProps) {
  const { locale, session: id } = await params
  const validLocale = (locale === "el" ? "el" : "en") as Locale
  const session = getSession(id)
  const schedule = getSessionSchedule(id)
  if (!session || schedule.length === 0) notFound()

  const presentations = getPresentations(id)
  const ordered = hasConfirmedOrder(id)
  const slots = getSessionSlots(id)
  const groups = ordered
    ? [
        ...slots.map((s, i) => ({
          key: `slot-${i + 1}`,
          label: `Slot ${i + 1} · ${s.day.shortDate} · ${s.time}`,
          items: presentations.filter((p) => p.slot === i + 1),
        })),
        {
          key: "unscheduled",
          label: "Time slot to be confirmed",
          items: presentations.filter((p) => p.slot === undefined || p.slot > slots.length),
        },
      ].filter((g) => g.items.length > 0)
    : [{ key: "all", label: null, items: presentations }]
  const position = programSessions.findIndex((s) => String(s.id) === id)
  const prev = programSessions[position - 1]
  const next = programSessions[position + 1]
  const base = `/${validLocale}/conference2026/program`

  return (
    <>
      <section className="relative pt-32 pb-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href={base}
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Programme
            </Link>
            <p className="text-xs font-medium uppercase tracking-wider text-black/40">Session {id}</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-black tracking-tight leading-tight">
              {session.title}
            </h1>
            <p className="mt-3 text-sm text-black/60">
              <span className="text-black/40">Organisers: </span>
              {session.organizers}
            </p>

            <ul className="mt-5 space-y-2">
              {schedule.map((entry) => (
                <li
                  key={`${entry.day.id}-${entry.room.venue}-${entry.room.name}`}
                  className="flex items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm"
                >
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-black/40" />
                  <div className="text-sm">
                    <p className="font-medium text-black/80">
                      {entry.day.weekday}, {entry.day.date} · {entry.times.join(", ")}
                    </p>
                    <p className="text-xs text-black/50">
                      {entry.room.name}, {venues[entry.room.venue].name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <details className="group rounded-2xl border border-black/10 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-sm font-medium text-black/70 hover:text-black [&::-webkit-details-marker]:hidden">
              About this session
              <ChevronDown className="h-4 w-4 shrink-0 text-black/40 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-black/[0.06] px-6 py-4 text-sm text-black/65 leading-relaxed whitespace-pre-wrap">
              {session.abstract}
            </div>
          </details>

          {ordered ? (
            <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-black/40" />
              <p className="text-sm text-black/65 leading-relaxed">
                Presentations are listed in the order set by the session organisers.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50 px-5 py-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-sm text-amber-900/90 leading-relaxed">{PROVISIONAL_ORDER_NOTE}</p>
            </div>
          )}

          <h2 className="pt-4 text-lg font-semibold text-black">
            Presentations
            <span className="ml-2 inline-block rounded-full bg-black/5 px-2.5 py-0.5 align-middle text-xs font-medium text-black/40">
              {presentations.length}
            </span>
          </h2>

          {groups.map((group) => (
            <div key={group.key} className="space-y-3">
              {group.label && (
                <h3 className="pt-3 text-xs font-semibold uppercase tracking-wider text-black/45">{group.label}</h3>
              )}
              <ol className="space-y-3">
                {group.items.map((p, i) => (
                  <li
                    key={p.code}
                    id={p.code}
                    className="scroll-mt-28 rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm target:border-black/40 target:ring-2 target:ring-black/10"
                  >
                    <h3 className="text-base font-semibold text-black leading-snug">
                      {ordered && group.key !== "unscheduled" && (
                        <span className="mr-2 text-sm font-medium text-black/35 tabular-nums">{i + 1}.</span>
                      )}
                      {p.title}
                    </h3>
                    <AuthorList presentation={p} />
                    <details className="group mt-3">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-black/50 hover:text-black transition-colors [&::-webkit-details-marker]:hidden">
                        Abstract
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-2 text-sm text-black/65 leading-relaxed whitespace-pre-wrap">{p.abstract}</div>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          <nav className="flex items-stretch justify-between gap-3 pt-6">
            {prev ? (
              <Link
                href={`${base}/${prev.id}`}
                className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black/60 hover:border-black/25 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Session {prev.id}</span>
              </Link>
            ) : (
              <span className="flex-1" />
            )}
            {next ? (
              <Link
                href={`${base}/${next.id}`}
                className="group flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black/60 hover:border-black/25 hover:text-black transition-colors"
              >
                <span className="truncate">Session {next.id}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : (
              <span className="flex-1" />
            )}
          </nav>
        </div>
      </section>
    </>
  )
}
