import Link from "next/link";
import { Calendar, MapPin, Mail } from "lucide-react";
import { getMarkdownContent } from "@/lib/markdown";
import { FadeIn, FadeInView } from "@/components/ui/motion";
import type { Locale } from "@/config/site";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }];
}

const conferenceText = {
  en: {
    subtitle: "13th Panhellenic Geographical Conference",
    date: "Date",
    location: "Location",
    topics: "Topics",
    contact: "Contact",
    tba: "To be announced",
    moreInfo: "For more information, please contact us",
    backToHome: "Back to Home",
    registration: "Registration",
    registrationOpen: "Registration will open soon",
  },
  el: {
    subtitle: "13ο Πανελλήνιο Γεωγραφικό Συνέδριο",
    date: "Ημερομηνία",
    location: "Τοποθεσία",
    topics: "Θεματικές",
    contact: "Επικοινωνία",
    tba: "Θα ανακοινωθεί",
    moreInfo: "Για περισσότερες πληροφορίες, επικοινωνήστε μαζί μας",
    backToHome: "Πίσω στην Αρχική",
    registration: "Εγγραφή",
    registrationOpen: "Οι εγγραφές θα ανοίξουν σύντομα",
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6">
                {t.subtitle}
              </h1>
              <p className="text-lg text-black/60 max-w-2xl mx-auto">
                {validLocale === "en"
                  ? "The Hellenic Geographical Society announces the organization of the 13th Panhellenic Geographical Conference."
                  : "Η Ελληνική Γεωγραφική Εταιρεία ανακοινώνει τη διοργάνωση του 13ου Πανελλήνιου Γεωγραφικού Συνεδρίου."
                }
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeInView delay={0.1}>
              <div className="p-6 rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-black/5">
                    <Calendar className="h-5 w-5 text-black/60" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">{t.date}</h3>
                </div>
                <p className="text-black/50">{t.tba}</p>
              </div>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="p-6 rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-black/5">
                    <MapPin className="h-5 w-5 text-black/60" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">{t.location}</h3>
                </div>
                <p className="text-black/50">{t.tba}</p>
              </div>
            </FadeInView>
          </div>

          {/* Contact */}
          <FadeInView delay={0.3}>
            <div className="mt-12 p-8 rounded-2xl border border-black/10 bg-white shadow-sm text-center">
              <h3 className="text-xl font-semibold text-black mb-4">{t.contact}</h3>
              <p className="text-black/60 mb-6">{t.moreInfo}</p>
              <a
                href="mailto:info@geographiki.gr"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-black/90 transition-all"
              >
                <Mail className="h-4 w-4" />
                info@geographiki.gr
              </a>
            </div>
          </FadeInView>

          {/* Markdown content if exists */}
          {content && (
            <FadeInView delay={0.4}>
              <div
                className="mt-12 markdown-content"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
            </FadeInView>
          )}
        </div>
      </section>
    </>
  );
}
