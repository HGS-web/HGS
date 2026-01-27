"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface GeoPatternProps {
  className?: string;
  fixed?: boolean;
}

export function GeoPattern({
  className,
  fixed = false
}: GeoPatternProps) {
  return (
    <div
      className={cn(
        "pointer-events-none overflow-hidden",
        fixed ? "fixed inset-0 z-0" : "absolute inset-0",
        className
      )}
      aria-hidden="true"
    >
      {/* Subtle grid pattern */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="geo-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-black"
              opacity={0.03}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geo-grid)" />
      </svg>

      {/* Main Greece map - centered, fixed in viewport */}
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="relative w-[110%] h-[110%] translate-y-[5%]">
          <Image
            src="/greece-map.svg"
            alt=""
            fill
            className="object-contain"
            style={{
              filter: `grayscale(100%) contrast(0.6)`,
              opacity: 0.20
            }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
