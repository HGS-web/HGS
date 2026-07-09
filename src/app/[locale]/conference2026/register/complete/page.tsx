import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import { getAuthUser } from "@/lib/supabase-server"
import { buildMePayload } from "@/lib/conference2026-me"
import { CompleteRegistrationFlow } from "@/components/conference/complete-registration-flow"
import { EARLY_BIRD_END } from "@/config/conference2026"
import type { Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
}

// Reads the auth cookie — must never be statically rendered.
export const dynamic = "force-dynamic"

export const metadata = {
  title: "Complete Registration — HGS Conference 2026",
}

/**
 * Step 3 of the verify-first registration flow. The visitor arrives here
 * from the confirmation link with a fresh session: their address is proven,
 * so the page prefills whatever the abstract-submission data already knows
 * about them and asks only for the rest (plus their password, set last).
 */
export default async function CompleteRegistrationPage({ params }: PageProps) {
  const { locale } = await params
  const validLocale = (locale === "el" ? "el" : "en") as Locale

  const user = await getAuthUser()
  if (!user) {
    // No session (e.g. bookmarked link): a new confirmation link is needed.
    redirect(`/${validLocale}/conference2026/register`)
  }

  const me = await buildMePayload(user)
  if (me.registration) {
    redirect(`/${validLocale}/conference2026/profile`)
  }

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
              Complete your registration
            </h1>
            <p className="mt-2 text-sm text-black/50">
              13th HGS International Conference · 27–28 November 2026 · Athens
            </p>
            <p className="mt-3">
              <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Early bird — until {EARLY_BIRD_END}
              </span>
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <CompleteRegistrationFlow me={me} locale={validLocale} />
          </FadeIn>
        </div>
      </section>
    </>
  )
}
