"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/config/site";

const VISIT_ENDPOINT = "https://evelpidou.nkua.cloud/api/visits/hgs";
const VISIT_STORAGE_KEY = "hgs-visit-counted-v1";

const visitText: Record<Locale, { label: string; note: string; numberLocale: string }> = {
  en: {
    label: "Recorded page visits",
    note: "The counter does not use cookies or collect information that can identify individual visitors. Only the aggregate visit count is stored.",
    numberLocale: "en-GB",
  },
  el: {
    label: "Καταγεγραμμένες επισκέψεις σελίδας",
    note: "Ο μετρητής δεν χρησιμοποιεί cookies και δεν συλλέγει πληροφορίες που μπορούν να ταυτοποιήσουν επισκέπτες. Αποθηκεύεται μόνο ο συνολικός αριθμός επισκέψεων.",
    numberLocale: "el-GR",
  },
};

interface VisitCountProps {
  locale: Locale;
}

// The number of recorded page visits of the site. A browser session is counted once: its first
// request records the visit (POST), later requests only read the total (GET). The counter uses no
// cookies and stores only the total. The dash stays when the counter cannot be reached.
export function VisitCount({ locale }: VisitCountProps) {
  const [count, setCount] = useState<number | null>(null);
  const t = visitText[locale];

  useEffect(() => {
    let active = true;
    let counted = false;
    try {
      counted = window.sessionStorage.getItem(VISIT_STORAGE_KEY) === "yes";
    } catch {
      counted = false;
    }

    fetch(VISIT_ENDPOINT, {
      method: counted ? "GET" : "POST",
      cache: "no-store",
      credentials: "omit",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload: { count?: unknown }) => {
        const total = Number(payload.count);
        if (!Number.isFinite(total) || total < 0) throw new Error("Invalid visit count");
        if (!counted) {
          try {
            window.sessionStorage.setItem(VISIT_STORAGE_KEY, "yes");
          } catch {
            // The counter still works when browser storage is unavailable.
          }
        }
        if (active) setCount(total);
      })
      .catch(() => {
        // The dash stays when the counter cannot be reached.
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <p
        className="text-xs text-black/40"
        role="status"
        aria-live="polite"
        aria-describedby="visit-count-note"
      >
        {t.label}{" "}
        <span className="tabular-nums">
          {count === null ? "—" : count.toLocaleString(t.numberLocale)}
        </span>
      </p>
      <span id="visit-count-note" className="sr-only">
        {t.note}
      </span>
    </>
  );
}
