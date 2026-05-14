import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BookOpen, PenTool, Headphones, Mic, Home, Search,
  GraduationCap, Clock, FileText, LayoutGrid, Type, Users,
  ChevronRight,
} from "lucide-react";

/* ── BC color tokens ──────────────────────────────────────────────────────── */
const BC_RED   = "#C8102E";
const BC_NAVY  = "#1F1F6B";
const BC_BLUE  = "#009BDE";
const BC_CYAN  = "#3DBBDB";

/* ── Types ────────────────────────────────────────────────────────────────── */
interface PublicCourse {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  durationHours: number | null;
  instructor: string | null;
  imageUrl: string | null;
}

interface PublicTenantInfo {
  name: string;
  slug: string;
  logoUrl: string;
  tagline: string;
}

/* ── Category icons ───────────────────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  reading: BookOpen, writing: PenTool, listening: Headphones,
  speaking: Mic, grammar: FileText, vocabulary: Type, general: LayoutGrid,
};
function categoryIcon(cat: string | null): React.ElementType {
  if (!cat) return GraduationCap;
  const key = cat.toLowerCase().replace(/\s+/g, "");
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return GraduationCap;
}

/* ── Level badge colour ───────────────────────────────────────────────────── */
function levelColor(level: string | null) {
  if (!level) return { bg: "#F3F4F6", text: "#6B7280" };
  const l = level.toLowerCase();
  if (l === "advanced")     return { bg: "#FEE2E2", text: BC_RED };
  if (l === "intermediate") return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#D1FAE5", text: "#065F46" };
}

/* ── Category accent ──────────────────────────────────────────────────────── */
function categoryColor(cat: string | null) {
  if (!cat) return BC_BLUE;
  const k = cat.toLowerCase();
  if (k.includes("reading"))   return BC_BLUE;
  if (k.includes("writing"))   return BC_RED;
  if (k.includes("listening")) return BC_CYAN;
  if (k.includes("speaking"))  return "#6B2D8B";
  return BC_NAVY;
}

