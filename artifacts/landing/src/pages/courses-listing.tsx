import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import {
  Star, Users, BookOpen, Clock, Award, Play, Heart, BarChart2,
  Search, SlidersHorizontal, LayoutGrid, List, ChevronDown,
  CheckCircle2, X, Filter, Zap, Mic, PenTool, Headphones,
  Brain, BookMarked, TrendingUp, ArrowRight,
} from "lucide-react";

/* ─── DATA ────────────────────────────────────────────────────────── */

const ALL_COURSES = [
  {
    id: 1,
    title: "IELTS Academic Complete Course — Band 7 Guarantee",
    instructor: "Dr. Sarah Mitchell",
    instructorRole: "Ex-IELTS Examiner, Cambridge",
    rating: 4.9, reviews: 2847, students: 18420, lessons: 94, duration: "48h",
    price: 129, originalPrice: 299,
    badge: "Bestseller", badgeColor: "bg-amber-400 text-amber-900",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=480&q=80",
    tags: ["Academic", "All Levels"], module: "All Modules",
    bandTarget: "7.0+", type: "Full Course", level: "All Levels",
    hasCert: true, hasAI: true, isFree: false, isNew: false,
    desc: "Comprehensive IELTS preparation covering all 4 skills. Includes 4 full mock tests, AI essay grading, and weekly live sessions with an ex-examiner.",
  },
  {
    id: 2,
    title: "IELTS Writing Masterclass — Task 1 & Task 2",
    instructor: "Prof. James Chen",
    instructorRole: "Band 9 Writing Coach",
    rating: 4.8, reviews: 1632, students: 9801, lessons: 48, duration: "22h",
    price: 79, originalPrice: 179,
    badge: "Top Rated", badgeColor: "bg-indigo-500 text-white",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=480&q=80",
    tags: ["Writing", "Intermediate"], module: "Writing",
    bandTarget: "7.0+", type: "Module Course", level: "Intermediate",
    hasCert: true, hasAI: true, isFree: false, isNew: false,
    desc: "Deep-dive into IELTS Writing Task 1 (graphs, charts, maps) and Task 2 (essays). AI scores every submission against the official 4-criteria band descriptors.",
  },
  {
    id: 3,
    title: "Speaking Band 7+ — 30-Day Intensive Program",
    instructor: "Emma Watson",
    instructorRole: "IELTS Speaking Specialist",
    rating: 4.9, reviews: 984, students: 5632, lessons: 36, duration: "18h",
    price: 69, originalPrice: 149,
    badge: "New", badgeColor: "bg-emerald-500 text-white",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=480&q=80",
    tags: ["Speaking", "All Levels"], module: "Speaking",
    bandTarget: "7.0+", type: "Module Course", level: "All Levels",
    hasCert: false, hasAI: true, isFree: false, isNew: true,
    desc: "200+ cue card topics, Part 1/2/3 strategies, fluency drills, and pronunciation improvement. Practice with AI speaking assessment.",
  },
  {
    id: 4,
    title: "IELTS General Training — Visa & Migration Focus",
    instructor: "Michael Torres",
    instructorRole: "Migration Consultant & IELTS Tutor",
    rating: 4.7, reviews: 742, students: 4210, lessons: 56, duration: "28h",
    price: 89, originalPrice: 199,
    badge: "Popular", badgeColor: "bg-rose-500 text-white",
    image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=480&q=80",
    tags: ["General", "All Levels"], module: "All Modules",
    bandTarget: "6.0+", type: "Full Course", level: "All Levels",
    hasCert: true, hasAI: false, isFree: false, isNew: false,
    desc: "Tailored for students targeting Australian, Canadian, UK or New Zealand migration. Focuses on General Training Reading and Letter Writing.",
  },
  {
    id: 5,
    title: "IELTS Listening — Strategies for Band 8",
    instructor: "Dr. Aisha Patel",
    instructorRole: "Listening & Pronunciation Expert",
    rating: 4.8, reviews: 531, students: 3204, lessons: 28, duration: "14h",
    price: 59, originalPrice: 129,
    badge: "", badgeColor: "",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=480&q=80",
    tags: ["Listening"], module: "Listening",
    bandTarget: "7.5+", type: "Module Course", level: "Intermediate",
    hasCert: true, hasAI: false, isFree: false, isNew: false,
    desc: "All 4 sections of IELTS Listening with 100+ practice exercises, note-taking strategies, and accent diversity training.",
  },
  {
    id: 6,
    title: "IELTS Academic Vocabulary — 3000 Essential Words",
    instructor: "Prof. Liu Wei",
    instructorRole: "Computational Linguistics PhD",
    rating: 4.6, reviews: 418, students: 7890, lessons: 22, duration: "10h",
    price: 0, originalPrice: 0,
    badge: "Free", badgeColor: "bg-emerald-500 text-white",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=480&q=80",
    tags: ["Vocabulary", "Free"], module: "Vocabulary",
    bandTarget: "All Bands", type: "Free Course", level: "All Levels",
    hasCert: false, hasAI: false, isFree: true, isNew: false,
    desc: "The complete Academic Word List, topic vocabulary banks, and collocations — organised by IELTS exam themes.",
  },
  {
    id: 7,
    title: "IELTS Reading — True/False/NG & Heading Match Mastery",
    instructor: "Rachel Kim",
    instructorRole: "Reading Strategies Coach",
    rating: 4.7, reviews: 623, students: 4190, lessons: 30, duration: "16h",
    price: 59, originalPrice: 119,
    badge: "", badgeColor: "",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=480&q=80",
    tags: ["Reading"], module: "Reading",
    bandTarget: "7.0+", type: "Module Course", level: "Intermediate",
    hasCert: true, hasAI: false, isFree: false, isNew: false,
    desc: "Targeted practice for every Reading question type. Skimming, scanning, and inference strategies to maximize your score.",
  },
  {
    id: 8,
    title: "IELTS Grammar Intensive — From Band 5 to Band 7",
    instructor: "Dr. Thomas Berg",
    instructorRole: "Applied Linguistics Expert",
    rating: 4.5, reviews: 392, students: 2840, lessons: 20, duration: "12h",
    price: 49, originalPrice: 99,
    badge: "", badgeColor: "",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=480&q=80",
    tags: ["Grammar", "Beginner+"], module: "Grammar",
    bandTarget: "6.0+", type: "Module Course", level: "Beginner",
    hasCert: false, hasAI: false, isFree: false, isNew: true,
    desc: "Fix the grammar mistakes that cost IELTS students marks. Complex sentences, tenses, articles, and IELTS-specific error patterns.",
  },
];

