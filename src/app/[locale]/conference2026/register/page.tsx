import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import {
  EARLY_BIRD_NOTICE,
  LATE_REGISTRATION_END,
  NO_EMAIL_NOTE,
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
              <span className="inline-block rounded-full bg-black/[0.04] border border-black/15 px-2.5 py-0.5 text-xs font-medium text-black/60">
                Closed — {LATE_REGISTRATION_END}
              </span>
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm space-y-4">
              <p className="text-sm text-black/65 leading-relaxed">
                {EARLY_BIRD_NOTICE}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href={`/${validLocale}/conference2026/login`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 transition-colors"
                >
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${validLocale}/conference2026`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-black/15 text-black/70 text-sm font-medium rounded-full hover:bg-black/5 transition-colors"
                >
                  Back to Conference
                </Link>
              </div>
              <p className="border-t border-black/[0.07] pt-4 text-xs text-black/35 leading-relaxed">
                {NO_EMAIL_NOTE}
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
