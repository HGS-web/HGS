import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import { getAuthUser } from "@/lib/supabase-server"
import { buildMePayload } from "@/lib/conference2026-me"
import { ProfileView } from "@/components/conference/profile-view"
import type { Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ welcome?: string }>
}

// Reads the auth cookie — must never be statically rendered.
export const dynamic = "force-dynamic"

export const metadata = {
  title: "My Profile — HGS Conference 2026",
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const [{ locale }, { welcome }] = await Promise.all([params, searchParams])
  const validLocale = (locale === "el" ? "el" : "en") as Locale

  const user = await getAuthUser()
  if (!user) {
    redirect(`/${validLocale}/conference2026/login`)
  }

  const me = await buildMePayload(user)

  return (
    <>
      <section className="relative pt-32 pb-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href={`/${validLocale}/conference2026`}
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Conference
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              My Profile
            </h1>
            <p className="mt-2 text-sm text-black/50">
              13th HGS International Conference · 27–28 November 2026 · Athens
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <ProfileView
              initial={me}
              locale={validLocale}
              welcome={welcome === "1"}
            />
          </FadeIn>
        </div>
      </section>
    </>
  )
}
