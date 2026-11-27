import { getPageVisits } from "@/lib/page-visits";
import type { Locale } from "@/config/site";

const strings = {
  en: { label: "Page visits", locale: "en-GB" },
  el: { label: "Επισκέψεις σελίδων", locale: "el-GR" },
} as const;

// Shown in the footer's bottom bar. Renders nothing when the count cannot be read.
export async function PageVisits({ locale }: { locale: Locale }) {
  const count = await getPageVisits();
  if (count === null) return null;
  const t = strings[locale];
  return (
    <p className="text-xs text-black/40">
      {t.label} {count.toLocaleString(t.locale)}
    </p>
  );
}
