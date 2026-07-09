import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FadeIn } from "@/components/ui/motion"
import { ResetPasswordForm } from "@/components/conference/reset-password-form"
import type { Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }]
}

export const metadata = {
  title: "Set a new password — HGS Conference 2026",
}

export default async function ResetPasswordPage({ params }: PageProps) {
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
              Set a new password
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <ResetPasswordForm locale={validLocale} />
          </FadeIn>
        </div>
      </section>
    </>
  )
}
