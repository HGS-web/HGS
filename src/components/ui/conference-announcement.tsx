"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Locale } from "@/config/site";

const announcementText = {
  en: {
    badge: "Coming Soon",
    title: "13th International Conference",
    subtitle: "of the Hellenic Geographical Society",
    date: "2026",
    cta: "Learn More",
    dismiss: "Dismiss",
  },
  el: {
    badge: "Έρχεται",
    title: "13ο Διεθνές Συνέδριο",
    subtitle: "της Ελληνικής Γεωγραφικής Εταιρείας",
    date: "2026",
    cta: "Περισσότερα",
    dismiss: "Κλείσιμο",
  },
};

interface ConferenceAnnouncementProps {
  locale: Locale;
}

export function ConferenceAnnouncement({ locale }: ConferenceAnnouncementProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const t = announcementText[locale];

  useEffect(() => {
    // Show after a short delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/10">
            {/* Decorative gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black/20 via-black/40 to-black/20" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors"
              aria-label={t.dismiss}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-5 pr-10">
              {/* Badge with year */}
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black/60"></span>
                </span>
                <span className="text-xs font-medium text-black/60 uppercase tracking-wider">
                  {t.badge}
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-black/10 text-black/80 rounded-full">
                  {t.date}
                </span>
              </div>

              {/* Content */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-black leading-tight">
                  {t.title}
                </h3>
                <p className="text-sm text-black/60 mt-0.5">
                  {t.subtitle}
                </p>
              </div>

              {/* CTA */}
              <Link
                href={`/${locale}/conference2026`}
                onClick={handleDismiss}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-black/90 transition-all group"
              >
                {t.cta}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
