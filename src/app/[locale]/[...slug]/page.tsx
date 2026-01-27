import { notFound } from "next/navigation";
import { getMarkdownContent } from "@/lib/markdown";
import { FadeIn } from "@/components/ui/motion";
import type { Locale } from "@/config/site";

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
}

// All possible routes for static export
export function generateStaticParams() {
  const locales = ["en", "el"];
  const slugs = [
    ["society", "history"],
    ["society", "function"],
    ["society", "goals"],
    ["society", "registration"],
    ["collaborations", "academic"],
    ["collaborations", "societies"],
    ["collaborations", "other"],
    ["conferences", "hgs"],
    ["conferences", "other"],
    ["news", "announcements"],
    ["news", "events"],
    ["contact"],
  ];

  const params: { locale: string; slug: string[] }[] = [];

  for (const locale of locales) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

// Generate metadata from markdown frontmatter
export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const slugPath = slug?.join("/") || "";
  const content = await getMarkdownContent(locale, slugPath);

  if (!content) {
    return {
      title: "Page Not Found",
    };
  }

  // Extract title from first h1 in content or frontmatter
  const titleMatch = content.rawContent.match(/^#\s+(.+)$/m);
  const title = (content.frontmatter.title as string) || titleMatch?.[1] || "Hellenic Geographical Society";

  return {
    title: `${title} | HGS`,
    description: content.frontmatter.description as string || undefined,
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const validLocale = (locale === "el" ? "el" : "en") as Locale;
  const slugPath = slug?.join("/") || "";

  const content = await getMarkdownContent(validLocale, slugPath);

  if (!content) {
    notFound();
  }

  return (
    <article className="relative pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          </FadeIn>
        </div>
      </article>
  );
}
