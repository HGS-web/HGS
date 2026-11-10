import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import { RegistrationFlow } from "@/components/conference/registration-flow"
import {
  ATTENDEE_REGISTRATION_TEXT,
  ATTENDEE_REGISTRATION_TITLE,
} from "@/config/conference2026"
import type { Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }]
}

export const metadata = {
  title: "Conference Registration — HGS Conference 2026",
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params
  const validLocale = (locale === "el" ? "el" : "en") as Locale

  return (
    <>
      <section className="relative pt-32 pb-10">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href={`/${validLocale}/conference2026`}
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Conference
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Conference Registration
            </h1>
            <p className="mt-2 text-sm text-black/50">
              13th HGS International Conference · 27–28 November 2026 · Athens
            </p>
            <p className="mt-3">
              <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Open for attendees
              </span>
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mb-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-black">
                {ATTENDEE_REGISTRATION_TITLE}
              </h2>
              <div className="mt-3 space-y-3 text-sm text-black/65 leading-relaxed">
                {ATTENDEE_REGISTRATION_TEXT.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <RegistrationFlow locale={validLocale} />
            <p className="mt-4 text-xs text-black/35 text-center">
              Fees and payment details are listed on the{" "}
              <Link href={`/${validLocale}/conference2026`} className="underline hover:text-black/60 transition-colors">
                conference page
              </Link>.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
