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
    name: "Georgios Tsilimigkas",
    url: "https://geography.aegean.gr/ppl/index_en.php?content=0&bio=gtsil",
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
                <h3 className="text-xl font-semibold text-black">Sessions</h3>
                <p className="mt-3 text-sm text-black/60">
                  Submit a session proposal for the 13th International Conference of the
                  Hellenic Geographical Society (2026).
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
                  .sort((a, b) => a.name.localeCompare(b.name))
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
