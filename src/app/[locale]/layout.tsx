import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GeoPattern } from "@/components/ui/geo-pattern";
import { ConferenceAnnouncement } from "@/components/ui/conference-announcement";
import type { Locale } from "@/config/site";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }];
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // We need to handle this as a sync operation for the layout
  // The locale will be validated in the page components
  return (
    <LocaleLayoutContent params={params}>{children}</LocaleLayoutContent>
  );
}

async function LocaleLayoutContent({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = (locale === "el" ? "el" : "en") as Locale;

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Fixed background - stays in place while scrolling */}
      <GeoPattern fixed />

      <Header locale={validLocale} />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer locale={validLocale} />

      {/* Conference 2026 announcement - floating notification */}
      <ConferenceAnnouncement locale={validLocale} />
    </div>
  );
}
