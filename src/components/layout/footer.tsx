import Link from "next/link";
import { Facebook, Github, Mail, MapPin } from "lucide-react";
import { siteConfig, type Locale } from "@/config/site";

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const footerText = {
    en: {
      society: "The Society",
      links: "Quick Links",
      contact: "Contact",
      rights: "All rights reserved",
      developed: "Developed by Alexandros P. Liaskos",
      history: "History",
      goals: "Goals",
      registration: "Registration",
      conferences: "Conferences",
      news: "News",
    },
    el: {
      society: "Η Εταιρεία",
      links: "Σύνδεσμοι",
      contact: "Επικοινωνία",
      rights: "Με επιφύλαξη παντός δικαιώματος",
      developed: "Developed by Alexandros P. Liaskos",
      history: "Ιστορία",
      goals: "Στόχοι",
      registration: "Εγγραφή",
      conferences: "Συνέδρια",
      news: "Νέα",
    },
  };

  const t = footerText[locale];

  return (
    <footer className="relative border-t border-black/10 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-3 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="inline-block">
              <h3 className="text-lg font-semibold text-black">
                {siteConfig.shortName[locale]}
              </h3>
              <p className="mt-1 text-sm text-black/50">
                {siteConfig.description[locale]}
              </p>
            </Link>
            <div className="mt-4 flex gap-3">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-black/5 text-black/60 hover:bg-black/10 hover:text-black transition-all"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-black/5 text-black/60 hover:bg-black/10 hover:text-black transition-all"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-black mb-4">{t.links}</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/society/history`}
                  className="text-sm text-black/60 hover:text-black transition-colors"
                >
                  {t.history}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/society/goals`}
                  className="text-sm text-black/60 hover:text-black transition-colors"
                >
                  {t.goals}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/society/registration`}
                  className="text-sm text-black/60 hover:text-black transition-colors"
                >
                  {t.registration}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/conferences/hgs`}
                  className="text-sm text-black/60 hover:text-black transition-colors"
                >
                  {t.conferences}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/news/announcements`}
                  className="text-sm text-black/60 hover:text-black transition-colors"
                >
                  {t.news}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-1 lg:col-span-2">
            <h4 className="text-sm font-semibold text-black mb-4">{t.contact}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-black/40 mt-0.5 flex-shrink-0" />
                <a
                  href={siteConfig.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black/60 hover:text-black transition-colors"
                >
                  {siteConfig.address[locale]}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-black/40 mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-sm text-black/60 hover:text-black transition-colors break-all"
                >
                  {siteConfig.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-black/10 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-black/40">
              © {currentYear} {siteConfig.name[locale]}. {t.rights}.
            </p>
            <p className="text-xs text-black/40">
              Developed by{" "}
              <a
                href="mailto:alexliaskos@geol.uoa.gr"
                className="hover:text-black transition-colors"
              >
                Alexandros P. Liaskos
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
