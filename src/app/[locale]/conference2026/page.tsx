import { Mail } from "lucide-react";
import { getMarkdownContent } from "@/lib/markdown";
import { FadeIn, FadeInView } from "@/components/ui/motion";
import type { Locale } from "@/config/site";
import { ThematicSessionForm } from "@/components/conference/thematic-session-form";
import { SessionList } from "@/components/conference/session-list";
// import { RegistrationDialog } from "@/components/conference/registration-dialog"; // Step 1 – enabled from 1 Jul 2026
import { AbstractDialog } from "@/components/conference/abstract-dialog";
// import { PaymentDialog } from "@/components/conference/payment-dialog"; // Step 3 – enabled from 1 Jul 2026
import { AddToCalendar } from "@/components/conference/add-to-calendar";
import { FileText } from "lucide-react";
// import { ClipboardList, Receipt } from "lucide-react"; // Step 1 & Step 3 icons – enabled from 1 Jul 2026

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
    committeeLabel: "Organizing Committee",
    scientificLabel: "Scientific Committee",
    contactLabel: "Contact",
    contactBlurb: "For any question relating the call for sessions, please contact at:",
  },
  el: {
    title: "13th International Conference of the Hellenic Geographical Society",
    theme: "Geography Matters",
    dateLabel: "Date",
    dateValue: "27-28 November 2026",
    locationLabel: "Location",
    locationValue: "Athens, Greece",
    committeeLabel: "Organizing Committee",
    scientificLabel: "Scientific Committee",
    contactLabel: "Contact",
    contactBlurb: "For any question relating the call for sessions, please contact at:",
  },
};

const organizingCommittee = [
  {
    designation: "Chair",
    name: "Em. Prof. T. Maloutas",
    affiliation: "Harokopio University of Athens",
    url: "https://www.geo.hua.gr/en/staff-member/maloutas-thomas/",
  },
  {
    designation: "Vice-Chair",
    name: "Prof. A. Papadopoulos",
    affiliation: "Harokopio University of Athens",
    url: "https://www.geo.hua.gr/en/staff-member/papadopoulos-g-apostolos/",
  },
  {
    designation: "Vice-Chair",
    name: "Dr. G. Saitis",
    affiliation: "National & Kapodistrian University of Athens",
    url: "https://gis.geol.uoa.gr/staff/teaching_staff/giannis_saitis",
  },
  {
    designation: "Vice-Chair",
    name: "Dr. S. Spyrellis",
    affiliation: "National Centre for Social Research",
    url: "https://www.ekke.gr/en/centre/personnel/spirellis-stauros-nikiforos",
  },
  {
    designation: "Conference Secretary",
    name: "Dr. E. Karkani",
    affiliation: "National & Kapodistrian University of Athens",
    url: "https://gis.geol.uoa.gr/staff/teaching_staff/anna_karkani",
  },
  {
    designation: "Treasurer",
    name: "Dr. I. Polyzou",
    affiliation: "National Technical University of Athens",
    url: "https://www.arch.ntua.gr/index.php/person/polyzoy-iris/",
  },
  {
    designation: "Special Issue Editor",
    name: "Prof. C. Koutsopoulos",
    affiliation: "National Technical University of Athens",
    url: "https://eurogeojournal.eu/index.php/egj/about/editorialTeam",
  },
  {
    designation: "Field Trip Coordinator",
    name: "Prof. N. Evelpidou",
    affiliation: "National & Kapodistrian University of Athens",
    url: "http://scholar.uoa.gr/evelpidou/home",
  },
  {
    designation: "Webmaster",
    name: "A. Liaskos",
    affiliation: "National & Kapodistrian University of Athens",
    url: "https://www.liaskos.eu/",
  },
  {
    designation: "Committee Member",
    name: "A. Christaki",
    affiliation: "National Technical University of Athens",
  },
  {
    designation: "Committee Member",
    name: "Dr. E. Durie",
    affiliation: "Harokopio University of Athens",
    url: "https://www.geo.hua.gr/en/staff-member/durie-eveline/",
  },
  {
    designation: "Committee Member",
    name: "Dr. G. Kandylis",
    affiliation: "National Centre for Social Research",
    url: "https://www.ekke.gr/en/centre/personnel/kandilis-georgios",
  },
  {
    designation: "Committee Member",
    name: "Dr. N. Myofa",
    affiliation: "Harokopio University of Athens",
  },
  {
    designation: "Committee Member",
    name: "Y. Paraskevopoulos",
    affiliation: "National Technical University of Athens",
  },
  {
    designation: "Committee Member",
    name: "Dr. M. Pigaki (President of HGS)",
    affiliation: "National Technical University of Athens",
    url: "https://www.survey.ntua.gr/en/laboratory-staff/pigaki-maria",
  },
  {
    designation: "Committee Member",
    name: "Polychronis Kolokoussis",
    affiliation: "National Technical University of Athens",
    url: "http://users.ntua.gr/polkol/index-en.html",
  },
];

