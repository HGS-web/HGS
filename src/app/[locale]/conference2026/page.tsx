import { Mail } from "lucide-react";
import { getMarkdownContent } from "@/lib/markdown";
import { FadeIn, FadeInView } from "@/components/ui/motion";
import type { Locale } from "@/config/site";
import { ThematicSessionForm } from "@/components/conference/thematic-session-form";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }];
}

const conferenceText = {
  en: {
    title: "13th International Conference of the Hellenic Geographical Society",
    theme: "Geography Matters",
    dateLabel: "Date",
    dateValue: "27-28 November 2026",
    locationLabel: "Location",
    locationValue: "Athens, Greece",
    contactLabel: "Contact",
    contactBlurb: "For more information, please contact us",
  },
  el: {
    title: "13th International Conference of the Hellenic Geographical Society",
    theme: "Geography Matters",
    dateLabel: "Date",
    dateValue: "27-28 November 2026",
    locationLabel: "Location",
    locationValue: "Athens, Greece",
    contactLabel: "Contact",
    contactBlurb: "For more information, please contact us",
  },
};

export default async function Conference2026Page({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "el" ? "el" : "en") as Locale;
  const t = conferenceText[validLocale];

  // Try to get markdown content for this page
  const content = await getMarkdownContent(validLocale, "conference2026");

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center">
              <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium bg-black/5 text-black/80 rounded-full">
                2026
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black tracking-tight">
                {t.title}
              </h1>
              <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-semibold text-black/70">
                {t.theme}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-black/60">
                {t.dateValue} &bull; {t.locationValue}
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Info + Content */}
      <section className="py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView delay={0.1}>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black">Thematic Sessions</h3>
                <p className="mt-3 text-sm text-black/60">
                  Submit a thematic session proposal for the 13th International Conference
                  of the Hellenic Geographical Society (2026).
                </p>
                <ThematicSessionForm locale={validLocale} />
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black">Abstracts</h3>
                <p className="mt-3 text-sm text-black/60">
                  The call for abstracts will open in early March 2026. This section is
                  currently locked; please check back soon.
                </p>
                <div className="mt-6 rounded-xl border border-dashed border-black/20 bg-black/5 p-4 text-sm text-black/50">
                  Abstract submissions are not yet available.
                </div>
              </div>
            </div>
          </FadeInView>

          {/* Markdown content if exists */}
          {content && (
            <FadeInView delay={0.1}>
              <div
                className="mt-8 markdown-content"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
            </FadeInView>
          )}

          {/* Contact */}
          <FadeInView delay={0.2}>
            <div className="mt-8 p-8 rounded-2xl border border-black/10 bg-white shadow-sm text-center">
              <h3 className="text-xl font-semibold text-black mb-4">{t.contactLabel}</h3>
              <p className="text-black/60 mb-6">{t.contactBlurb}</p>
              <a
                href="mailto:info@geographiki.gr"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-black/90 transition-all"
              >
                <Mail className="h-4 w-4" />
                info@geographiki.gr
              </a>
            </div>
          </FadeInView>
        </div>
      </section>
    </>
  );
}
