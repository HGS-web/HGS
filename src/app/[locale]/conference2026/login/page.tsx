import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import { LoginForm } from "@/components/conference/login-form"
import type { Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }]
}

export const metadata = {
  title: "Sign in — HGS Conference 2026",
}

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params
  const validLocale = (locale === "el" ? "el" : "en") as Locale

  return (
    <>
      <section className="relative pt-32 pb-10">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href={`/${validLocale}/conference2026`}
              className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Conference
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-black/50">
              Access your conference profile, abstracts and payment status.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Suspense fallback={null}>
              <LoginForm locale={validLocale} />
            </Suspense>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
