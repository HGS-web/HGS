"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRefreshOnReturn } from "@/hooks/use-refresh-on-return";

export function PageFreshness() {
  const router = useRouter();
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const refresh = useCallback(() => router.refresh(), [router]);

  useRefreshOnReturn(refresh);

  useEffect(() => {
    // Next also restores page segments on back/forward navigation.
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      refresh();
    }
  }, [pathname, refresh]);

  return null;
}
