"use client";

import { cn } from "@/lib/utils";

interface GeoPatternProps {
  className?: string;
  opacity?: number;
  variant?: "hero" | "section" | "full";
}

export function GeoPattern({ 
  className, 
  opacity = 0.08,
  variant = "section" 
}: GeoPatternProps) {
  return (
    <div 
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        variant === "hero" && "h-screen",
        variant === "section" && "h-full",
        variant === "full" && "min-h-screen",
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="geo-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity={opacity}
            />
          </pattern>
          <linearGradient id="fade-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="fade-mask">
            <rect width="100%" height="100%" fill="url(#fade-bottom)" />
          </mask>
        </defs>
        
        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#geo-grid)" mask="url(#fade-mask)" />
        
        {/* Abstract Greece Map Outline - Stylized */}
        <g 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1" 
          opacity={opacity * 1.5}
          className="text-white"
        >
          {/* Mainland stylized outline */}
          <path d="M 200 200 Q 250 180, 300 200 T 400 220 Q 450 250, 420 300 T 380 380 Q 350 420, 300 400 T 200 380 Q 160 350, 180 300 T 200 200" />
          
          {/* Peloponnese stylized */}
          <path d="M 220 400 Q 260 420, 280 460 T 260 520 Q 240 540, 200 520 T 180 460 Q 190 420, 220 400" />
          
          {/* Islands scattered - Aegean */}
          <ellipse cx="500" cy="280" rx="25" ry="15" transform="rotate(-20 500 280)" />
          <ellipse cx="550" cy="350" rx="20" ry="12" transform="rotate(10 550 350)" />
          <ellipse cx="480" cy="400" rx="18" ry="10" transform="rotate(-15 480 400)" />
          <ellipse cx="580" cy="420" rx="30" ry="18" transform="rotate(5 580 420)" />
          <ellipse cx="520" cy="480" rx="22" ry="14" transform="rotate(-10 520 480)" />
          
          {/* Crete */}
          <path d="M 280 580 Q 340 560, 420 570 T 520 580 Q 540 590, 520 600 T 420 610 Q 340 620, 280 600 Q 260 590, 280 580" />
          
          {/* Northern islands */}
          <ellipse cx="450" cy="180" rx="35" ry="20" transform="rotate(-5 450 180)" />
          <ellipse cx="520" cy="200" rx="25" ry="15" transform="rotate(15 520 200)" />
          
          {/* Latitude lines - geographic reference */}
          <path d="M 100 250 Q 400 240, 700 250" strokeDasharray="4,8" opacity={opacity} />
          <path d="M 100 350 Q 400 340, 700 350" strokeDasharray="4,8" opacity={opacity} />
          <path d="M 100 450 Q 400 440, 700 450" strokeDasharray="4,8" opacity={opacity} />
          
          {/* Longitude lines */}
          <path d="M 300 100 Q 310 400, 300 650" strokeDasharray="4,8" opacity={opacity} />
          <path d="M 450 100 Q 460 400, 450 650" strokeDasharray="4,8" opacity={opacity} />
          <path d="M 600 100 Q 610 400, 600 650" strokeDasharray="4,8" opacity={opacity} />
        </g>
        
        {/* Topographic contour lines */}
        <g 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          opacity={opacity * 0.8}
          className="text-white"
        >
          <circle cx="800" cy="300" r="80" />
          <circle cx="800" cy="300" r="100" />
          <circle cx="800" cy="300" r="120" />
          <circle cx="800" cy="300" r="140" />
          
          <circle cx="950" cy="500" r="60" />
          <circle cx="950" cy="500" r="80" />
          <circle cx="950" cy="500" r="100" />
        </g>
        
        {/* Compass rose hint */}
        <g 
          transform="translate(1050, 150)" 
          stroke="currentColor" 
          strokeWidth="1" 
          fill="none"
          opacity={opacity * 2}
          className="text-white"
        >
          <circle cx="0" cy="0" r="30" />
          <line x1="0" y1="-35" x2="0" y2="35" />
          <line x1="-35" y1="0" x2="35" y2="0" />
          <polygon points="0,-25 -5,-15 5,-15" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
