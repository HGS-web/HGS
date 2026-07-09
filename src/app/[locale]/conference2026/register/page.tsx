import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import { RegistrationFlow } from "@/components/conference/registration-flow"
import { EARLY_BIRD_END } from "@/config/conference2026"
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
              <span className="ml-2 inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Early bird — until {EARLY_BIRD_END}
              </span>
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
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
