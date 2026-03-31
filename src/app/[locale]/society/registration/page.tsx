import { Mail } from "lucide-react"
import { FadeIn, FadeInView } from "@/components/ui/motion"
import { MembershipForm } from "@/components/membership/registration-form"
import { siteConfig, type Locale } from "@/config/site"

interface PageProps {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "el" }]
}

const pageText = {
  en: {
    title: "Registration",
    welcomeGreeting: "Dear Member,",
    welcomeBody: "The Board of Directors of the Hellenic Geographical Society welcomes you to the Greek geographical community.",
    welcomeInvite: "On behalf of the Board of Directors, we invite you to become a member of the Hellenic Geographical Society. To complete your registration, please fill in the membership application form below.",
    paymentInvite: "We also invite you to pay or renew your membership fee via bank transfer to the HGS account at Piraeus Bank.",
    subscriptionNote: "These subscriptions are vital to the Society\u2019s operations, growth, and long-term sustainability. They also enable us to organise events and to promote the geographical sciences. We sincerely thank you for your support of this effort. By maintaining your membership, you contribute to the advancement of the Hellenic Geographical Society\u2019s initiatives for the benefit of the Greek geographical community.",
    closing: "With geographical regards,",
    closingFrom: "The Board of Directors",
    closingOrg: "Hellenic Geographical Society",
    feesTitle: "Membership Fees",
    feesAnnual: "Annual membership:",
    feeResearch: "Research staff: \u20AC20",
    feeStudent: "Students: \u20AC10",
    benefitsTitle: "Member Benefits",
    benefitsIntro: "As a member of the Hellenic Geographical Society, you will be able to:",
    benefits: [
      "Stay informed about Scientific Events & International Conferences",
      "Access Authoritative Studies",
      "Collaborate with People Who Share Your Interests",
      "Promote Education",
      "Strengthen Geographical Knowledge & Environmental Awareness",
      "Support Research & Innovation",
    ],
    cta1: "Become a member today and actively contribute to the development and dissemination of geographical knowledge in Greece and worldwide!",
    cta2: "Let us shape the future of geography together!",
    cta3: "Join the geographical community!",
    privilegesTitle: "Member Privileges",
    privilegesIntro: "Current members of the Hellenic Geographical Society are entitled to the following benefits:",
    privileges: [
      "Reduced Registration Fee for participation in HGS conferences and other scientific events in which the Society takes part",
      "Free Attendance at Workshops and Lectures organised by the Society, offering access to informative events at no cost",
      "Voting Rights in elections, allowing you to contribute to shaping the future of the Society",
    ],
    bankTitle: "Banking Information",
    bankIban: "IBAN",
    bankBic: "BIC / SWIFT",
    bankRef: "Reference",
    bankRefValue: "Membership HGS + year",
    contactTitle: "Contact",
    contactText: "For any clarification or questions, you may contact the Secretary of the Hellenic Geographical Society at:",
    thankYou: "We sincerely thank you for your participation and ongoing support.",
    thankYouClosing: "With your contribution, the Hellenic Geographical Society continues to promote geographical science and strengthen the scientific community.",
  },
  el: {
    title: "\u0395\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE",
    welcomeGreeting: "",
    welcomeBody: "\u03A4\u03BF \u0394\u03B9\u03BF\u03B9\u03BA\u03B7\u03C4\u03B9\u03BA\u03CC \u03A3\u03C5\u03BC\u03B2\u03BF\u03CD\u03BB\u03B9\u03BF \u03C4\u03B7\u03C2 \u0395\u0393\u0395 \u03C3\u03B1\u03C2 \u03BA\u03B1\u03BB\u03C9\u03C3\u03BF\u03C1\u03AF\u03B6\u03B5\u03B9 \u03C3\u03C4\u03B7\u03BD \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03BA\u03BF\u03B9\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1.",
    welcomeInvite: "\u0395\u03BA \u03BC\u03AD\u03C1\u03BF\u03C5\u03C2 \u03C4\u03BF\u03C5 \u0394\u03B9\u03BF\u03B9\u03BA\u03B7\u03C4\u03B9\u03BA\u03BF\u03CD \u03A3\u03C5\u03BC\u03B2\u03BF\u03C5\u03BB\u03AF\u03BF\u03C5, \u03C3\u03B1\u03C2 \u03C0\u03C1\u03BF\u03C3\u03BA\u03B1\u03BB\u03BF\u03CD\u03BC\u03B5 \u03BD\u03B1 \u03B3\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03AD\u03BB\u03B7 \u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2. \u0393\u03B9\u03B1 \u03C4\u03B7\u03BD \u03B5\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03B1\u03C2, \u03C0\u03B1\u03C1\u03B1\u03BA\u03B1\u03BB\u03B5\u03AF\u03C3\u03C4\u03B5 \u03BD\u03B1 \u03C3\u03C5\u03BC\u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03B5\u03C4\u03B5 \u03C4\u03B7\u03BD \u03C0\u03B1\u03C1\u03B1\u03BA\u03AC\u03C4\u03C9 \u03C6\u03CC\u03C1\u03BC\u03B1 \u03BC\u03AD\u03BB\u03BF\u03C5\u03C2.",
    paymentInvite: "\u03A3\u03B1\u03C2 \u03BA\u03B1\u03BB\u03BF\u03CD\u03BC\u03B5 \u03BD\u03B1 \u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03B5\u03C4\u03B5, \u03BA\u03B1\u03B9 \u03BD\u03B1 \u03B1\u03BD\u03B1\u03BD\u03B5\u03CE\u03C3\u03B5\u03C4\u03B5 \u03C4\u03B7 \u03C3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AE, \u03C3\u03B1\u03C2 \u03BC\u03AD\u03C3\u03C9 \u03C4\u03C1\u03B1\u03C0\u03B5\u03B6\u03B9\u03BA\u03AE\u03C2 \u03BC\u03B5\u03C4\u03B1\u03C6\u03BF\u03C1\u03AC\u03C2 \u03C3\u03C4\u03BF\u03BD \u03BB\u03BF\u03B3\u03B1\u03C1\u03B9\u03B1\u03C3\u03BC\u03CC \u03C4\u03B7\u03C2 \u0395\u0393\u0395 \u03C3\u03C4\u03B7\u03BD \u03A4\u03C1\u03AC\u03C0\u03B5\u03B6\u03B1 \u03A0\u03B5\u03B9\u03C1\u03B1\u03B9\u03CE\u03C2.",
    subscriptionNote: "\u039F\u03B9 \u03C3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AD\u03C2 \u03B1\u03C5\u03C4\u03AD\u03C2 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B6\u03C9\u03C4\u03B9\u03BA\u03AE\u03C2 \u03C3\u03B7\u03BC\u03B1\u03C3\u03AF\u03B1\u03C2 \u03B3\u03B9\u03B1 \u03C4\u03B7 \u03BB\u03B5\u03B9\u03C4\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1, \u03C4\u03B7\u03BD \u03B1\u03BD\u03AC\u03C0\u03C4\u03C5\u03BE\u03B7 \u03BA\u03B1\u03B9 \u03C4\u03B7 \u03B4\u03B9\u03B1\u03C3\u03C6\u03AC\u03BB\u03B9\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B2\u03B9\u03C9\u03C3\u03B9\u03BC\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2 \u03C4\u03B7\u03C2 \u0395\u0393\u0395. \u0395\u03C0\u03AF\u03C3\u03B7\u03C2, \u03B5\u03C0\u03B9\u03C4\u03C1\u03AD\u03C0\u03BF\u03C5\u03BD \u03C4\u03B7\u03BD \u03B4\u03B9\u03BF\u03C1\u03B3\u03AC\u03BD\u03C9\u03C3\u03B7 \u03B5\u03BA\u03B4\u03B7\u03BB\u03CE\u03C3\u03B5\u03C9\u03BD \u03BA\u03B1\u03B9 \u03C4\u03B7\u03BD \u03C0\u03C1\u03BF\u03CE\u03B8\u03B7\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u03B5\u03C0\u03B9\u03C3\u03C4\u03AE\u03BC\u03B7\u03C2. \u03A3\u03B1\u03C2 \u03B5\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03BF\u03CD\u03BC\u03B5 \u03B8\u03B5\u03C1\u03BC\u03AC \u03C0\u03BF\u03C5 \u03C3\u03C4\u03B7\u03C1\u03AF\u03B6\u03B5\u03C4\u03B5 \u03B1\u03C5\u03C4\u03AE\u03BD \u03C4\u03B7\u03BD \u03C0\u03C1\u03BF\u03C3\u03C0\u03AC\u03B8\u03B5\u03B9\u03B1. \u039C\u03B5 \u03C4\u03B7\u03BD \u03B5\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03B1\u03C2, \u03C3\u03C5\u03BC\u03B2\u03AC\u03BB\u03BB\u03B5\u03C4\u03B5 \u03C3\u03C4\u03B7\u03BD \u03C5\u03C0\u03BF\u03C3\u03C4\u03AE\u03C1\u03B9\u03BE\u03B7 \u03C4\u03C9\u03BD \u03B4\u03C1\u03AC\u03C3\u03B5\u03C9\u03BD \u03C4\u03B7\u03C2 \u0395\u0393\u0395 \u03C0\u03C1\u03BF\u03C2 \u03CC\u03C6\u03B5\u03BB\u03BF\u03C2 \u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u03BA\u03BF\u03B9\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2!",
    closing: "\u039C\u03B5 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03BF\u03CD\u03C2 \u03C7\u03B1\u03B9\u03C1\u03B5\u03C4\u03B9\u03C3\u03BC\u03BF\u03CD\u03C2,",
    closingFrom: "\u03A4\u03BF \u0394\u03B9\u03BF\u03B9\u03BA\u03B7\u03C4\u03B9\u03BA\u03CC \u03A3\u03C5\u03BC\u03B2\u03BF\u03CD\u03BB\u03B9\u03BF",
    closingOrg: "\u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03AF\u03B1\u03C2",
    feesTitle: "\u03A3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AD\u03C2",
    feesAnnual: "\u0395\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03C4\u03B7\u03BD \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1 \u03B3\u03B9\u03B1 \u03AD\u03BD\u03B1 \u03C7\u03C1\u03CC\u03BD\u03BF:",
    feeResearch: "\u0395\u03C1\u03B5\u03C5\u03BD\u03B7\u03C4\u03B9\u03BA\u03CC \u03C0\u03C1\u03BF\u03C3\u03C9\u03C0\u03B9\u03BA\u03CC: 20\u20AC",
    feeStudent: "\u03A6\u03BF\u03B9\u03C4\u03B7\u03C4\u03AD\u03C2: 10\u20AC",
    benefitsTitle: "\u03A0\u03BB\u03B5\u03BF\u03BD\u03B5\u03BA\u03C4\u03AE\u03BC\u03B1\u03C4\u03B1 \u039C\u03AD\u03BB\u03BF\u03C5\u03C2",
    benefitsIntro: "\u03A9\u03C2 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03C4\u03B7\u03C2 \u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AE\u03C2 \u0393\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2 \u03B8\u03B1 \u03AD\u03C7\u03B5\u03C4\u03B5 \u03C4\u03B7 \u03B4\u03C5\u03BD\u03B1\u03C4\u03CC\u03C4\u03B7\u03C4\u03B1 \u03BD\u03B1:",
    benefits: [
      "\u0395\u03BD\u03B7\u03BC\u03B5\u03C1\u03C9\u03B8\u03B5\u03AF\u03C4\u03B5 \u03B3\u03B9\u03B1 \u03B5\u03C0\u03B9\u03C3\u03C4\u03B7\u03BC\u03BF\u03BD\u03B9\u03BA\u03AD\u03C2 \u03B5\u03BA\u03B4\u03B7\u03BB\u03CE\u03C3\u03B5\u03B9\u03C2 & \u03B4\u03B9\u03B5\u03B8\u03BD\u03AE \u03C3\u03C5\u03BD\u03AD\u03B4\u03C1\u03B9\u03B1",
      "\u0391\u03C0\u03BF\u03BA\u03C4\u03AE\u03C3\u03B5\u03C4\u03B5 \u03C0\u03C1\u03CC\u03C3\u03B2\u03B1\u03C3\u03B7 \u03C3\u03B5 \u03AD\u03B3\u03BA\u03C1\u03B9\u03C4\u03B5\u03C2 \u03BC\u03B5\u03BB\u03AD\u03C4\u03B5\u03C2",
      "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03B5\u03AF\u03C4\u03B5 \u03BC\u03B5 \u03AC\u03C4\u03BF\u03BC\u03B1 \u03BC\u03B5 \u03BA\u03BF\u03B9\u03BD\u03AC \u03B5\u03BD\u03B4\u03B9\u03B1\u03C6\u03AD\u03C1\u03BF\u03BD\u03C4\u03B1",
      "\u03A0\u03C1\u03BF\u03C9\u03B8\u03AE\u03C3\u03B5\u03C4\u03B5 \u03C4\u03B7\u03BD \u03B5\u03BA\u03C0\u03B1\u03AF\u03B4\u03B5\u03C5\u03C3\u03B7",
      "\u0395\u03BD\u03B9\u03C3\u03C7\u03CD\u03C3\u03B5\u03C4\u03B5 \u03C4\u03B7 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03B3\u03BD\u03CE\u03C3\u03B7 & \u03C4\u03B7\u03BD \u03C0\u03B5\u03C1\u03B9\u03B2\u03B1\u03BB\u03BB\u03BF\u03BD\u03C4\u03B9\u03BA\u03AE \u03B5\u03C5\u03B1\u03B9\u03C3\u03B8\u03B7\u03C4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7",
      "\u03A3\u03C4\u03B7\u03C1\u03AF\u03BE\u03B5\u03C4\u03B5 \u03C4\u03B7\u03BD \u03AD\u03C1\u03B5\u03C5\u03BD\u03B1 & \u03BA\u03B1\u03B9\u03BD\u03BF\u03C4\u03BF\u03BC\u03AF\u03B1",
    ],
    cta1: "\u0393\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03C3\u03AE\u03BC\u03B5\u03C1\u03B1 \u03BA\u03B1\u03B9 \u03C3\u03C5\u03BC\u03B2\u03AC\u03BB\u03BB\u03B5\u03C4\u03B5 \u03B5\u03BD\u03B5\u03C1\u03B3\u03AC \u03C3\u03C4\u03B7\u03BD \u03B1\u03BD\u03AC\u03C0\u03C4\u03C5\u03BE\u03B7 \u03BA\u03B1\u03B9 \u03C4\u03B7 \u03B4\u03B9\u03AC\u03B4\u03BF\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u03B3\u03BD\u03CE\u03C3\u03B7\u03C2, \u03C3\u03C4\u03B7\u03BD \u0395\u03BB\u03BB\u03AC\u03B4\u03B1 \u03BA\u03B1\u03B9 \u03C0\u03B1\u03B3\u03BA\u03BF\u03C3\u03BC\u03AF\u03C9\u03C2!",
    cta2: "\u0391\u03C2 \u03C7\u03C4\u03AF\u03C3\u03BF\u03C5\u03BC\u03B5 \u03BC\u03B1\u03B6\u03AF \u03C4\u03BF \u03BC\u03AD\u03BB\u03BB\u03BF\u03BD \u03C4\u03B7\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03AF\u03B1\u03C2!",
    cta3: "\u0393\u03AF\u03BD\u03B5\u03C4\u03B5 \u03BC\u03AD\u03BB\u03BF\u03C2 \u03C4\u03B7\u03C2 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE\u03C2 \u03BA\u03BF\u03B9\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2!",
    privilegesTitle: "\u03A0\u03B1\u03C1\u03BF\u03C7\u03AD\u03C2 \u039C\u03B5\u03BB\u03CE\u03BD",
    privilegesIntro: "\u03A4\u03B1 \u03B5\u03BD\u03AE\u03BC\u03B5\u03C1\u03B1 \u03BC\u03AD\u03BB\u03B7 \u03C4\u03B7\u03C2 \u0395\u0393\u0395, \u03AD\u03C7\u03BF\u03C5\u03BD \u03C4\u03B9\u03C2 \u03C0\u03B1\u03C1\u03B1\u03BA\u03AC\u03C4\u03C9 \u03C0\u03B1\u03C1\u03BF\u03C7\u03AD\u03C2:",
    privileges: [
      "\u039C\u03B5\u03B9\u03C9\u03BC\u03AD\u03BD\u03BF \u03BA\u03CC\u03C3\u03C4\u03BF\u03C2 \u03B5\u03B3\u03B3\u03C1\u03B1\u03C6\u03AE\u03C2 \u03B3\u03B9\u03B1 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03BF\u03C7\u03AE \u03C3\u03C4\u03B1 \u03C3\u03C5\u03BD\u03AD\u03B4\u03C1\u03B9\u03B1 \u03C4\u03B7\u03C2 \u0395\u0393\u0395, \u03BA\u03B1\u03B8\u03CE\u03C2 \u03BA\u03B1\u03B9 \u03C3\u03B5 \u03AC\u03BB\u03BB\u03B5\u03C2 \u03B5\u03C0\u03B9\u03C3\u03C4\u03B7\u03BC\u03BF\u03BD\u03B9\u03BA\u03AD\u03C2 \u03B5\u03BA\u03B4\u03B7\u03BB\u03CE\u03C3\u03B5\u03B9\u03C2 \u03C3\u03C4\u03B9\u03C2 \u03BF\u03C0\u03BF\u03AF\u03B5\u03C2 \u03B7 \u0395\u0393\u0395 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03AD\u03C7\u03B5\u03B9",
      "\u0394\u03C9\u03C1\u03B5\u03AC\u03BD \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7 \u03B7\u03BC\u03B5\u03C1\u03AF\u03B4\u03C9\u03BD \u03BA\u03B1\u03B9 \u03B4\u03B9\u03B1\u03BB\u03AD\u03BE\u03B5\u03C9\u03BD \u03B3\u03B9\u03B1 \u03C0\u03C1\u03CC\u03C3\u03B2\u03B1\u03C3\u03B7 \u03C7\u03C9\u03C1\u03AF\u03C2 \u03B5\u03C0\u03B9\u03B2\u03AC\u03C1\u03C5\u03BD\u03C3\u03B7 \u03C3\u03C4\u03B9\u03C2 \u03B5\u03BD\u03B7\u03BC\u03B5\u03C1\u03C9\u03C4\u03B9\u03BA\u03AD\u03C2 \u03B7\u03BC\u03B5\u03C1\u03AF\u03B4\u03B5\u03C2 \u03BA\u03B1\u03B9 \u03B4\u03B9\u03B1\u03BB\u03AD\u03BE\u03B5\u03B9\u03C2 \u03C0\u03BF\u03C5 \u03B4\u03B9\u03BF\u03C1\u03B3\u03B1\u03BD\u03CE\u03BD\u03B5\u03B9 \u03B7 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1",
      "\u0394\u03B9\u03BA\u03B1\u03AF\u03C9\u03BC\u03B1 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03BF\u03C7\u03AE\u03C2 \u03C3\u03C4\u03B9\u03C2 \u03B5\u03BA\u03BB\u03BF\u03B3\u03B9\u03BA\u03AD\u03C2 \u03B4\u03B9\u03B1\u03B4\u03B9\u03BA\u03B1\u03C3\u03AF\u03B5\u03C2 \u03BA\u03B1\u03B9 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03AE \u03C3\u03C4\u03B7 \u03B4\u03B9\u03B1\u03BC\u03CC\u03C1\u03C6\u03C9\u03C3\u03B7 \u03C4\u03BF\u03C5 \u03BC\u03AD\u03BB\u03BB\u03BF\u03BD\u03C4\u03BF\u03C2 \u03C4\u03B7\u03C2 \u0395\u03C4\u03B1\u03B9\u03C1\u03B5\u03AF\u03B1\u03C2",
    ],
    bankTitle: "\u03A0\u03BB\u03B7\u03C1\u03BF\u03C6\u03BF\u03C1\u03AF\u03B5\u03C2 \u03A0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE\u03C2",
    bankIban: "IBAN",
    bankBic: "BIC / SWIFT",
    bankRef: "\u03A0\u03BB\u03B7\u03C1\u03BF\u03C6\u03BF\u03C1\u03AF\u03B5\u03C2 \u03B3\u03B9\u03B1 \u03C4\u03BF\u03BD \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03CD\u03C7\u03BF",
    bankRefValue: "\u03A3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AE \u0395\u0393\u0395 + \u03AD\u03C4\u03BF\u03C2",
    contactTitle: "\u0395\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03AF\u03B1",
    contactText: "\u0393\u03B9\u03B1 \u03BF\u03C0\u03BF\u03B9\u03B1\u03B4\u03AE\u03C0\u03BF\u03C4\u03B5 \u03B4\u03B9\u03B5\u03C5\u03BA\u03C1\u03AF\u03BD\u03B9\u03C3\u03B7 \u03AE \u03B1\u03C0\u03BF\u03C1\u03AF\u03B1, \u03BC\u03C0\u03BF\u03C1\u03B5\u03AF\u03C4\u03B5 \u03BD\u03B1 \u03B5\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03AE\u03C3\u03B5\u03C4\u03B5 \u03BC\u03B5 \u03C4\u03BF\u03BD \u03B3\u03C1\u03B1\u03BC\u03BC\u03B1\u03C4\u03AD\u03B1 \u03C4\u03B7\u03C2 \u0395\u0393\u0395 \u03C3\u03C4\u03BF:",
    thankYou: "\u03A3\u03B1\u03C2 \u03B5\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03BF\u03CD\u03BC\u03B5 \u03B8\u03B5\u03C1\u03BC\u03AC \u03B3\u03B9\u03B1 \u03C4\u03B7 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03BF\u03C7\u03AE \u03BA\u03B1\u03B9 \u03C4\u03B7 \u03C3\u03C5\u03BD\u03B5\u03C7\u03AE \u03C5\u03C0\u03BF\u03C3\u03C4\u03AE\u03C1\u03B9\u03BE\u03AE \u03C3\u03B1\u03C2.",
    thankYouClosing: "\u039C\u03B5 \u03C4\u03B7 \u03B4\u03B9\u03BA\u03AE \u03C3\u03B1\u03C2 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03AE, \u03B7 \u0395\u0393\u0395 \u03C3\u03C5\u03BD\u03B5\u03C7\u03AF\u03B6\u03B5\u03B9 \u03BD\u03B1 \u03C0\u03C1\u03BF\u03AC\u03B3\u03B5\u03B9 \u03C4\u03B7 \u03B3\u03B5\u03C9\u03B3\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03B5\u03C0\u03B9\u03C3\u03C4\u03AE\u03BC\u03B7 \u03BA\u03B1\u03B9 \u03BD\u03B1 \u03B5\u03BD\u03B4\u03C5\u03BD\u03B1\u03BC\u03CE\u03BD\u03B5\u03B9 \u03C4\u03B7\u03BD \u03B5\u03C0\u03B9\u03C3\u03C4\u03B7\u03BC\u03BF\u03BD\u03B9\u03BA\u03AE \u03BA\u03BF\u03B9\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1.",
  },
}

