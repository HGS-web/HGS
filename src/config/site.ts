export const siteConfig = {
  name: {
    en: "Hellenic Geographical Society",
    el: "Ελληνική Γεωγραφική Εταιρεία",
  },
  shortName: {
    en: "HGS",
    el: "ΕΓΕ",
  },
  description: {
    en: "Promoting geographical science in Greece since 1901",
    el: "Προάγοντας τη γεωγραφική επιστήμη στην Ελλάδα από το 1901",
  },
  url: "https://geographiki.gr",
  email: "geographicalsocietyhellas@gmail.com",
  address: {
    en: "Voukourestiou 11, 106 71, Athens",
    el: "Βουκουρεστίου 11, 106 71, Αθήνα",
  },
  mapUrl: "https://maps.app.goo.gl/g7kBUna8MDYhGkAF7",
  social: {
    facebook: "https://www.facebook.com/HellenicGEOSOCIETY/",
    github: "https://github.com/HGS-web/HGS/",
  },
  banking: {
    iban: "GR9801720440005044113342752",
    bic: "PIRBGRAA",
  },
  founded: 1901,
} as const;

export type Locale = "en" | "el";
