import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Users, Globe, Calendar } from "lucide-react";
import { FadeIn, FadeInView } from "@/components/ui/motion";
import { siteConfig, type Locale } from "@/config/site";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const homeText = {
  en: {
    tagline: "A non-governmental, non-profit scientific, educational and professional society",
    mission: "To promote Geography through initiating and coordinating geographical research and teaching in Greece",
    learnMore: "Learn More",
    becomeMember: "Become a Member",
    discover: "Our Society",
    history: "History",
    historyDesc: "The Society's journey from its founding to the present day.",
    conferences: "Conferences",
    conferencesDesc: "Scientific gatherings of geographers in Greece.",
    networks: "International Networks",
    networksDesc: "Collaborations with geographical organizations worldwide.",
    membership: "Members",
    membershipDesc: "Become a member of the Hellenic Geographical Society.",
    readMore: "Read more",
    viewAll: "View all",
    explore: "Explore",
    register: "Register",
    conference2026: "13th International Conference of the Hellenic Geographical Society",
    conference2026Desc: "...",
    learnMoreConf: "Learn More",
  },
  el: {
    tagline: "Μη κυβερνητική, μη κερδοσκοπική επιστημονική, εκπαιδευτική και επαγγελματική εταιρεία",
    mission: "Για τη προώθηση της Γεωγραφίας μέσω της οργάνωσης και του συντονισμού γεωγραφικής έρευνας και διδασκαλίας στην Ελλάδα",
    learnMore: "Μάθετε Περισσότερα",
    becomeMember: "Γίνετε Μέλος",
    discover: "Η Εταιρεία μας",
    history: "Ιστορία",
    historyDesc: "Η πορεία της Εταιρείας από την ίδρυσή της έως σήμερα.",
    conferences: "Συνέδρια",
    conferencesDesc: "Επιστημονικές συναντήσεις γεωγράφων στην Ελλάδα.",
    networks: "Διεθνή Δίκτυα",
    networksDesc: "Συνεργασίες με γεωγραφικούς οργανισμούς παγκοσμίως.",
    membership: "Μέλη",
    membershipDesc: "Γίνετε μέλος της Ελληνικής Γεωγραφικής Εταιρείας.",
    readMore: "Διαβάστε περισσότερα",
    viewAll: "Δείτε όλα",
    explore: "Εξερευνήστε",
    register: "Εγγραφή",
    conference2026: "13ο Διεθνές Συνέδριο της Ελληνικής Γεωγραφικής Εταιρείας",
    conference2026Desc: "...",
    learnMoreConf: "Περισσότερα",
  },
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const validLocale = (locale === "el" ? "el" : "en") as Locale;
  const t = homeText[validLocale];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
          <div className="flex flex-col items-center text-center">
            <FadeIn delay={0.1}>
              <div className="mb-8">
                <Image
                  src="/Logo_EGE.png"
                  alt={siteConfig.shortName[validLocale]}
                  width={120}
                  height={120}
                  className="mx-auto"
                  priority
                />
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-black max-w-4xl">
                {siteConfig.name[validLocale]}
              </h1>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="mt-6 text-lg sm:text-xl text-black/60 max-w-2xl">
                {t.tagline}
              </p>
            </FadeIn>

            <FadeIn delay={0.35}>
              <p className="mt-4 text-base text-black/50 max-w-xl italic">
                {t.mission}
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${validLocale}/society/history`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-black/90 transition-all hover:scale-105"
                >
                  {t.learnMore}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${validLocale}/society/registration`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-black/20 text-black font-medium rounded-full hover:bg-black/5 transition-all"
                >
                  {t.becomeMember}
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-black/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-black/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInView>
            <h2 className="text-2xl font-semibold text-black mb-12">{t.discover}</h2>
          </FadeInView>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FadeInView delay={0.1}>
              <FeatureCard
                href={`/${validLocale}/society/history`}
                icon={<MapPin className="h-5 w-5" />}
                title={t.history}
                description={t.historyDesc}
                action={t.readMore}
              />
            </FadeInView>

            <FadeInView delay={0.2}>
              <FeatureCard
                href={`/${validLocale}/conferences/hgs`}
                icon={<Calendar className="h-5 w-5" />}
                title={t.conferences}
                description={t.conferencesDesc}
                action={t.viewAll}
              />
            </FadeInView>

            <FadeInView delay={0.3}>
              <FeatureCard
                href={`/${validLocale}/collaborations/societies`}
                icon={<Globe className="h-5 w-5" />}
                title={t.networks}
                description={t.networksDesc}
                action={t.explore}
              />
            </FadeInView>

            <FadeInView delay={0.4}>
              <FeatureCard
                href={`/${validLocale}/society/registration`}
                icon={<Users className="h-5 w-5" />}
                title={t.membership}
                description={t.membershipDesc}
                action={t.register}
              />
            </FadeInView>
          </div>
        </div>
      </section>

      {/* CTA Banner - Conference 2026 */}
      <section className="relative py-24 overflow-hidden">

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInView>
            <div className="relative rounded-2xl border border-black/10 bg-white backdrop-blur-sm p-8 md:p-12 overflow-hidden shadow-sm">
              {/* 2026 tag above title */}
              <div className="mb-4">
                <span className="px-3 py-1 text-xs font-medium bg-black/10 text-black/80 rounded-full">
                  2026
                </span>
              </div>

              <div className="max-w-2xl">
                <h3 className="text-2xl md:text-3xl font-bold text-black mb-4">
                  {t.conference2026}
                </h3>
                <p className="text-black/60 mb-8">
                  {t.conference2026Desc}
                </p>
                <Link
                  href={`/${validLocale}/conference2026`}
                  className="inline-flex items-center gap-2 text-black font-medium hover:gap-3 transition-all"
                >
                  {t.learnMoreConf}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  href,
  icon,
  title,
  description,
  action,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col p-6 rounded-2xl border border-black/10 bg-gray-50 hover:bg-gray-100 hover:border-black/20 transition-all duration-300"
    >
      <div className="mb-4 p-2 w-fit rounded-lg bg-black/5 text-black/60 group-hover:text-black group-hover:bg-black/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-sm text-black/50 mb-4 flex-1">{description}</p>
      <span className="inline-flex items-center gap-1 text-sm text-black/70 group-hover:text-black group-hover:gap-2 transition-all">
        {action}
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
