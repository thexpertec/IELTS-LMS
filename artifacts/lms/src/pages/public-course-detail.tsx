import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import {
  BookOpen, PenTool, Headphones, Mic, Home, GraduationCap, Clock,
  FileText, LayoutGrid, Type, Users, ChevronRight, ChevronDown,
  ChevronUp, Play, Volume2, Image, HelpCircle, CheckCircle2,
  BookMarked, AlertCircle, BadgeCheck, UserCheck, CalendarDays,
} from "lucide-react";

/* ── BC color tokens ──────────────────────────────────────────────────────── */
const BC_RED   = "#C8102E";
const BC_NAVY  = "#1F1F6B";
const BC_BLUE  = "#009BDE";
const BC_CYAN  = "#3DBBDB";

/* ── Types ────────────────────────────────────────────────────────────────── */
interface PublicLesson {
  id: number;
  chapterId: number | null;
  title: string;
  lessonType: string;
  durationMinutes: number | null;
  order: number;
}

interface PublicChapter {
  id: number;
  title: string;
  order: number;
  lessons: PublicLesson[];
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  durationHours: number | null;
  instructor: string;
  imageUrl: string | null;
  enrollmentType: string;
  price: number | null;
  currency: string;
  maxStudents: number | null;
  whatYouLearn: string[];
  prerequisites: string;
  enrolledCount: number;
  curriculum: PublicChapter[];
}

interface PublicTenantInfo {
  name: string;
  slug: string;
  logoUrl: string;
  tagline: string;
}

