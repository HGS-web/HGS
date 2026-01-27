import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const contentDirectory = path.join(process.cwd(), "content");

export interface MarkdownContent {
  content: string;
  frontmatter: Record<string, unknown>;
  rawContent: string;
}

/**
 * Get markdown content from a file path relative to content directory
 * @param locale - 'en' or 'el'
 * @param slugPath - path like 'society/history' or 'conferences/hgs'
 */
export async function getMarkdownContent(
  locale: string,
  slugPath: string
): Promise<MarkdownContent | null> {
  // Map URL slugs to actual folder names
  const pathMappings: Record<string, string> = {
    "society": "The Society",
    "collaborations": "Collaborations",
    "conferences": "Conferences",
    "contact": "Contact us",
    "news": "News",
    "conference2026": "Conference2026",
    // File mappings
    "history": "History",
    "function": "Function",
    "goals": "Goals",
    "registration": "Registration",
    "academic": "Academic and Scientific Bodies",
    "societies": "Geographical Societies and Networks",
    "other": "Other",
    "hgs": "HGS",
    "announcements": "Announcements",
    "events": "Events",
  };

  // Convert slug path to actual file path
  const parts = slugPath.split("/").filter(Boolean);
  const mappedParts = parts.map((part) => pathMappings[part] || part);

  // Try different file path combinations
  const possiblePaths = [
    path.join(contentDirectory, locale, ...mappedParts) + ".md",
    path.join(contentDirectory, locale, ...mappedParts, "index.md"),
  ];

  let filePath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    console.warn(`Markdown file not found for: ${locale}/${slugPath}`);
    console.warn(`Tried paths:`, possiblePaths);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content: rawContent } = matter(fileContents);

    // Allow inline HTML inside our Markdown content (we control the content folder).
    const processedContent = await remark()
      .use(html, { sanitize: false })
      .process(rawContent);
    const content = processedContent.toString();

    return {
      content,
      frontmatter: data,
      rawContent,
    };
  } catch (error) {
    console.error(`Error reading markdown file: ${filePath}`, error);
    return null;
  }
}

/**
 * Get the home page content
 */
export async function getHomeContent(locale: string): Promise<MarkdownContent | null> {
  const filePath = path.join(contentDirectory, locale, "index.md");

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content: rawContent } = matter(fileContents);

    // Allow inline HTML inside our Markdown content (we control the content folder).
    const processedContent = await remark()
      .use(html, { sanitize: false })
      .process(rawContent);
    const content = processedContent.toString();

    return {
      content,
      frontmatter: data,
      rawContent,
    };
  } catch (error) {
    console.error(`Error reading home content for ${locale}`, error);
    return null;
  }
}

/**
 * List all available content files for a locale
 */
export function listContentFiles(locale: string): string[] {
  const localeDir = path.join(contentDirectory, locale);
  const files: string[] = [];

  function walkDir(dir: string, prefix: string = "") {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name), `${prefix}${entry.name}/`);
      } else if (entry.name.endsWith(".md")) {
        const name = entry.name.replace(".md", "");
        files.push(`${prefix}${name}`);
      }
    }
  }

  walkDir(localeDir);
  return files;
}