const BAND_TARGETS = ["All Bands", "6.0+", "7.0+", "7.5+"];
const COURSE_TYPES = ["Full Course", "Module Course", "Free Course"];
const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const MODULES = ["All Modules", "Listening", "Reading", "Writing", "Speaking", "Grammar", "Vocabulary"];
const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "rated", label: "Highest Rated" },
  { value: "price_asc", label: "Lowest Price" },
  { value: "price_desc", label: "Highest Price" },
  { value: "newest", label: "Newest" },
];

type Course = typeof ALL_COURSES[0];

/* ─── COMPONENTS ──────────────────────────────────────────────────── */

function StarRating({ rating, reviews, size = "sm" }: { rating: number; reviews: number; size?: "xs" | "sm" }) {
  const s = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn(s, n <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
        ))}
      </div>
      <span className="text-xs font-bold text-amber-600">{rating}</span>
      <span className="text-xs text-slate-400">({reviews.toLocaleString()})</span>
    </div>
  );
}

function CourseGridCard({ course, wishlist, onWishlist }: { course: Course; wishlist: Set<number>; onWishlist: (id: number) => void }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative overflow-hidden aspect-video">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-indigo-600 fill-indigo-600 ml-0.5" />
          </div>
        </div>
        {course.badge && (
          <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold", course.badgeColor)}>{course.badge}</span>
        )}
        <button
          onClick={() => onWishlist(course.id)}
          className={cn("absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all",
            wishlist.has(course.id) ? "bg-rose-500 text-white" : "bg-white/90 text-slate-400 hover:text-rose-500")}
        >
          <Heart className={cn("w-4 h-4", wishlist.has(course.id) && "fill-white")} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex gap-1.5 mb-2">
          {course.hasAI && (
            <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-100 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> AI Feedback
            </span>
          )}
          {course.hasCert && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100 flex items-center gap-1">
              <Award className="w-2.5 h-2.5" /> Certificate
            </span>
          )}
        </div>

        <h3 className="font-semibold text-sm text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">{course.title}</h3>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
            {course.instructor[0]}
          </div>
          <p className="text-xs text-slate-500 truncate">{course.instructor}</p>
        </div>

        <StarRating rating={course.rating} reviews={course.reviews} />

        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students.toLocaleString()}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons} lessons</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            {course.isFree ? (
              <span className="text-lg font-bold text-emerald-600">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold text-slate-900">${course.price}</span>
                {course.originalPrice > course.price && (
                  <span className="text-xs text-slate-400 line-through">${course.originalPrice}</span>
                )}
              </>
            )}
          </div>
          <a href="/lms/" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
            Enroll
          </a>
        </div>
      </div>
    </div>
  );
}

