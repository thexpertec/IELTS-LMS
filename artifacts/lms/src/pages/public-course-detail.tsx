import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import {
  BookOpen, PenTool, Headphones, Mic, Home, GraduationCap, Clock,
  FileText, LayoutGrid, Type, Users, ChevronRight, ChevronDown,
  ChevronUp, Play, Volume2, Image, HelpCircle, CheckCircle2,
  BookMarked, AlertCircle, BadgeCheck, UserCheck, CalendarDays,
  ListChecks, Lock, LockOpen,
} from "lucide-react";

const BC_RED   = "#C8102E";
const BC_NAVY  = "#1F1F6B";
const BC_BLUE  = "#009BDE";
const BC_CYAN  = "#3DBBDB";

interface PublicQuiz {
  id: number;
  title: string;
  questionCount: number;
  timeLimitMinutes: number | null;
}

interface PublicLesson {
  id: number;
  chapterId: number | null;
  title: string;
  lessonType: string;
  durationMinutes: number | null;
  order: number;
  enrollmentType: string | null;
  quizzes: PublicQuiz[];
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

  const { data: cms = {} } = useQuery<Record<string, Record<string, unknown>>>({
    queryKey: ["tenant-cms-sections-public"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/cms-sections", { credentials: "include" });
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
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

  const academyName  = tenant?.name ?? "IELTS Academy";
  const logoUrl      = String((cms.branding as any)?.logoUrl ?? "") || tenant?.logoUrl || "";
  const footerText   = String((cms.branding as any)?.footerText ?? "") || `© ${new Date().getFullYear()} ${academyName}. All rights reserved.`;
  const contactEmail = String((cms.contact   as any)?.email    ?? "");

  function toggleChapter(id: number) {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const totalLessons = course?.curriculum.reduce((s, ch) => s + ch.lessons.length, 0) ?? 0;
  const totalQuizzes = course?.curriculum.reduce(
    (s, ch) => s + ch.lessons.reduce((ls, l) => ls + l.quizzes.length, 0), 0
  ) ?? 0;
  const accent = course ? categoryColor(course.category) : BC_BLUE;
  const lvl    = course ? levelColor(course.level)       : { bg: "#F3F4F6", text: "#6B7280" };
  const Icon   = course ? categoryIcon(course.category)  : GraduationCap;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }
  if (isError || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto w-12 h-12 text-red-400 mb-3" />
          <h2 className="font-bold text-xl" style={{ color: BC_NAVY }}>Course not found</h2>
          <Link href="/courses-list" className="mt-4 inline-block text-base underline" style={{ color: BC_BLUE }}>
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
          <a href="/lms/admin-login" className="px-3 py-1 text-white text-sm font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors">
            Admin Login
          </a>
          <Link href="/student/login" className="px-3 py-1 text-white text-sm font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors">
            Log in
          </Link>
        </div>
      </div>

      {/* ── Tier 2: Navy logo bar ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: BC_NAVY }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-[72px] flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt={academyName} className="h-10 w-auto" />
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
          <span className="text-white font-bold text-[28px] tracking-tight">{academyName}</span>
          <span className="text-white/40 text-sm self-end pb-1">™</span>
        </div>
      </div>

      {/* ── Tier 3: Blue nav bar ────────────────────────────────────────────── */}
      <div style={{ backgroundColor: BC_BLUE }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4">
          <nav className="flex items-stretch h-[48px]">
            <Link href="/" style={{ backgroundColor: BC_CYAN }} className="flex items-center justify-center w-12 shrink-0 hover:brightness-95 transition-all">
              <Home className="w-5 h-5 text-white" />
            </Link>
            {navTabs.map((tab, i) => (
              <Link
                key={i}
                href={tab.href}
                className="flex items-center px-5 h-full text-sm font-medium whitespace-nowrap border-l border-white/20 transition-colors"
                style={{ color: "white", backgroundColor: tab.active ? "rgba(255,255,255,0.18)" : "transparent" }}
              >
                {tab.label}
                {tab.active && <span className="ml-1.5 w-2 h-2 rounded-full bg-white inline-block" />}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: BC_NAVY }} className="relative overflow-hidden">
        {course.imageUrl && (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        <div className="relative max-w-screen-xl mx-auto px-4 md:px-8 py-12">
          {/* Breadcrumbs */}
          <p className="text-white/50 text-sm mb-5 flex items-center flex-wrap gap-1">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/courses-list" className="hover:text-white transition-colors">Courses</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">{course.title}</span>
          </p>

          {course.category && (
            <span
              className="inline-block px-3 py-1 text-white text-xs font-bold uppercase tracking-wider mb-3"
              style={{ backgroundColor: accent }}
            >
              {course.category}
            </span>
          )}

          <h1 className="text-white font-bold text-[30px] md:text-[38px] leading-tight max-w-2xl mb-4">
            {course.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-sm"
              style={{ backgroundColor: lvl.bg, color: lvl.text }}>
              <GraduationCap className="w-4 h-4" /> {course.level}
            </span>
            {course.durationHours && (
              <span className="inline-flex items-center gap-1.5 text-white/70 text-sm">
                <Clock className="w-4 h-4" /> {course.durationHours}h total
              </span>
            )}
            {totalLessons > 0 && (
              <span className="inline-flex items-center gap-1.5 text-white/70 text-sm">
                <BookMarked className="w-4 h-4" /> {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
              </span>
            )}
            {totalQuizzes > 0 && (
              <span className="inline-flex items-center gap-1.5 text-white/70 text-sm">
                <ListChecks className="w-4 h-4" /> {totalQuizzes} quiz{totalQuizzes !== 1 ? "zes" : ""}
              </span>
            )}
            {course.enrolledCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-white/70 text-sm">
                <Users className="w-4 h-4" /> {course.enrolledCount} enrolled
              </span>
            )}
          </div>

          <p className="text-white/70 text-sm">
            Instructor: <span className="text-white font-semibold">{course.instructor}</span>
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-12">

            {/* Description */}
            <section>
              <h2 className="font-bold text-2xl mb-4 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                About This Course
              </h2>
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </section>

            {/* What you'll learn */}
            {course.whatYouLearn && course.whatYouLearn.length > 0 && (
              <section>
                <h2 className="font-bold text-2xl mb-4 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                  What You'll Learn
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {course.whatYouLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: BC_BLUE }} />
                      <span className="text-base text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Prerequisites */}
            {course.prerequisites && (
              <section>
                <h2 className="font-bold text-2xl mb-4 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                  Prerequisites
                </h2>
                <p className="text-base text-gray-700 leading-relaxed">{course.prerequisites}</p>
              </section>
            )}

            {/* Curriculum */}
            {course.curriculum.length > 0 && (
              <section>
                <h2 className="font-bold text-2xl mb-1 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                  Course Curriculum
                </h2>
                <p className="text-sm text-gray-400 mb-5">
                  {course.curriculum.length} chapter{course.curriculum.length !== 1 ? "s" : ""}
                  {" · "}
                  {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                  {totalQuizzes > 0 && ` · ${totalQuizzes} quiz${totalQuizzes !== 1 ? "zes" : ""}`}
                </p>
                <div className="space-y-2">
                  {course.curriculum.map((ch) => {
                    const isOpen = openChapters[ch.id] ?? (ch.order === 1);
                    const chMins = ch.lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);
                    const chQuizCount = ch.lessons.reduce((s, l) => s + l.quizzes.length, 0);
                    return (
                      <div key={ch.id} className="border border-gray-200">
                        {/* Chapter header */}
                        <button
                          onClick={() => toggleChapter(ch.id)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-base" style={{ color: BC_NAVY }}>
                              {ch.title}
                            </span>
                            <span className="text-sm text-gray-400">
                              {ch.lessons.length} lesson{ch.lessons.length !== 1 ? "s" : ""}
                              {chMins > 0 && ` · ${chMins}min`}
                              {chQuizCount > 0 && ` · ${chQuizCount} quiz${chQuizCount !== 1 ? "zes" : ""}`}
                            </span>
                          </div>
                          {isOpen
                            ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                            : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                        </button>

                        {/* Lessons + quizzes */}
                        {isOpen && ch.lessons.length > 0 && (
                          <div className="border-t border-gray-200 divide-y divide-gray-100">
                            {ch.lessons.map((lesson) => {
                              const LIcon = lessonIcon(lesson.lessonType);
                              return (
                                <React.Fragment key={lesson.id}>
                                  {/* Lesson row */}
                                  <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/50">
                                    <LIcon className="w-4 h-4 shrink-0 text-gray-400" />
                                    <span className="flex-1 text-base text-gray-700">{lesson.title}</span>
                                    {lesson.durationMinutes && (
                                      <span className="text-sm text-gray-400 shrink-0">{lesson.durationMinutes}min</span>
                                    )}
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-500 uppercase tracking-wide shrink-0">
                                      {lesson.lessonType}
                                    </span>
                                    {lesson.enrollmentType === "paid"
                                      ? <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                      : <LockOpen className="w-3.5 h-3.5 shrink-0" style={{ color: BC_BLUE }} />
                                    }
                                  </div>

                                  {/* Quiz sub-rows */}
                                  {lesson.quizzes.map((quiz) => (
                                    <div
                                      key={quiz.id}
                                      className="flex items-center gap-3 pl-12 pr-5 py-2.5"
                                      style={{ backgroundColor: "#F0F7FF" }}
                                    >
                                      <ListChecks className="w-4 h-4 shrink-0" style={{ color: BC_BLUE }} />
                                      <span className="flex-1 text-sm text-gray-700">{quiz.title}</span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {quiz.questionCount > 0 && (
                                          <span className="text-xs text-gray-400">
                                            {quiz.questionCount} question{quiz.questionCount !== 1 ? "s" : ""}
                                          </span>
                                        )}
                                        {quiz.timeLimitMinutes && (
                                          <span className="text-xs text-gray-400">· {quiz.timeLimitMinutes}min</span>
                                        )}
                                        <span
                                          className="text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wide"
                                          style={{ backgroundColor: BC_BLUE + "18", color: BC_BLUE }}
                                        >
                                          Quiz
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </React.Fragment>
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
              <h2 className="font-bold text-2xl mb-5 pb-2 border-b border-gray-200" style={{ color: BC_NAVY }}>
                Course Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: GraduationCap, label: "Level",     value: course.level,                          color: BC_BLUE  },
                  { icon: Clock,         label: "Duration",   value: course.durationHours ? `${course.durationHours}h` : "—", color: BC_NAVY  },
                  { icon: UserCheck,     label: "Instructor", value: course.instructor,                     color: accent   },
                  { icon: BookOpen,      label: "Category",   value: course.category,                       color: BC_RED   },
                ].map(({ icon: Ic, label, value, color }) => (
                  <div key={label} className="border border-gray-100 p-5 flex flex-col items-start gap-2">
                    <div className="w-9 h-9 flex items-center justify-center rounded-sm" style={{ backgroundColor: color + "18" }}>
                      <Ic className="w-5 h-5" style={{ color }} />
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
                    <p className="text-base font-bold capitalize" style={{ color: BC_NAVY }}>{value}</p>
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
                <div className="px-5 py-5 border-b border-gray-100" style={{ borderTopColor: accent, borderTopWidth: 3 }}>
                  {course.enrollmentType === "free" ? (
                    <div>
                      <span className="text-[30px] font-extrabold" style={{ color: BC_NAVY }}>Free</span>
                      <span className="ml-2 text-sm text-gray-400">No payment required</span>
                    </div>
                  ) : course.enrollmentType === "paid" && course.price != null ? (
                    <div>
                      <span className="text-[30px] font-extrabold" style={{ color: BC_NAVY }}>
                        {formatCurrency(course.price, course.currency)}
                      </span>
                      <span className="ml-1 text-sm text-gray-400">{course.currency}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xl font-bold" style={{ color: BC_NAVY }}>Contact for pricing</span>
                    </div>
                  )}
                  {course.maxStudents && (
                    <p className="text-sm text-gray-500 mt-1">
                      {course.maxStudents - course.enrolledCount > 0
                        ? `${course.maxStudents - course.enrolledCount} seats remaining`
                        : "Class full — join waitlist"}
                    </p>
                  )}
                </div>

                {/* Quick info */}
                <div className="px-5 py-4 space-y-2.5 border-b border-gray-100">
                  {[
                    { icon: GraduationCap, text: course.level },
                    { icon: Clock,         text: course.durationHours ? `${course.durationHours} hours` : "Self-paced" },
                    { icon: BookMarked,    text: `${totalLessons} lesson${totalLessons !== 1 ? "s" : ""}` },
                    ...(totalQuizzes > 0 ? [{ icon: ListChecks, text: `${totalQuizzes} quiz${totalQuizzes !== 1 ? "zes" : ""}` }] : []),
                    { icon: Users,         text: `${course.enrolledCount} student${course.enrolledCount !== 1 ? "s" : ""} enrolled` },
                    { icon: BadgeCheck,    text: "Certificate on completion" },
                    { icon: CalendarDays,  text: "Start anytime" },
                  ].map(({ icon: Ic, text }) => (
                    <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
                      <Ic className="w-4 h-4 shrink-0" style={{ color: BC_BLUE }} />
                      <span className="capitalize">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Registration / enroll */}
                <div className="px-5 py-5">
                  {regDone ? (
                    <div className="text-center py-3">
                      <CheckCircle2 className="mx-auto w-9 h-9 mb-2" style={{ color: BC_BLUE }} />
                      <p className="font-semibold text-base" style={{ color: BC_NAVY }}>
                        You're registered!
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        We'll contact you with enrolment details.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        registerMutation.mutate();
                      }}
                      className="space-y-3"
                    >
                      <p className="font-semibold text-sm mb-3" style={{ color: BC_NAVY }}>
                        Register your interest
                      </p>
                      <input
                        type="text"
                        placeholder="Full name *"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      />
                      <input
                        type="email"
                        placeholder="Email address *"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      />
                      <input
                        type="tel"
                        placeholder="Phone number (optional)"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                      />
                      {regError && <p className="text-xs text-red-500">{regError}</p>}
                      <button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="w-full py-3 text-white font-semibold text-sm transition-opacity disabled:opacity-60"
                        style={{ backgroundColor: BC_RED }}
                      >
                        {registerMutation.isPending ? "Submitting…" : "Register Now"}
                      </button>
                      <Link
                        href="/student/login"
                        className="block w-full py-2.5 text-center text-sm font-medium border transition-colors"
                        style={{ borderColor: BC_NAVY, color: BC_NAVY }}
                      >
                        Log in to enroll
                      </Link>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: BC_NAVY }} className="py-8 mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-white font-bold text-lg">{academyName}</span>
            <div className="flex gap-6">
              <Link href="/courses-list" className="text-white/60 hover:text-white text-sm transition-colors">Courses</Link>
              <Link href="/student/login" className="text-white/60 hover:text-white text-sm transition-colors">Student Login</Link>
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="text-white/60 hover:text-white text-sm transition-colors">{contactEmail}</a>
              )}
            </div>
            <p className="text-white/40 text-sm text-center">{footerText}</p>
          </div>
        </div>
        <div style={{ backgroundColor: BC_RED }} className="h-1.5 w-full mt-6" />
      </footer>

    </div>
  );
}
