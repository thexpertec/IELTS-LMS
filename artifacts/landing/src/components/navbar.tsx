import { useState } from "react";
import { Link } from "wouter";
import { Search, Menu, X } from "lucide-react";

const RED = "#c8102e";
const NAVY = "#1f1646";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "For Academies", href: "#academies", isRoute: false },
    { label: "Features", href: "#features", isRoute: false },
    { label: "IELTS Tools", href: "#ielts-tools", isRoute: false },
    { label: "Pricing", href: "#pricing", isRoute: false },
    { label: "Blog", href: "/blog", isRoute: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── Utility strip ── */}
      <div style={{ backgroundColor: RED }} className="text-white">
        <div className="container mx-auto px-4 md:px-6 h-10 flex items-center justify-end gap-1">
          <a
            href="/lms/"
            className="text-xs font-semibold px-3 py-1 bg-white/20 hover:bg-white/30 rounded-sm transition-colors whitespace-nowrap"
          >
            Book a Demo
          </a>
          <a
            href="/lms/"
            className="text-xs font-medium px-3 py-1 hover:bg-white/15 rounded-sm transition-colors"
          >
            Log in
          </a>
          <button className="flex items-center gap-1 text-xs font-medium px-3 py-1 hover:bg-white/15 rounded-sm transition-colors">
            <Search className="w-3 h-3" />
            Search
          </button>
        </div>
      </div>

      {/* ── Main nav ── */}
      <div style={{ backgroundColor: NAVY }} className="shadow-lg">
        <div className="container mx-auto px-4 md:px-6 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
              style={{ backgroundColor: RED }}
            >
              O
            </div>
            <div className="hidden sm:block h-5 w-px bg-white/25" />
            <span className="hidden sm:block text-white font-bold text-base tracking-tight leading-none">
              OneSoft<br />
              <span className="text-white/60 font-normal text-[11px] tracking-widest uppercase">LMS Platform</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-stretch h-[60px]">
            {navLinks.map((l) => {
              const cls =
                "px-5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 border-b-2 border-transparent hover:border-white flex items-center transition-all duration-150";
              return l.isRoute ? (
                <Link key={l.label} href={l.href} className={cls}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} className={cls}>
                  {l.label}
                </a>
              );
            })}
          </nav>

          <button
            className="md:hidden p-2 text-white rounded hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div style={{ backgroundColor: NAVY }} className="md:hidden border-t border-white/10 px-4 pb-4 space-y-1">
          {navLinks.map((l) => {
            const cls =
              "block px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors";
            return l.isRoute ? (
              <Link key={l.label} href={l.href} className={cls} onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} className={cls} onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            );
          })}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <a href="/lms/" className="block px-3 py-2 text-sm font-medium text-white/80 text-center border border-white/20 rounded-sm">
              Log In
            </a>
            <a
              href="/lms/"
              className="block px-3 py-2 text-sm font-semibold text-white text-center rounded-sm"
              style={{ backgroundColor: RED }}
            >
              Book a Demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
