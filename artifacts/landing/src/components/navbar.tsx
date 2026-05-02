import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "For Academies", href: "#academies" },
    { label: "Features", href: "#features" },
    { label: "IELTS Tools", href: "#ielts-tools" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-primary/30">
            O
          </div>
          <span className="font-bold text-[1.05rem] tracking-tight text-foreground">OneSoft LMS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-gray-50 transition-all"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="/lms/" className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2">
            Sign In
          </a>
          <Button asChild className="rounded-lg px-5 h-9 text-sm font-semibold shadow-sm shadow-primary/20">
            <a href="/lms/">Book a Demo →</a>
          </Button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pb-4 space-y-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <a href="/lms/" className="block px-3 py-2.5 text-sm font-medium text-center border border-gray-200 rounded-lg">Sign In</a>
            <a href="/lms/" className="block px-3 py-2.5 text-sm font-semibold text-center bg-primary text-white rounded-lg">Book a Demo</a>
          </div>
        </div>
      )}
    </header>
  );
}