const scientificCommittee = [
  {
    name: "Dimitrios Alexakis",
    url: "https://www.ims.forth.gr/en/profile/view?id=97",
  },
  {
    name: "Athina Arampatzi",
  },
  {
    name: "Vassilis Arapoglou",
    url: "https://socialpolicy.panteion.gr/en/people/varapoglou",
  },
  {
    name: "Panagiotis Artelaris",
    url: "https://geo.hua.gr/en/personnel/artelaris-panagiotis-2/",
  },
  {
    name: "Athena Athanasiou",
    url: "https://anthropology.panteion.gr/index.php/el/dep/198-athanasiou-athena",
  },
  {
    name: "Evangelia Athanassiou",
    url: "https://architecture.web.auth.gr/en/athanasiou-euangelia/",
  },
  {
    name: "Efthimios Bakogiannis",
    url: "https://www.survey.ntua.gr/en/dep/bakogiannis-euthimios",
  },
  {
    name: "Pavlos Baltas",
    url: "https://www.ekke.gr/en/centre/personnel/mpaltas-paulos",
  },
  {
    name: "Giorgos Bithymitris",
    url: "https://www.ekke.gr/en/centre/personnel/mpithimitris-georgios",
  },
  {
    name: "Costis Chadjimichalis",
    url: "https://geo.hua.gr/en/personnel/chadjimichalis-costis/",
  },
  {
    name: "Christos Chalkias",
    url: "https://geo.hua.gr/en/personnel/christos-chalkias/",
  },
  {
    name: "Ioannis Chorianopoulos",
    url: "https://geography.aegean.gr/ppl/index_en.php?content=0&bio=ichorian",
  },
  {
    name: "Charis Christodoulou",
    url: "https://architecture.web.auth.gr/en/christodoulou-charis/",
  },
  {
    name: "Michalis Diakakis",
    url: "http://scholar.uoa.gr/diakakism/home"
  },
  {
    name: "Evangelia Drakou",
    url: "https://geo.hua.gr/en/personnel/evangelia-drakou-2/",
  },
  {
    name: "Antigoni Faka",
    url: "https://geo.hua.gr/en/personnel/antigoni-faka-2/",
  },
  {
    name: "Charalambos Fasoulas",
    url: "https://www.nhmc.uoc.gr/archives/nhmc-person/charalampos-fassoulas#:~:text=%CE%A3%CF%8D%CE%BD%CF%84%CE%BF%CE%BC%CE%BF%20%CE%92%CE%B9%CE%BF%CE%B3%CF%81%CE%B1%CF%86%CE%B9%CE%BA%CF%8C,%CE%A6.",
  },
  {
    name: "Lia Galani",
    url: "http://www.primedu.uoa.gr/galanh-apostolia-lia.html",
  },
  {
    name: "Vassilis Gavalas",
    url: "https://geography.aegean.gr/ppl/index.php?content=0&bio=bgav",
  },
  {
    name: "Stelios Gialis",
    url: "https://geography.aegean.gr/ppl/index_en.php?content=0&bio=stgialis",
  },
  {
    name: "Katerina Gkoltsiou",
    url: "http://efp.aua.gr/el/userpage/2395",
  },
  {
    name: "Kostas Gourzis",
    url: "https://lgrl.aegean.gr/el/personnel/gourzis-kostas/",
  },
  {
    name: "Theodoros Iosifidis",
    url: "https://geography.aegean.gr/ppl/index_en.php?content=0&bio=thiwsi",
  },
  {
    name: "Konstantina Kalfa",
    url: "https://www.asfa.gr/didaktiko-prosopiko/konstantina-kalfa/",
  },
  {
    name: "Giorgos Kandylis",
    url: "https://www.ekke.gr/en/centre/personnel/kandilis-georgios",
  },
  {
    name: "Dimitris Kavroudakis",
    url: "https://geography.aegean.gr/ppl/index.php?content=0&bio=dimitrisk",
  },
  {
    name: "Athanasios Kizos",
    url: "https://geography.aegean.gr/ppl/index.php?content=0&bio=akizos",
  },
  {
    name: "Ifigeneia Kokkali",
    url: "https://www.prd.uth.gr/en/staff/kokkali_i/",
  },
  {
    name: "Efi Kostopoulou",
    url: "https://geography.aegean.gr/ppl/index.php?content=0&bio=ekost",
  },
  {
    name: "Hara Kouki",
    url: "https://sociology.soc.uoc.gr/en/human-resources/teaching-research-staff-dep/kouki-hara-en/",
  },
  {
    name: "Aspassia Kouzoupi",
    url: "https://www.arch.uth.gr/el/staff/A_Kouzoupi",
  },
  {
    name: "Nikos Kourachanis",
    url: "https://socialpolicy.panteion.gr/en/people/nkourachanis",
  },
  {
    name: "Penny Koutrolikou",
    url: "https://www.arch.ntua.gr/index.php/person/koutrolikou-panagiota-penny/?lang=en",
  },
  {
    name: "Nikos Labrinos",
    url: "https://eled.auth.gr/about/personnel/lambrinos/",
  },
  {
    name: "Apostolos Lagarias",
    url: "http://www.prd.uth.gr/en/staff/lagarias_a/",
  },
  {
    name: "Akrivi Leka",
    url: "https://www.survey.ntua.gr/en/laboratory-staff/leka-akrivi",
  },
  {
    name: "Giorgos Mavrommatis",
    url: "https://geo.hua.gr/en/personnel/giorgos-mavrommatis-2/",
  },
  {
    name: "Nikolas Metaxides",
    url: "https://geo.hua.gr/en/personnel/metaxidis-nikos/",
  },
  {
    name: "Irini Micha",
    url: "https://www.arch.ntua.gr/index.php/person/micha-irini/?lang=en",
  },
  {
    name: "Angeliki Paidakaki",
    url: "https://geo.hua.gr/en/personnel/angeliki-paidakaki-2/",
  },
  {
    name: "Maria Papadopoulou",
    url: "https://www.survey.ntua.gr/en/dep/papadopoulou-maria",
  },
  {
    name: "Evangelos Pavlis",
    url: "https://aoa.aua.gr/?teacher=pavlis-evangelos",
  },
  {
    name: "Ilektra Petrakou",
    url: "https://geography.aegean.gr/ppl/index_en.php?content=0&bio=ipetr",
  },
  {
    name: "George Petropoulos",
    url: "https://geo.hua.gr/en/personnel/petropoulos-george-p/",
  },
  {
    name: "Christy Petropoulou",
    url: "https://geography.aegean.gr/ppl/index_en.php?content=0&bio=christy.p",
  },
  {
    name: "Manolis Pratsinakis",
    url: "https://geo.hua.gr/en/personnel/manolis-pratsinakis-2/",
  },
  {
    name: "Angeliki Rokka",
    url: "https://eled.duth.gr/author/arokka/",
  },
  {
    name: "Giorgios Sidiropoulos",
    url: "https://geography.aegean.gr/ppl/index_en.php?content=0&bio=geos",
  },
  {
    name: "Nikolaos Soulakellis",
    url: "https://geography.aegean.gr/ppl/index_en.php?content=0&bio=nsoul",
  },
  {
    name: "Nicos Souliotis",
    url: "https://www.ekke.gr/en/centre/personnel/souliotis-nikolaos",
  },
  {
    name: "Anastasia Stratigea",
    url: "https://www.survey.ntua.gr/en/dep/stratigea-anastasia",
  },
  {
    name: "Konstantinos Tsanakas",
  },
  {
    name: "Andreas Tsatsaris",
    url: "https://geo.uniwa.gr/en/profile/tsatsaris-andreas/",
  },
  {
    name: "Thomas Tscheulin",
    url: "https://geography.aegean.gr/ppl/index.php?content=0&bio=t.tscheulin",
  },
  {
    name: "Alexandra Tragaki",
    url: "https://geo.hua.gr/en/personnel/alexandra-tragaki/",
  },
  {
    name: "Loukas Triantis",
    url: "https://architecture.web.auth.gr/en/27134-2/",
  },
  {
    name: "Michalis Vaitis",
    url: "https://geography.aegean.gr/ppl/index.php?content=0&bio=vaitis",
  },
  {
    name: "Emmanuel Vassilakis",
    url: "http://scholar.uoa.gr/evasilak"
  },
  {
    name: "Fereniki Vatavali",
    url: "https://www.ekke.gr/en/centre/personnel/vatavali-fereniki",
  },
  {
    name: "Pinelopi Vergou",
    url: "https://www.econ.uth.gr/en/department/staff/special-teaching-staff/147-laboratory-teaching-staff/82-dr-pinelopi-vergou",
  },
  {
    name: "Nikolaos Zouros",
    url: "https://geography.aegean.gr/ppl/index.php?content=0&bio=nzour",
  },
];

