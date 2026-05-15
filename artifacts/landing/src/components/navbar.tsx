import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap, ChevronDown } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Courses", href: "/courses", isRoute: true },
    { label: "IELTS Modules", href: "#modules", isRoute: false },
    { label: "Pricing", href: "#pricing", isRoute: false },
    { label: "Resources", href: "#resources", isRoute: false },
    { label: "Blog", href: "/blog", isRoute: true },
  ];

  const linkClass = "px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all";
  const mobileLinkClass = "block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/97 backdrop-blur-md border-b border-slate-100 shadow-sm"
          : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-300">
            <GraduationCap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-[1.05rem] tracking-tight text-slate-900">OneSoft <span className="text-indigo-600">IELTS</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) =>
            l.isRoute ? (
              <Link key={l.label} href={l.href} className={linkClass}>{l.label}</Link>
            ) : (
              <a key={l.label} href={l.href} className={linkClass}>{l.label}</a>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="/lms/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-2">
            Sign In
          </a>
          <Button asChild className="rounded-lg px-5 h-9 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200">
            <a href="/lms/">Start Free →</a>
          </Button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pb-4 space-y-1">
          {links.map((l) =>
            l.isRoute ? (
              <Link key={l.label} href={l.href} className={mobileLinkClass} onClick={() => setMobileOpen(false)}>{l.label}</Link>
            ) : (
              <a key={l.label} href={l.href} className={mobileLinkClass} onClick={() => setMobileOpen(false)}>{l.label}</a>
            )
          )}
          <div className="pt-2 flex flex-col gap-2">
            <a href="/lms/" className="block px-3 py-2.5 text-sm font-medium text-center border border-slate-200 rounded-lg text-slate-700">Sign In</a>
            <a href="/lms/" className="block px-3 py-2.5 text-sm font-semibold text-center bg-indigo-600 text-white rounded-lg">Start Free Trial</a>
          </div>
        </div>
      )}
    </header>
  );
}
