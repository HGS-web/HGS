"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation, type NavItem } from "@/config/navigation";
import { siteConfig, type Locale } from "@/config/site";

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = navigation[locale];
  const otherLocale = locale === "en" ? "el" : "en";
  const localePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/90 backdrop-blur-md border-b border-black/10"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden transition-transform group-hover:scale-105">
              <Image
                src="/Logo_EGE.png"
                alt={siteConfig.shortName[locale]}
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="hidden sm:block text-sm font-medium text-black/90 group-hover:text-black transition-colors">
              {siteConfig.shortName[locale]}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItemComponent
                key={item.label}
                item={item}
                isOpen={openDropdown === item.label}
                onOpenChange={(open) => setOpenDropdown(open ? item.label : null)}
              />
            ))}
          </div>

          {/* Right side: Language + Mobile menu */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <Link
              href={localePath || `/${otherLocale}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-black/70 hover:text-black hover:bg-black/5 transition-all"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{otherLocale}</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-black/70 hover:text-black hover:bg-black/5 transition-all"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-md border-b border-black/10"
          >
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <MobileNavItem
                  key={item.label}
                  item={item}
                  onItemClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavItemComponent({
  item,
  isOpen,
  onOpenChange,
}: {
  item: NavItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (item.children) onOpenChange(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onOpenChange(false);
    }, 150);
  };

  if (!item.children) {
    return (
      <Link
        href={item.href || "#"}
        className="px-3 py-2 text-sm font-medium text-black/70 hover:text-black transition-colors rounded-lg hover:bg-black/5"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          isOpen
            ? "text-black bg-black/5"
            : "text-black/70 hover:text-black hover:bg-black/5"
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[200px] rounded-xl bg-white/95 backdrop-blur-md border border-black/10 shadow-xl overflow-hidden"
          >
            <div className="py-2">
              {item.children.map((child) => (
                <Link
                  key={child.label}
                  href={child.href || "#"}
                  className="block px-4 py-2 text-sm text-black/70 hover:text-black hover:bg-black/5 transition-colors"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNavItem({
  item,
  onItemClick,
}: {
  item: NavItem;
  onItemClick: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!item.children) {
    return (
      <Link
        href={item.href || "#"}
        onClick={onItemClick}
        className="block px-3 py-2 text-base font-medium text-black/80 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-base font-medium text-black/80 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
      >
        {item.label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-4 mt-1 space-y-1"
          >
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href || "#"}
                onClick={onItemClick}
                className="block px-3 py-2 text-sm text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