const navTabs = [
  { label: "Home",    href: "/" },
  { label: "Courses", href: "/courses-list", active: true },
  { label: "My Learning", href: "/student/dashboard" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PublicCourses() {
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const { data: tenant } = useQuery<PublicTenantInfo | null>({
    queryKey: ["tenant-public"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/public", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: courses = [], isLoading } = useQuery<PublicCourse[]>({
    queryKey: ["tenant-courses-public"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/courses", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const academyName = tenant?.name ?? "IELTS Academy";

  /* ── Derived ── */
  const categories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean))) as string[];

  const filtered = courses.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructor ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || c.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#333]">

      {/* ── Tier 1: Red utility bar ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: BC_RED }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-10 flex items-center justify-end gap-1">
          <a href="/lms/admin-login" className="px-3 py-1 text-white text-[13px] font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors">
            Admin Login
          </a>
          <Link href="/student/login" className="px-3 py-1 text-white text-[13px] font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors">
            Log in
          </Link>
        </div>
      </div>

      {/* ── Tier 2: Navy logo bar ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: BC_NAVY }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-[72px] flex items-center gap-4">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt={academyName} className="h-10 w-auto" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="grid grid-cols-3 gap-0.5 w-8 h-8 shrink-0">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[1px]" />
                ))}
              </div>
              <div className="w-px h-10 bg-white/30" />
            </div>
          )}
          <span className="text-white font-bold text-[26px] tracking-tight">{academyName}</span>
          <span className="text-white/40 text-[13px] self-end pb-1">™</span>
        </div>
      </div>

      {/* ── Tier 3: Bright blue nav bar ────────────────────────────────────── */}
      <div style={{ backgroundColor: BC_BLUE }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4">
          <nav className="flex items-stretch h-[44px]">
            <Link href="/" style={{ backgroundColor: BC_CYAN }} className="flex items-center justify-center w-12 shrink-0 hover:brightness-95 transition-all">
              <Home className="w-5 h-5 text-white" />
            </Link>
            {navTabs.map((tab, i) => (
              <Link
                key={i}
                href={tab.href}
                className="flex items-center px-4 h-full text-[13px] font-medium whitespace-nowrap border-l border-white/20 transition-colors"
                style={{
                  color: "white",
                  backgroundColor: tab.active ? "rgba(255,255,255,0.18)" : "transparent",
                }}
              >
                {tab.label}
                {tab.active && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-white inline-block" />}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Page header band ───────────────────────────────────────────────── */}
      <div style={{ backgroundColor: BC_NAVY }} className="py-10">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-white/50 text-[13px] mb-1">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="inline w-3 h-3 mx-1" />
                <span className="text-white">Courses</span>
              </p>
              <h1 className="text-white font-bold text-[30px] leading-tight">Our Courses</h1>
              <p className="text-white/60 text-[14px] mt-1">
                {courses.length > 0
                  ? `${courses.length} course${courses.length !== 1 ? "s" : ""} available from ${academyName}`
                  : `Browse all courses from ${academyName}`}
              </p>
            </div>

            {/* Search box */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/50" />
              <input
                type="search"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-white/10 border border-white/25 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-white/15"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="flex gap-8">

          {/* Sidebar filter */}
          {categories.length > 0 && (
            <aside className="hidden md:block w-52 shrink-0">
              <div className="sticky top-4">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: BC_NAVY }}>
                  Filter by category
                </p>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="text-left px-3 py-2 text-[13px] font-medium transition-colors"
                    style={{
                      backgroundColor: !activeCategory ? BC_BLUE + "18" : "transparent",
                      color: !activeCategory ? BC_BLUE : "#555",
                      borderLeft: !activeCategory ? `3px solid ${BC_BLUE}` : "3px solid transparent",
                    }}
                  >
                    All Courses ({courses.length})
                  </button>
                  {categories.map((cat) => {
                    const count = courses.filter((c) => c.category === cat).length;
                    const isActive = activeCategory === cat;
                    const color = categoryColor(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(isActive ? null : cat)}
                        className="text-left px-3 py-2 text-[13px] font-medium transition-colors"
                        style={{
                          backgroundColor: isActive ? color + "18" : "transparent",
                          color: isActive ? color : "#555",
                          borderLeft: isActive ? `3px solid ${color}` : "3px solid transparent",
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}

          {/* Course grid */}
          <div className="flex-1 min-w-0">

            {/* Mobile category pills */}
            {categories.length > 0 && (
              <div className="flex md:hidden flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="px-3 py-1 text-[12px] font-semibold rounded-full border transition-colors"
                  style={{
                    backgroundColor: !activeCategory ? BC_BLUE : "transparent",
                    color: !activeCategory ? "white" : "#555",
                    borderColor: !activeCategory ? BC_BLUE : "#D1D5DB",
                  }}
                >
                  All
                </button>
                {categories.map((cat) => {
                  const isActive = activeCategory === cat;
                  const color = categoryColor(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(isActive ? null : cat)}
                      className="px-3 py-1 text-[12px] font-semibold rounded-full border transition-colors"
                      style={{
                        backgroundColor: isActive ? color : "transparent",
                        color: isActive ? "white" : "#555",
                        borderColor: isActive ? color : "#D1D5DB",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading skeleton */}
            {isLoading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-40 bg-gray-200" />
                    <div className="p-4 space-y-2 bg-white border border-t-0 border-gray-100">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-gray-200">
                <BookOpen className="mx-auto w-12 h-12 text-gray-300 mb-4" />
                <h3 className="font-bold text-[16px] mb-2" style={{ color: BC_NAVY }}>
                  {search || activeCategory ? "No courses match your search" : "No courses published yet"}
                </h3>
                <p className="text-[14px] text-gray-500 mb-4">
                  {search || activeCategory
                    ? "Try adjusting your search or clearing the filter."
                    : "Check back soon — your academy will publish courses here."}
                </p>
                {(search || activeCategory) && (
                  <button
                    onClick={() => { setSearch(""); setActiveCategory(null); }}
                    className="px-5 py-2 text-[13px] font-semibold text-white"
                    style={{ backgroundColor: BC_RED }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Course cards — BC photo-card style */}
            {!isLoading && filtered.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((course) => {
                  const Icon = categoryIcon(course.category);
                  const accent = categoryColor(course.category);
                  const lvl = levelColor(course.level);

                  return (
                    <div key={course.id} className="group flex flex-col border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                      {/* Photo or coloured header */}
                      <div className="relative h-44 overflow-hidden">
                        {course.imageUrl ? (
                          <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: accent + "18" }}
                          >
                            <Icon className="w-14 h-14 opacity-20" style={{ color: accent }} />
                          </div>
                        )}
                        {/* Category pill overlay */}
                        {course.category && (
                          <span
                            className="absolute top-3 left-3 px-2.5 py-1 text-white text-[11px] font-bold uppercase tracking-wide"
                            style={{ backgroundColor: accent }}
                          >
                            {course.category}
                          </span>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="flex flex-col flex-1 p-5 border-t-2" style={{ borderTopColor: accent }}>
                        <h3 className="font-bold text-[15px] leading-snug mb-1" style={{ color: BC_NAVY }}>
                          {course.title}
                        </h3>
                        {course.instructor && (
                          <p className="text-[12px] text-gray-500 mb-3">by {course.instructor}</p>
                        )}
                        {course.description && (
                          <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2 mb-4 flex-1">
                            {course.description}
                          </p>
                        )}

                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {course.level && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold"
                              style={{ backgroundColor: lvl.bg, color: lvl.text }}
                            >
                              <GraduationCap className="w-3 h-3" />
                              {course.level}
                            </span>
                          )}
                          {course.durationHours && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-600">
                              <Clock className="w-3 h-3" />
                              {course.durationHours}h
                            </span>
                          )}
                        </div>

                        {/* CTA */}
                        <Link href={`/courses-list/${course.id}`}>
                          <button
                            className="w-full py-2.5 text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: BC_RED }}
                          >
                            View Course →
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: BC_NAVY }} className="mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {tenant?.logoUrl ? (
                <img src={tenant.logoUrl} alt={academyName} className="h-7 w-auto" />
              ) : (
                <div className="grid grid-cols-3 gap-0.5 w-5 h-5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[1px]" />
                  ))}
                </div>
              )}
              <span className="text-white font-bold text-[15px]">{academyName}</span>
            </div>
            <div className="flex gap-6">
              <Link href="/" className="text-white/60 hover:text-white text-[13px] transition-colors">Home</Link>
              <Link href="/student/login" className="text-white/60 hover:text-white text-[13px] transition-colors">Student Login</Link>
              <a href="/lms/admin-login" className="text-white/60 hover:text-white text-[13px] transition-colors">Admin Login</a>
            </div>
            <p className="text-white/35 text-[12px]">© {new Date().getFullYear()} {academyName}</p>
          </div>
        </div>
        <div style={{ backgroundColor: BC_RED }} className="h-1.5 w-full" />
      </footer>
    </div>
  );
}

import React from "react";