const SESSIONS_OPEN = false;

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
              <div className="relative min-h-[28rem] lg:min-h-0">
                <div className="lg:absolute lg:inset-0 min-w-0 rounded-2xl border border-black/10 bg-white p-6 shadow-sm flex flex-col">
                <h3 className="text-xl font-semibold text-black">Sessions</h3>
                {SESSIONS_OPEN ? (
                  <>
                    <p className="mt-3 text-sm text-black/60">
                      Submit a session proposal for the 13th International Conference of the
                      Hellenic Geographical Society (2026).
                    </p>
                    <ThematicSessionForm locale={validLocale} />
                  </>
                ) : (
                  <SessionList />
                )}
              </div>
              </div>
              <div className="min-w-0 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black">Abstract Submission</h3>
                <p className="mt-3 mb-5 text-sm text-black/60">
                  Submit your abstract for the 13th HGS International Conference.
                </p>

                <div className="flex flex-col gap-4">

                  {/* ── Step 1: Register ── enabled from 1 Jul 2026
                  <div className="rounded-xl border border-black/10 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-black/5 shrink-0">
                        <ClipboardList className="h-4 w-4 text-black/60" />
                      </div>
                      <span className="text-xs font-medium text-black/40 uppercase tracking-wider">Step 1</span>
                    </div>
                    <p className="text-sm font-semibold text-black mb-1">Register</p>
                    <p className="text-xs text-black/50 mb-3">
                      Fill in your details, select your registration category, and indicate whether you plan to submit an abstract.
                    </p>
                    <RegistrationDialog>
                      <button className="w-full py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 transition-colors cursor-pointer">
                        Register Now
                      </button>
                    </RegistrationDialog>
                  </div>
                  ── end Step 1 ── */}

                  {/* Abstract */}
                  <div className="rounded-xl border border-black/10 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-black/5 shrink-0">
                        <FileText className="h-4 w-4 text-black/60" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-black mb-1">Submit Abstract</p>
                    <p className="text-xs text-black/50 mb-3">
                      Submit your abstract (max 300 words) and select your thematic session. Deadline: 1 May 2026.
                    </p>
                    <AbstractDialog>
                      <button className="w-full py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/80 transition-colors cursor-pointer">
                        Submit Abstract
                      </button>
                    </AbstractDialog>
                  </div>

                  {/* ── Step 3: Upload Payment Receipt ── enabled from 1 Jul 2026
                  <div className="rounded-xl border border-black/10 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-black/5 shrink-0">
                        <Receipt className="h-4 w-4 text-black/60" />
                      </div>
                      <span className="text-xs font-medium text-black/40 uppercase tracking-wider">Step 3</span>
                    </div>
                    <p className="text-sm font-semibold text-black mb-1">Upload Payment Receipt</p>
                    <p className="text-xs text-black/50 mb-3">
                      After completing your bank transfer, upload your payment receipt. HGS members may also upload a separate membership receipt.
                    </p>
                    <div className="rounded-lg bg-black/[0.03] border border-black/8 p-3 mb-3 space-y-1">
                      <p className="text-xs font-semibold text-black/60 uppercase tracking-wider">Bank Details</p>
                      <p className="text-xs text-black/60"><span className="text-black/40">IBAN:</span> GR9801720440005044113342752</p>
                      <p className="text-xs text-black/60"><span className="text-black/40">BIC / SWIFT:</span> PIRBGRAA</p>
                    </div>
                    <PaymentDialog>
                      <button className="w-full py-2 border border-black/15 text-black text-sm font-medium rounded-full hover:bg-black/5 transition-colors cursor-pointer">
                        Upload Receipt
                      </button>
                    </PaymentDialog>
                  </div>
                  ── end Step 3 ── */}

                </div>

                <p className="mt-4 text-xs text-black/40 text-center">
                  Early bird registration opens <strong className="text-black/50">1 July 2026</strong>.
                </p>
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

          {/* Conference Thematic Areas */}
          <FadeInView delay={0.105}>
            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-black mb-1">Thematic Areas</h3>
              <p className="text-sm text-black/50 mb-4">Abstracts may be submitted under any of the following conference themes:</p>
              <div className="grid gap-2 sm:grid-cols-2" style={{ gridAutoFlow: "column", gridTemplateRows: "repeat(6, auto)" }}>
                {[
                  "Geography: Theory, Methods, Education and Practice",
                  "Physical Geography, Climate Change, Coastal Systems and Natural Hazards",
                  "Marine, Island and Mediterranean Geographies",
                  "Urban Geography, Housing and Trends of Socio-Spatial Inequalities",
                  "Demographic Dynamics: Population, Migration and Mobility Flows",
                  "Political and Economic Geographies",
                  "Cultural Geography, Heritage and Landscapes",
                  "Spatial Planning, Regional Development and Territorial Governance",
                  "Transport, Mobility and Infrastructure",
                  "Geospatial Technologies, Digital and Computational Geographies",
                  "Geography and Education – Educating Geographers",
                ].map((topic, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg border border-black/5 bg-black/[0.02] px-3 py-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-[10px] font-semibold text-black/35 tabular-nums">{i + 1}</span>
                    <span className="text-sm text-black/65 leading-snug">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>

          {/* Key Dates */}
          <FadeInView delay={0.11}>
            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-black mb-6">Key Dates</h3>
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-black/10" />

                {/* Past milestones */}
                {[
                  { date: "30 Jan 2026", label: "Call for session proposals" },
                  { date: "20 Feb 2026", label: "Deadline for session proposals" },
                ].map((item) => (
                  <div key={item.date} className="relative flex items-start gap-4 pb-4">
                    <div className="relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-black/15 bg-black/5" />
                    <div>
                      <p className="text-xs font-medium text-black/30">{item.date}</p>
                      <p className="text-sm text-black/35 line-through decoration-black/15">{item.label}</p>
                    </div>
                  </div>
                ))}

                {/* Active phase */}
                <div className="relative flex items-start gap-4 pb-4">
                  <div className="relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-emerald-500 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-30" />
                  </div>
                  <div className="flex-1 -mt-1 rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Now</span>
                        <p className="text-xs font-medium text-emerald-700">1 Mar – 1 May 2026</p>
                      </div>
                      <AddToCalendar title="Abstract Submission Deadline – HGS Conference" start="20260501" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-900">Abstract submission open</p>
                  </div>
                </div>

                {/* Upcoming milestones */}
                {[
                  { date: "1 Jul 2026", label: "Notifications to authors", calStart: "20260701" },
                  { date: "1 Jul – 31 Aug 2026", label: "Early bird registration", calStart: "20260701", calEnd: "20260901" },
                  { date: "30 Sep 2026", label: "Late bird registration deadline", calStart: "20260930" },
                  { date: "27 – 28 Nov 2026", label: "Conference", highlight: true, calStart: "20261127", calEnd: "20261129" },
                  { date: "29 Nov 2026", label: "Post-conference field trip (TBC)", calStart: "20261129" },
                ].map((item) => (
                  <div key={item.date} className="relative flex items-start gap-4 pb-4">
                    <div className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${item.highlight ? "border-black/40 bg-black/10" : "border-black/15 bg-white"}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-black/40">{item.date}</p>
                        <AddToCalendar title={`${item.label} – HGS Conference`} start={item.calStart} end={item.calEnd} />
                      </div>
                      <p className={`text-sm ${item.highlight ? "font-semibold text-black/80" : "text-black/60"}`}>{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>

          {/* Registration Fees, General Info & Bank Details */}
          <FadeInView delay={0.12}>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Registration Fees */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black mb-4">Registration Fees</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-black/70">
                    <thead className="text-xs uppercase tracking-wide text-black/50">
                      <tr>
                        <th className="py-2 pr-4">Category</th>
                        <th className="py-2 pr-4">Early Bird<span className="normal-case block text-[10px] text-black/35">until 31 Aug</span></th>
                        <th className="py-2">Late Bird<span className="normal-case block text-[10px] text-black/35">until 30 Sep</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      <tr>
                        <td className="py-3 pr-4">Regular</td>
                        <td className="py-3 pr-4 font-medium">€60</td>
                        <td className="py-3 text-black/40">€80</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">HGS Members <span className="text-xs text-black/40">(in good standing)</span></td>
                        <td className="py-3 pr-4 font-medium">€40</td>
                        <td className="py-3 text-black/40">€50</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Students</td>
                        <td className="py-3 pr-4 font-medium">€20</td>
                        <td className="py-3 text-black/40">€30</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">HGS Student Members</td>
                        <td className="py-3 pr-4 font-medium">€10</td>
                        <td className="py-3 text-black/40">€15</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Information & Bank Details */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-black mb-4">General Information</h3>
                  <div className="space-y-3 text-sm text-black/70">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">Official Language</p>
                      <p>English</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-black/40 mb-1">Venues</p>
                      <ul className="space-y-2">
                        <li>
                          <p className="font-medium text-black/80">Harokopio University of Athens</p>
                          <p className="text-xs text-black/50">El. Venizelou Ave. 70, 17676, Kallithea, Athens</p>
                        </li>
                        <li>
                          <p className="font-medium text-black/80">National Centre for Social Research</p>
                          <p className="text-xs text-black/50">Archimidous 8, 17675, Kallithea, Athens</p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-black mb-4">Bank Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/50">IBAN</span>
                      <span className="font-mono text-black/80 text-xs">GR9801720440005044113342752</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50">BIC / SWIFT</span>
                      <span className="font-mono text-black/80 text-xs">PIRBGRAA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeInView>

          {/* Organizing Committee */}
          <FadeInView delay={0.15}>
            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-black mb-6">{t.committeeLabel}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-black/70">
                  <thead className="text-xs uppercase tracking-wide text-black/50">
                    <tr>
                      <th className="py-2 pr-4">Designation</th>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2">Affiliation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {organizingCommittee.map((member) => (
                      <tr key={`${member.designation}-${member.name}`}>
                        <td className="py-3 pr-4 font-medium text-black">
                          {member.designation}
                        </td>
                      <td className="py-3 pr-4">
                        {member.url ? (
                          <a
                            href={member.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-black hover:underline"
                          >
                            {member.name}
                          </a>
                        ) : (
                          member.name
                        )}
                      </td>
                        <td className="py-3 text-black/70">{member.affiliation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </FadeInView>

          {/* Scientific Committee */}
          <FadeInView delay={0.18}>
            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-black mb-6">{t.scientificLabel}</h3>
              <div className="flex flex-wrap gap-3">
                {[...scientificCommittee]
                  .sort((a, b) => {
                    const lastA = a.name.split(" ").slice(-1).join(" ");
                    const lastB = b.name.split(" ").slice(-1).join(" ");
                    const lastCompare = lastA.localeCompare(lastB);
                    return lastCompare !== 0
                      ? lastCompare
                      : a.name.localeCompare(b.name);
                  })
                  .map((member) =>
                  member.url ? (
                    <a
                      key={member.name}
                      href={member.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-black/10 bg-black/5 px-4 py-2 text-sm text-black/70 hover:border-black/20 hover:bg-black/10"
                    >
                      {member.name}
                    </a>
                  ) : (
                    <span
                      key={member.name}
                      className="rounded-full border border-black/10 bg-black/5 px-4 py-2 text-sm text-black/70"
                    >
                      {member.name}
                    </span>
                  )
                )}
              </div>
            </div>
          </FadeInView>

          {/* Contact */}
          <FadeInView delay={0.2}>
            <div className="mt-8 p-8 rounded-2xl border border-black/10 bg-white shadow-sm text-center">
              <h3 className="text-xl font-semibold text-black mb-4">{t.contactLabel}</h3>
              <p className="text-black/60 mb-6">{t.contactBlurb}</p>
              <a
                href="mailto:ekarkani@geol.uoa.gr"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-black/90 transition-all"
              >
                <Mail className="h-4 w-4" />
                ekarkani@geol.uoa.gr
              </a>
            </div>
          </FadeInView>
        </div>
      </section>
    </>
  );
}