export default async function MembershipRegistrationPage({ params }: PageProps) {
  const { locale } = await params
  const validLocale = (locale === "el" ? "el" : "en") as Locale
  const t = pageText[validLocale]

  return (
    <>
      {/* Welcome */}
      <section className="relative pt-32 pb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black tracking-tight">
                {t.title}
              </h1>
            </div>
            <div className="max-w-3xl mx-auto space-y-4 text-black/70 leading-relaxed">
              {t.welcomeGreeting && <p className="font-medium text-black">{t.welcomeGreeting}</p>}
              <p>{t.welcomeBody}</p>
              <p>{t.welcomeInvite}</p>
              <p>{t.paymentInvite}</p>
              <p>{t.subscriptionNote}</p>
              <div className="pt-4">
                <p className="italic text-black/60">{t.closing}</p>
                <p className="font-medium text-black">{t.closingFrom}</p>
                <p className="text-black/60">{t.closingOrg}</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Fees + Benefits + Privileges */}
      <section className="py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView delay={0.1}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Fees */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black mb-4">{t.feesTitle}</h3>
                <p className="text-sm font-medium text-black/70 mb-3">{t.feesAnnual}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-black/5">
                    <span className="text-sm text-black/70">{t.feeResearch.split(":")[0]}</span>
                    <span className="text-sm font-semibold text-black">{t.feeResearch.split(":")[1]?.trim() || "\u20AC20"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-black/70">{t.feeStudent.split(":")[0]}</span>
                    <span className="text-sm font-semibold text-black">{t.feeStudent.split(":")[1]?.trim() || "\u20AC10"}</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-black mb-4">{t.benefitsTitle}</h3>
                <p className="text-sm text-black/60 mb-3">{t.benefitsIntro}</p>
                <ul className="space-y-2">
                  {t.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-black/70">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black/30 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeInView>

          {/* CTA */}
          <FadeInView delay={0.12}>
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm text-center space-y-2">
              <p className="text-sm font-semibold italic text-black/70">{t.cta1}</p>
              <p className="text-sm font-semibold italic text-black/70">{t.cta2}</p>
              <p className="text-sm font-semibold italic text-black/70">{t.cta3}</p>
            </div>
          </FadeInView>

          {/* Privileges */}
          <FadeInView delay={0.14}>
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-black mb-4">{t.privilegesTitle}</h3>
              <p className="text-sm text-black/60 mb-3">{t.privilegesIntro}</p>
              <ul className="space-y-2">
                {t.privileges.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-black/70">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black/30 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Registration Form + Bank Details */}
      <section className="py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView delay={0.16}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <MembershipForm locale={validLocale} />
              </div>

              {/* Bank Details */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-black mb-4">{t.bankTitle}</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/50">{t.bankIban}</span>
                      <span className="font-mono text-black/80 text-xs">{siteConfig.banking.iban}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50">{t.bankBic}</span>
                      <span className="font-mono text-black/80 text-xs">{siteConfig.banking.bic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50">{t.bankRef}</span>
                      <span className="text-black/80 text-xs font-medium">{t.bankRefValue}</span>
                    </div>
                  </div>
                </div>

                {/* Thank you note */}
                <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                  <p className="text-sm text-black/60 leading-relaxed">{t.thankYou}</p>
                  <p className="text-sm text-black/60 leading-relaxed mt-2">{t.thankYouClosing}</p>
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Contact */}
      <section className="py-6 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView delay={0.2}>
            <div className="p-8 rounded-2xl border border-black/10 bg-white shadow-sm text-center">
              <h3 className="text-xl font-semibold text-black mb-4">{t.contactTitle}</h3>
              <p className="text-black/60 mb-6">{t.contactText}</p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-full hover:bg-black/90 transition-all"
              >
                <Mail className="h-4 w-4" />
                {siteConfig.email}
              </a>
            </div>
          </FadeInView>
        </div>
      </section>
    </>
  )
}