function CourseListCard({ course, wishlist, onWishlist }: { course: Course; wishlist: Set<number>; onWishlist: (id: number) => void }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-0 overflow-hidden">
      <div className="relative w-48 md:w-56 flex-shrink-0 overflow-hidden">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {course.badge && (
          <span className={cn("absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold", course.badgeColor)}>{course.badge}</span>
        )}
      </div>

      <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 mb-1.5">
            {course.hasAI && (
              <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-100 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> AI Feedback
              </span>
            )}
            {course.hasCert && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100 flex items-center gap-1">
                <Award className="w-2.5 h-2.5" /> Certificate
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">{course.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">{course.desc}</p>
          <p className="text-xs text-slate-500 mb-2">{course.instructor} · <span className="text-slate-400">{course.instructorRole}</span></p>
          <StarRating rating={course.rating} reviews={course.reviews} />
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students.toLocaleString()} students</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons} lessons</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 flex-shrink-0">
          <div className="text-right">
            {course.isFree ? (
              <p className="text-xl font-extrabold text-emerald-600">Free</p>
            ) : (
              <>
                <p className="text-xl font-extrabold text-slate-900">${course.price}</p>
                {course.originalPrice > course.price && (
                  <p className="text-xs text-slate-400 line-through">${course.originalPrice}</p>
                )}
              </>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <a href="/lms/" className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors whitespace-nowrap">
              Enroll Now
            </a>
            <button
              onClick={() => onWishlist(course.id)}
              className={cn("px-5 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5",
                wishlist.has(course.id) ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-600 hover:border-slate-300")}
            >
              <Heart className={cn("w-3.5 h-3.5", wishlist.has(course.id) && "fill-rose-500 text-rose-500")} />
              {wishlist.has(course.id) ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
          checked ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400")}
        onClick={onChange}
      >
        {checked && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
      </div>
      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
  );
}

/* ─── PAGE ────────────────────────────────────────────────────────── */

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState({
    bandTarget: [] as string[],
    type: [] as string[],
    level: [] as string[],
    module: [] as string[],
    freeOnly: false,
    hasCert: false,
    hasAI: false,
  });

  function toggleWishlist(id: number) {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleFilter(key: keyof typeof filters, value: string) {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function clearFilters() {
    setFilters({ bandTarget: [], type: [], level: [], module: [], freeOnly: false, hasCert: false, hasAI: false });
    setSearch("");
  }

  const filtered = useMemo(() => {
    let results = ALL_COURSES.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.instructor.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.bandTarget.length && !filters.bandTarget.includes(c.bandTarget)) return false;
      if (filters.type.length && !filters.type.includes(c.type)) return false;
      if (filters.level.length && !filters.level.includes(c.level)) return false;
      if (filters.module.length && !filters.module.includes(c.module)) return false;
      if (filters.freeOnly && !c.isFree) return false;
      if (filters.hasCert && !c.hasCert) return false;
      if (filters.hasAI && !c.hasAI) return false;
      return true;
    });

    switch (sort) {
      case "popular": results.sort((a, b) => b.students - a.students); break;
      case "rated": results.sort((a, b) => b.rating - a.rating); break;
      case "price_asc": results.sort((a, b) => a.price - b.price); break;
      case "price_desc": results.sort((a, b) => b.price - a.price); break;
      case "newest": results.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    }
    return results;
  }, [search, sort, filters]);

  const activeFilterCount = filters.bandTarget.length + filters.type.length + filters.level.length + filters.module.length
    + (filters.freeOnly ? 1 : 0) + (filters.hasCert ? 1 : 0) + (filters.hasAI ? 1 : 0);

  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Quick filters */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Quick Filters</h4>
        <div className="space-y-2">
          <FilterCheckbox label="Free Courses Only" checked={filters.freeOnly} onChange={() => setFilters((f) => ({ ...f, freeOnly: !f.freeOnly }))} />
          <FilterCheckbox label="AI Feedback" checked={filters.hasAI} onChange={() => setFilters((f) => ({ ...f, hasAI: !f.hasAI }))} />
          <FilterCheckbox label="Certificate Included" checked={filters.hasCert} onChange={() => setFilters((f) => ({ ...f, hasCert: !f.hasCert }))} />
        </div>
      </div>

      {/* Band Target */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Target Band Score</h4>
        <div className="space-y-2">
          {BAND_TARGETS.map((b) => (
            <FilterCheckbox key={b} label={b} checked={filters.bandTarget.includes(b)} onChange={() => toggleFilter("bandTarget", b)} />
          ))}
        </div>
      </div>

      {/* IELTS Module */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">IELTS Module</h4>
        <div className="space-y-2">
          {MODULES.map((m) => (
            <FilterCheckbox key={m} label={m} checked={filters.module.includes(m)} onChange={() => toggleFilter("module", m)} />
          ))}
        </div>
      </div>

      {/* Course Type */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Course Type</h4>
        <div className="space-y-2">
          {COURSE_TYPES.map((t) => (
            <FilterCheckbox key={t} label={t} checked={filters.type.includes(t)} onChange={() => toggleFilter("type", t)} />
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-3">Difficulty Level</h4>
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <FilterCheckbox key={l} label={l} checked={filters.level.includes(l)} onChange={() => toggleFilter("level", l)} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── HERO STRIP ── */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 pt-20">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-4">
              <TrendingUp className="w-3.5 h-3.5" /> 8 Expert-Led Courses Available
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">IELTS Preparation Courses</h1>
            <p className="text-indigo-200 text-lg mb-6">From Band 6 to Band 8 — find the course that fits your target score, learning style, and schedule.</p>

            {/* Search bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses, instructors, topics…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-slate-900 text-sm placeholder:text-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex gap-8">

          {/* ── SIDEBAR ── */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Filters
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-indigo-600 font-semibold hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <SidebarContent />
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500">
                  <span className="font-bold text-slate-900">{filtered.length}</span> courses found
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* View toggle */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn("p-2 transition-colors", viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600")}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {filters.freeOnly && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                    Free Only
                    <button onClick={() => setFilters((f) => ({ ...f, freeOnly: false }))} className="ml-1"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.hasAI && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                    AI Feedback
                    <button onClick={() => setFilters((f) => ({ ...f, hasAI: false }))} className="ml-1"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.hasCert && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                    Certificate
                    <button onClick={() => setFilters((f) => ({ ...f, hasCert: false }))} className="ml-1"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {[...filters.bandTarget, ...filters.type, ...filters.level, ...filters.module].map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                    {tag}
                    <button
                      onClick={() => {
                        ["bandTarget", "type", "level", "module"].forEach((key) => {
                          if ((filters[key as keyof typeof filters] as string[]).includes(tag)) {
                            toggleFilter(key as keyof typeof filters, tag);
                          }
                        });
                      }}
                      className="ml-1"
                    ><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Course grid / list */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                <Search className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">No courses found</h3>
                <p className="text-slate-400 text-sm mb-5">Try adjusting your filters or search term.</p>
                <button onClick={clearFilters} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((course) => (
                  <CourseGridCard key={course.id} course={course} wishlist={wishlist} onWishlist={toggleWishlist} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((course) => (
                  <CourseListCard key={course.id} course={course} wishlist={wishlist} onWishlist={toggleWishlist} />
                ))}
              </div>
            )}

            {/* Wishlist summary */}
            {wishlist.size > 0 && (
              <div className="mt-8 p-5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span className="font-semibold text-slate-900 text-sm">{wishlist.size} course{wishlist.size > 1 ? "s" : ""} in your wishlist</span>
                </div>
                <a href="/lms/" className="px-5 py-2 rounded-lg bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors">
                  View Wishlist
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE FILTER BUTTON ── */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-300"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-indigo-700 text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── MOBILE FILTER DRAWER ── */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative ml-auto w-80 max-w-full bg-white h-full overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Filters
              </h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <SidebarContent />
            <div className="mt-8 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
              >
                Show {filtered.length} Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA STRIP ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 mt-12">
        <div className="container mx-auto px-4 md:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-extrabold text-white mb-1">Not sure which course to start?</h3>
            <p className="text-indigo-200 text-sm">Take our free 10-minute IELTS diagnostic test and get a personalised course recommendation.</p>
          </div>
          <a href="/lms/" className="whitespace-nowrap px-7 py-3 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg">
            Take Free Diagnostic <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
