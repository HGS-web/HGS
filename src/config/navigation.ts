import type { Locale } from "./site";

export interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

export const navigation: Record<Locale, NavItem[]> = {
  en: [
    {
      label: "The Society",
      children: [
        { label: "History", href: "/en/society/history" },
        { label: "Function", href: "/en/society/function" },
        { label: "Goals", href: "/en/society/goals" },
        { label: "Registration", href: "/en/society/registration" },
      ],
    },
    {
      label: "Collaborations",
      children: [
        { label: "Academic Bodies", href: "/en/collaborations/academic" },
        { label: "Geographical Societies", href: "/en/collaborations/societies" },
        { label: "Other Networks", href: "/en/collaborations/other" },
      ],
    },
    {
      label: "Conferences",
      children: [
        { label: "Past HGS Conferences", href: "/en/conferences/hgs" },
        { label: "Other Conferences", href: "/en/conferences/other" },
      ],
    },
    { label: "HGS Conference 2026", href: "/en/conference2026" },
    {
      label: "News",
      children: [
        { label: "Announcements", href: "/en/news/announcements" },
        { label: "Events", href: "/en/news/events" },
      ],
    },
    { label: "Contact", href: "/en/contact" },
  ],
  el: [
    {
      label: "Η Εταιρεία",
      children: [
        { label: "Ιστορία", href: "/el/society/history" },
        { label: "Λειτουργία", href: "/el/society/function" },
        { label: "Στόχοι", href: "/el/society/goals" },
        { label: "Εγγραφή", href: "/el/society/registration" },
      ],
    },
    {
      label: "Συνεργασίες",
      children: [
        { label: "Ακαδημαϊκοί Φορείς", href: "/el/collaborations/academic" },
        { label: "Γεωγραφικές Εταιρείες", href: "/el/collaborations/societies" },
        { label: "Άλλα Δίκτυα", href: "/el/collaborations/other" },
      ],
    },
    {
      label: "Συνέδρια",
      children: [
        { label: "Προηγούμενα Συνέδρια ΕΓΕ", href: "/el/conferences/hgs" },
        { label: "Άλλα Συνέδρια", href: "/el/conferences/other" },
      ],
    },
    { label: "Συνέδριο ΕΓΕ 2026", href: "/el/conference2026" },
    {
      label: "Νέα",
      children: [
        { label: "Ανακοινώσεις", href: "/el/news/announcements" },
        { label: "Εκδηλώσεις", href: "/el/news/events" },
      ],
    },
    { label: "Επικοινωνία", href: "/el/contact" },
  ],
};
