"use client";

import { useEffect, useRef } from "react";

/** Refresh restored/returning pages without discarding local form state. */
export function useRefreshOnReturn(refresh: () => void) {
  const lastRefresh = useRef(0);

  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      // Switching tabs commonly fires both visibilitychange and focus.
      if (now - lastRefresh.current < 1000) return;
      lastRefresh.current = now;
      refresh();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) onReturn();
    };

    window.addEventListener("focus", onReturn);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("focus", onReturn);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [refresh]);
}