/* ── helpers ──────────────────────────────────────────────────────────────── */
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
function categoryColor(cat: string | null) {
  if (!cat) return BC_BLUE;
  const k = cat.toLowerCase();
  if (k.includes("reading"))   return BC_BLUE;
  if (k.includes("writing"))   return BC_RED;
  if (k.includes("listening")) return BC_CYAN;
  if (k.includes("speaking"))  return "#6B2D8B";
  return BC_NAVY;
}
function levelColor(level: string | null) {
  if (!level) return { bg: "#F3F4F6", text: "#6B7280" };
  const l = level.toLowerCase();
  if (l === "advanced")     return { bg: "#FEE2E2", text: BC_RED };
  if (l === "intermediate") return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#D1FAE5", text: "#065F46" };
}
const LESSON_TYPE_ICON: Record<string, React.ElementType> = {
  reading: BookOpen, writing: PenTool, listening: Volume2, speaking: Mic,
  video: Play, quiz: HelpCircle, image: Image,
};
function lessonIcon(type: string) {
  return LESSON_TYPE_ICON[type.toLowerCase()] ?? FileText;
}
function formatCurrency(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

const navTabs = [
  { label: "Home",        href: "/" },
  { label: "Courses",     href: "/courses-list", active: true },
  { label: "My Learning", href: "/student/dashboard" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PublicCourseDetail() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});
  const [regName, setRegName]   = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDone, setRegDone]   = useState(false);
  const [regError, setRegError] = useState("");

  const { data: tenant } = useQuery<PublicTenantInfo | null>({
    queryKey: ["tenant-public"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/public", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: course, isLoading, isError } = useQuery<CourseDetail>({
    queryKey: ["public-course-detail", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/tenant/courses/${courseId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Course not found");
      return res.json();
    },
    enabled: !!courseId,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tenant/register-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId: Number(courseId), name: regName, email: regEmail, phone: regPhone }),
      });
      if (!res.ok) throw new Error("Registration failed");
      return res.json();
    },
    onSuccess: () => { setRegDone(true); setRegError(""); },
    onError:   () => setRegError("Something went wrong. Please try again."),
  });

  const academyName = tenant?.name ?? "IELTS Academy";

  function toggleChapter(id: number) {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const totalLessons = course?.curriculum.reduce((s, ch) => s + ch.lessons.length, 0) ?? 0;
  const accent = course ? categoryColor(course.category) : BC_BLUE;
  const lvl    = course ? levelColor(course.level)       : { bg: "#F3F4F6", text: "#6B7280" };
  const Icon   = course ? categoryIcon(course.category)  : GraduationCap;

  /* ── Loading / error ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }
  if (isError || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto w-10 h-10 text-red-400 mb-3" />
          <h2 className="font-bold text-lg" style={{ color: BC_NAVY }}>Course not found</h2>
          <Link href="/courses-list" className="mt-4 inline-block text-sm underline" style={{ color: BC_BLUE }}>
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

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

      {/* ── Tier 3: Blue nav bar ────────────────────────────────────────────── */}
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
                style={{ color: "white", backgroundColor: tab.active ? "rgba(255,255,255,0.18)" : "transparent" }}
              >
                {tab.label}
                {tab.active && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-white inline-block" />}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Breadcrumb + hero banner ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: BC_NAVY }} className="relative overflow-hidden">
        {course.imageUrl && (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        <div className="relative max-w-screen-xl mx-auto px-4 md:px-8 py-10">
          {/* Breadcrumbs */}
          <p className="text-white/50 text-[13px] mb-4 flex items-center flex-wrap gap-1">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/courses-list" className="hover:text-white transition-colors">Courses</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{course.title}</span>
          </p>

          {/* Category pill */}
          {course.category && (
            <span
              className="inline-block px-3 py-1 text-white text-[11px] font-bold uppercase tracking-wider mb-3"
              style={{ backgroundColor: accent }}
            >
              {course.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-white font-bold text-[28px] md:text-[34px] leading-tight max-w-2xl mb-3">
            {course.title}
          </h1>

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-semibold rounded-sm"
              style={{ backgroundColor: lvl.bg, color: lvl.text }}>
              <GraduationCap className="w-3.5 h-3.5" /> {course.level}
            </span>
            {course.durationHours && (
              <span className="inline-flex items-center gap-1.5 text-white/70 text-[13px]">
                <Clock className="w-4 h-4" /> {course.durationHours}h total
              </span>
            )}
            {totalLessons > 0 && (
              <span className="inline-flex items-center gap-1.5 text-white/70 text-[13px]">
                <BookMarked className="w-4 h-4" /> {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
              </span>
            )}
            {course.enrolledCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-white/70 text-[13px]">
                <Users className="w-4 h-4" /> {course.enrolledCount} enrolled
              </span>
            )}
          </div>

          <p className="text-white/70 text-[13px]">
            Instructor: <span className="text-white font-semibold">{course.instructor}</span>
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* Description */}
            <section>
              <h2 className="font-bold text-[20px] mb-3 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                About This Course
              </h2>
              <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </section>

            {/* What you'll learn */}
            {course.whatYouLearn && course.whatYouLearn.length > 0 && (
              <section>
                <h2 className="font-bold text-[20px] mb-4 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                  What You'll Learn
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {course.whatYouLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BC_BLUE }} />
                      <span className="text-[13px] text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Prerequisites */}
            {course.prerequisites && (
              <section>
                <h2 className="font-bold text-[20px] mb-3 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                  Prerequisites
                </h2>
                <p className="text-[14px] text-gray-700 leading-relaxed">{course.prerequisites}</p>
              </section>
            )}

            {/* Curriculum */}
            {course.curriculum.length > 0 && (
              <section>
                <h2 className="font-bold text-[20px] mb-1 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                  Course Curriculum
                </h2>
                <p className="text-[12px] text-gray-400 mb-4">
                  {course.curriculum.length} chapter{course.curriculum.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {course.curriculum.map((ch) => {
                    const isOpen = openChapters[ch.id] ?? (ch.order === 1);
                    const chMins = ch.lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);
                    return (
                      <div key={ch.id} className="border border-gray-200">
                        <button
                          onClick={() => toggleChapter(ch.id)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-[14px]" style={{ color: BC_NAVY }}>
                              {ch.title}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {ch.lessons.length} lesson{ch.lessons.length !== 1 ? "s" : ""}
                              {chMins > 0 && ` · ${chMins}min`}
                            </span>
                          </div>
                          {isOpen
                            ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                        </button>
                        {isOpen && ch.lessons.length > 0 && (
                          <div className="border-t border-gray-200 divide-y divide-gray-100">
                            {ch.lessons.map((lesson) => {
                              const LIcon = lessonIcon(lesson.lessonType);
                              return (
                                <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50">
                                  <LIcon className="w-4 h-4 shrink-0 text-gray-400" />
                                  <span className="flex-1 text-[13px] text-gray-700">{lesson.title}</span>
                                  {lesson.durationMinutes && (
                                    <span className="text-[11px] text-gray-400 shrink-0">{lesson.durationMinutes}min</span>
                                  )}
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 uppercase tracking-wide shrink-0">
                                    {lesson.lessonType}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Info cards row */}
            <section>
              <h2 className="font-bold text-[20px] mb-4 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                Course Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: GraduationCap, label: "Level",     value: course.level,                          color: BC_BLUE  },
                  { icon: Clock,         label: "Duration",   value: course.durationHours ? `${course.durationHours}h` : "—", color: BC_NAVY  },
                  { icon: UserCheck,     label: "Instructor", value: course.instructor,                     color: accent   },
                  { icon: BookOpen,      label: "Category",   value: course.category,                       color: BC_RED   },
                ].map(({ icon: Ic, label, value, color }) => (
                  <div key={label} className="border border-gray-100 p-4 flex flex-col items-start gap-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-sm" style={{ backgroundColor: color + "18" }}>
                      <Ic className="w-4 h-4" style={{ color }} />
                    </div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
                    <p className="text-[13px] font-bold capitalize" style={{ color: BC_NAVY }}>{value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right column — sticky pricing + registration card ────────────── */}
          <div className="lg:w-80 xl:w-96 shrink-0">
            <div className="lg:sticky lg:top-6 space-y-4">

              {/* Course thumbnail */}
              {course.imageUrl ? (
                <img src={course.imageUrl} alt={course.title} className="w-full h-48 object-cover border border-gray-100" />
              ) : (
                <div
                  className="w-full h-48 flex items-center justify-center border border-gray-100"
                  style={{ backgroundColor: accent + "12" }}
                >
                  <Icon className="w-16 h-16 opacity-15" style={{ color: accent }} />
                </div>
              )}

              {/* Pricing card */}
              <div className="border border-gray-200 bg-white shadow-sm">
                {/* Price header */}
                <div className="px-5 py-4 border-b border-gray-100" style={{ borderTopColor: accent, borderTopWidth: 3 }}>
                  {course.enrollmentType === "free" ? (
                    <div>
                      <span className="text-[28px] font-extrabold" style={{ color: BC_NAVY }}>Free</span>
                      <span className="ml-2 text-[13px] text-gray-400">No payment required</span>
                    </div>
                  ) : course.enrollmentType === "paid" && course.price != null ? (
                    <div>
                      <span className="text-[28px] font-extrabold" style={{ color: BC_NAVY }}>
                        {formatCurrency(course.price, course.currency)}
                      </span>
                      <span className="ml-1 text-[13px] text-gray-400">{course.currency}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[18px] font-bold" style={{ color: BC_NAVY }}>Contact for pricing</span>
                    </div>
                  )}
                  {course.maxStudents && (
                    <p className="text-[12px] text-gray-500 mt-1">
                      {course.maxStudents - course.enrolledCount > 0
                        ? `${course.maxStudents - course.enrolledCount} seats remaining`
                        : "Class full — join waitlist"}
                    </p>
                  )}
                </div>

                {/* Quick info */}
                <div className="px-5 py-3 space-y-2 border-b border-gray-100">
                  {[
                    { icon: GraduationCap, text: course.level },
                    { icon: Clock,         text: course.durationHours ? `${course.durationHours} hours` : "Self-paced" },
                    { icon: BookMarked,    text: `${totalLessons} lesson${totalLessons !== 1 ? "s" : ""}` },
                    { icon: Users,         text: `${course.enrolledCount} student${course.enrolledCount !== 1 ? "s" : ""} enrolled` },
                    { icon: BadgeCheck,    text: `Certificate on completion` },
                    { icon: CalendarDays,  text: "Start anytime" },
                  ].map(({ icon: Ic, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-[13px] text-gray-600">
                      <Ic className="w-4 h-4 shrink-0" style={{ color: BC_BLUE }} />
                      <span className="capitalize">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Registration / enroll */}
                <div className="px-5 py-4">
                  {regDone ? (
                    <div className="text-center py-3">
                      <CheckCircle2 className="mx-auto w-8 h-8 mb-2" style={{ color: BC_BLUE }} />
                      <p className="font-semibold text-[14px]" style={{ color: BC_NAVY }}>
                        You're registered!
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        We'll be in touch at {regEmail}
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!regName.trim() || !regEmail.trim()) return;
                        registerMutation.mutate();
                      }}
                      className="space-y-3"
                    >
                      <p className="text-[13px] font-semibold" style={{ color: BC_NAVY }}>
                        Register your interest
                      </p>
                      <input
                        type="text"
                        placeholder="Full name *"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-[13px] border border-gray-300 focus:outline-none focus:border-blue-400 bg-white"
                      />
                      <input
                        type="email"
                        placeholder="Email address *"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-[13px] border border-gray-300 focus:outline-none focus:border-blue-400 bg-white"
                      />
                      <input
                        type="tel"
                        placeholder="Phone number (optional)"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2 text-[13px] border border-gray-300 focus:outline-none focus:border-blue-400 bg-white"
                      />
                      {regError && (
                        <p className="text-[12px] text-red-500">{regError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="w-full py-3 text-white text-[13px] font-bold uppercase tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: BC_RED }}
                      >
                        {registerMutation.isPending ? "Submitting…" : "Register Now"}
                      </button>
                      <p className="text-center text-[12px] text-gray-400">or</p>
                      <Link href="/student/login">
                        <button
                          type="button"
                          className="w-full py-2.5 text-[13px] font-semibold border transition-colors hover:bg-gray-50"
                          style={{ borderColor: BC_BLUE, color: BC_BLUE }}
                        >
                          Log in to enroll
                        </button>
                      </Link>
                    </form>
                  )}
                </div>
              </div>

              {/* Need help */}
              <div className="border border-gray-100 px-4 py-3 flex items-start gap-3 bg-gray-50/60">
                <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: BC_BLUE }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: BC_NAVY }}>Need more info?</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Contact us and we'll help you find the right course.
                  </p>
                </div>
              </div>
            </div>
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
              <Link href="/"             className="text-white/60 hover:text-white text-[13px] transition-colors">Home</Link>
              <Link href="/courses-list" className="text-white/60 hover:text-white text-[13px] transition-colors">Courses</Link>
              <Link href="/student/login" className="text-white/60 hover:text-white text-[13px] transition-colors">Student Login</Link>
              <a href="/lms/admin-login"  className="text-white/60 hover:text-white text-[13px] transition-colors">Admin Login</a>
            </div>
            <p className="text-white/35 text-[12px]">© {new Date().getFullYear()} {academyName}</p>
          </div>
        </div>
        <div style={{ backgroundColor: BC_RED }} className="h-1.5 w-full" />
      </footer>

    </div>
  );
}
