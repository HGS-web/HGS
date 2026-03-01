import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import { sessions } from "@/data/sessions"
import type { Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }]
}

export default async function SessionsPage({ params }: PageProps) {
  const { locale } = await params
  const validLocale = (locale === "el" ? "el" : "en") as Locale

  return (
    <>
      <section className="relative pt-32 pb-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href={`/${validLocale}/conference2026`}
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Conference
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Conference Sessions
            </h1>
            <p className="mt-2 text-sm text-black/50">
              13th HGS International Conference · 27–28 November 2026 · Athens
              <span className="ml-2 inline-block rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-black/40">
                {sessions.length} sessions
              </span>
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-sm font-semibold text-black/35 tabular-nums">
                    {session.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-black leading-snug">
                      {session.title}
                    </h2>

                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">
                          Organizers
                        </p>
                        <p className="text-black/70">{session.organizers}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">
                          General Topic
                        </p>
                        <p className="text-black/70">{session.topic}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">
                          Abstract
                        </p>
                        <div className="text-black/65 leading-relaxed whitespace-pre-wrap">
                          {session.abstract}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
