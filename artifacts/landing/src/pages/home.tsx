import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Star, CheckCircle2, Play, ArrowRight, Users, BookOpen, Headphones, Mic,
  PenTool, Brain, BookMarked, Zap, Award, BarChart3, Clock, Shield,
  ChevronRight, FileText, Download, Video, Quote, TrendingUp, Globe,
  GraduationCap, Sparkles, MessageSquare,
} from "lucide-react";

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={cn("reveal-on-scroll", isVisible && "is-visible", className)}>
      {children}
    </div>
  );
}

/* ─── DATA ─────────────────────────────────────────────────────── */

const stats = [
  { value: "50K+", label: "Students Trained" },
  { value: "4.9★", label: "Average Rating" },
  { value: "92%", label: "Hit Band 7+" },
  { value: "180+", label: "Countries" },
];

const modules = [
  {
    icon: Headphones,
    label: "Listening",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    iconBg: "bg-blue-100",
    desc: "Section 1–4 strategies, note-taking, gap fill, MCQ & matching.",
    lessons: 24,
  },
  {
    icon: BookOpen,
    label: "Reading",
    color: "bg-violet-50 text-violet-600 border-violet-100",
    iconBg: "bg-violet-100",
    desc: "Skimming, scanning, True/False/NG, heading matching, summary fill.",
    lessons: 28,
  },
  {
    icon: PenTool,
    label: "Writing",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    iconBg: "bg-emerald-100",
    desc: "Task 1 graphs & letters, Task 2 essays with AI band scoring.",
    lessons: 32,
  },
  {
    icon: Mic,
    label: "Speaking",
    color: "bg-orange-50 text-orange-600 border-orange-100",
    iconBg: "bg-orange-100",
    desc: "Parts 1–3 practice, cue cards, fluency & pronunciation drills.",
    lessons: 20,
  },
  {
    icon: Brain,
    label: "Grammar",
    color: "bg-pink-50 text-pink-600 border-pink-100",
    iconBg: "bg-pink-100",
    desc: "IELTS-specific grammar patterns, tense usage, complex sentences.",
    lessons: 18,
  },
  {
    icon: BookMarked,
    label: "Vocabulary",
    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    iconBg: "bg-cyan-100",
    desc: "Academic Word List, topic vocabulary, collocations & idioms.",
    lessons: 22,
  },
];

const courses = [
  {
    id: 1,
    title: "IELTS Academic Complete Course — Band 7 Guarantee",
    instructor: "Dr. Sarah Mitchell",
    instructorRole: "Ex-IELTS Examiner, Cambridge",
    rating: 4.9,
    reviews: 2847,
    students: 18420,
    lessons: 94,
    duration: "48h",
    price: 129,
    originalPrice: 299,
    badge: "Bestseller",
    badgeColor: "bg-amber-400 text-amber-900",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
    tags: ["Academic", "All Levels", "AI Feedback"],
    hasCert: true,
  },
  {
    id: 2,
    title: "IELTS Writing Masterclass — Task 1 & Task 2",
    instructor: "Prof. James Chen",
    instructorRole: "Band 9 Writing Coach",
    rating: 4.8,
    reviews: 1632,
    students: 9801,
    lessons: 48,
    duration: "22h",
    price: 79,
    originalPrice: 179,
    badge: "Top Rated",
    badgeColor: "bg-indigo-500 text-white",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80",
    tags: ["Writing", "Intermediate", "AI Scoring"],
    hasCert: true,
  },
  {
    id: 3,
    title: "Speaking Band 7+ — 30-Day Intensive Program",
    instructor: "Emma Watson",
    instructorRole: "IELTS Speaking Specialist",
    rating: 4.9,
    reviews: 984,
    students: 5632,
    lessons: 36,
    duration: "18h",
    price: 69,
    originalPrice: 149,
    badge: "New",
    badgeColor: "bg-emerald-500 text-white",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80",
    tags: ["Speaking", "Beginner+", "Live Sessions"],
    hasCert: false,
  },
  {
    id: 4,
    title: "IELTS General Training — Visa & Migration Focus",
    instructor: "Michael Torres",
    instructorRole: "Migration Consultant & IELTS Tutor",
    rating: 4.7,
    reviews: 742,
    students: 4210,
    lessons: 56,
    duration: "28h",
    price: 89,
    originalPrice: 199,
    badge: "Popular",
    badgeColor: "bg-rose-500 text-white",
    image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&q=80",
    tags: ["General", "All Levels", "Certificate"],
    hasCert: true,
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    country: "India → Canada",
    flag: "🇮🇳",
    band: "8.0",
    prevBand: "6.5",
    text: "I was stuck at 6.5 for two attempts. After just 6 weeks on this platform, I scored 8.0 and got my Canadian PR. The AI writing feedback was a game-changer — it pinpointed exactly why I was losing marks.",
    course: "IELTS Academic Complete",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
  },
  {
    name: "Ahmad Al-Rashidi",
    country: "UAE → Australia",
    flag: "🇦🇪",
    band: "7.5",
    prevBand: "6.0",
    text: "The speaking mock tests with real examiner feedback helped me go from 6.0 to 7.5 in Speaking. I never thought I'd score this high. The cue card practice library is incredible.",
    course: "Speaking Band 7+ Program",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
  },
  {
    name: "Maria Santos",
    country: "Philippines → UK",
    flag: "🇵🇭",
    band: "7.0",
    prevBand: "5.5",
    text: "From 5.5 to 7.0 in one attempt. The structured lessons, daily practice quizzes, and progress tracker kept me on track. Worth every penny — I got my UK nursing registration!",
    course: "IELTS General Training",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
  },
];

const resources = [
  { icon: FileText, label: "Free Mock Tests", desc: "4 full-length IELTS mock tests with answer keys", color: "text-indigo-600 bg-indigo-50", count: "4 Tests" },
  { icon: Download, label: "PDF Study Packs", desc: "200+ page grammar & vocabulary workbooks", color: "text-violet-600 bg-violet-50", count: "12 PDFs" },
  { icon: Mic, label: "Speaking Cue Cards", desc: "200+ Part 2 topics with model answers", color: "text-orange-600 bg-orange-50", count: "200+ Cards" },
  { icon: BookMarked, label: "Vocab Lists", desc: "Academic Word List + topic-specific word banks", color: "text-emerald-600 bg-emerald-50", count: "3000+ Words" },
  { icon: Video, label: "Video Lessons", desc: "Free introductory lessons from all modules", color: "text-blue-600 bg-blue-50", count: "20 Videos" },
  { icon: BarChart3, label: "Band Calculator", desc: "Estimate your band score from practice results", color: "text-pink-600 bg-pink-50", count: "Free Tool" },
];

const whyUs = [
  { icon: Sparkles, title: "AI-Powered Feedback", desc: "Get instant band score estimates and detailed feedback on your Writing and Speaking practice — just like a real examiner.", color: "text-indigo-600 bg-indigo-50" },
  { icon: Award, title: "Certified IELTS Trainers", desc: "All instructors are former IELTS examiners or certified trainers with 10+ years of proven teaching experience.", color: "text-amber-600 bg-amber-50" },
  { icon: FileText, title: "Real Exam Mock Tests", desc: "Authentic IELTS exam simulations with timed conditions, auto-grading, and detailed section-by-section analysis.", color: "text-emerald-600 bg-emerald-50" },
  { icon: BarChart3, title: "Progress Tracking", desc: "Visual dashboards show your improvement across all four skills, keeping you accountable and focused on weak areas.", color: "text-violet-600 bg-violet-50" },
  { icon: MessageSquare, title: "Live Doubt Sessions", desc: "Weekly live Q&A with instructors. Ask questions, practice speaking, and get real-time corrections from experts.", color: "text-blue-600 bg-blue-50" },
  { icon: Globe, title: "Study Anywhere", desc: "Full mobile app access. Study on the bus, during lunch, or at home. Your progress syncs seamlessly across all devices.", color: "text-rose-600 bg-rose-50" },
];

const plans = [
  {
    name: "Basic",
    price: 0,
    period: "Forever Free",
    desc: "Perfect to get started",
    color: "border-slate-200",
    btnClass: "border border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    features: ["2 free courses", "20 practice questions/day", "Band score calculator", "Community forum access"],
    notIncluded: ["AI writing feedback", "Mock tests", "Certificate", "Live sessions"],
  },
  {
    name: "Premium",
    price: 29,
    period: "/ month",
    desc: "Most popular for exam prep",
    color: "border-indigo-600 shadow-xl shadow-indigo-100",
    btnClass: "bg-indigo-600 text-white hover:bg-indigo-700",
    badge: "Most Popular",
    features: ["All courses & modules", "Unlimited practice tests", "AI writing & speaking feedback", "4 full mock exams/month", "Progress analytics", "Certificate of completion"],
    notIncluded: ["1-on-1 mentorship", "Priority support"],
  },
  {
    name: "Mentorship",
    price: 79,
    period: "/ month",
    desc: "Fast-track with expert guidance",
    color: "border-slate-200",
    btnClass: "border border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    features: ["Everything in Premium", "2 x 1-on-1 sessions/month", "Personalised study plan", "Writing correction by examiner", "Priority email support", "Band guarantee*"],
    notIncluded: [],
  },
  {
    name: "Lifetime",
    price: 299,
    period: "one-time",
    desc: "Best value, pay once",
    color: "border-amber-400 shadow-lg shadow-amber-50",
    btnClass: "bg-amber-500 text-white hover:bg-amber-600",
    badge: "Best Value",
    features: ["Lifetime Premium access", "All future courses included", "6 mock exams/month", "AI feedback unlimited", "4 x 1-on-1 sessions", "Certificate of completion"],
    notIncluded: [],
  },
];

const faqs = [
  { q: "How is OneSoft IELTS different from other prep platforms?", a: "We combine AI-powered instant feedback with certified IELTS examiners — so you get the best of both worlds. Our AI grades your essays 24/7, while real examiners run weekly live sessions to address your specific weaknesses. Our 92% Band 7+ success rate speaks for itself." },
  { q: "How quickly can I improve my band score?", a: "Most students see a 0.5–1.0 band improvement within 4–6 weeks of consistent daily practice. Students who follow the full structured program and complete all mock tests typically reach Band 7+ within 8–12 weeks." },
  { q: "Do I get a certificate after completing a course?", a: "Yes. All paid plans include an accredited Certificate of Completion for each course you finish. This can be shared on LinkedIn and added to your professional portfolio." },
  { q: "What if I'm not satisfied with the platform?", a: "We offer a 30-day money-back guarantee with no questions asked. If you're not happy with your progress, we'll refund your subscription in full." },
  { q: "Can I access courses on my phone?", a: "Absolutely. The platform is fully mobile-optimised. Watch lessons, complete practice tests, and track your progress from any device — iOS, Android, tablet, or desktop." },
  { q: "Is the AI feedback as good as real examiner feedback?", a: "Our AI has been trained on thousands of real IELTS examiner-graded essays and speaking samples. It scores all four IELTS writing criteria (Task Achievement, Coherence, Lexical Resource, Grammar) and provides detailed band-level explanations, comparable to professional feedback." },
  { q: "Do you offer group discounts for academies?", a: "Yes — we have special pricing for IELTS academies and institutions. Contact us at academies@onesoftlms.com for a custom demo and pricing package." },
];

/* ─── COMPONENTS ────────────────────────────────────────────────── */

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={cn("w-3.5 h-3.5", s <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200")} />
        ))}
      </div>
      <span className="text-xs font-semibold text-amber-600">{rating}</span>
      <span className="text-xs text-slate-400">({reviews.toLocaleString()})</span>
    </div>
  );
}

function CourseCard({ course }: { course: typeof courses[0] }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative overflow-hidden aspect-video">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-indigo-600 fill-indigo-600 ml-0.5" />
          </div>
        </div>
        <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold", course.badgeColor)}>
          {course.badge}
        </span>
        {course.hasCert && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/90 text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" /> Cert
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {course.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">{t}</span>
          ))}
        </div>
        <h3 className="font-semibold text-sm text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">{course.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
            {course.instructor[0]}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">{course.instructor}</p>
            <p className="text-[10px] text-slate-400">{course.instructorRole}</p>
          </div>
        </div>
        <StarRating rating={course.rating} reviews={course.reviews} />
        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.students.toLocaleString()}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessons} lessons</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">${course.price}</span>
            <span className="text-sm text-slate-400 line-through">${course.originalPrice}</span>
          </div>
          <a href="/lms/" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
            Enroll Now
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE ──────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Trust pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-200 text-indigo-700 text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Trusted by 50,000+ students in 180 countries
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
              Achieve{" "}
              <span className="relative inline-block">
                <span className="gradient-text">IELTS Band 7+</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                  <path d="M0 6 Q150 0 300 6" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="5 3" />
                </svg>
              </span>
              {" "}in Your Next Attempt
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
              AI-powered preparation platform with certified IELTS examiners, real exam simulations, and personalised band-score feedback — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <a href="/lms/" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 transition-all hover:scale-105 flex items-center justify-center gap-2">
                Start Free Mock Test <ArrowRight className="w-4 h-4" />
              </a>
              <Link href="/courses" className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 font-bold text-base bg-white hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                Explore Courses <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust badges row */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500 mb-12">
              {[
                { icon: Shield, label: "No credit card required" },
                { icon: CheckCircle2, label: "30-day money-back guarantee" },
                { icon: GraduationCap, label: "Ex-IELTS examiners" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-emerald-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 text-center">
                  <p className="text-2xl md:text-3xl font-extrabold text-indigo-600 mb-0.5">{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ── */}
      <div className="border-y border-slate-100 bg-slate-50 py-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-400 font-medium">
            <span>Trusted by students from</span>
            {["🇮🇳 India", "🇵🇭 Philippines", "🇧🇩 Bangladesh", "🇵🇰 Pakistan", "🇳🇬 Nigeria", "🇧🇷 Brazil", "🇦🇪 UAE", "🇻🇳 Vietnam"].map((c) => (
              <span key={c} className="text-slate-600">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── IELTS MODULES ── */}
      <section id="modules" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-4">
              Comprehensive Coverage
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Master All 6 IELTS Skills</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">Structured learning paths for every skill area, purpose-built for the IELTS exam format.</p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m, i) => (
              <RevealSection key={m.label} className={cn("stagger-" + Math.min(i + 1, 4))}>
                <div className={cn("rounded-2xl border p-6 hover:shadow-md transition-all duration-300 cursor-pointer group", m.color)}>
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4", m.iconBg)}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1.5 group-hover:text-indigo-700 transition-colors">{m.label}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{m.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{m.lessons} lessons</span>
                    <Link href="/courses" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                      Explore <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-4">
                Featured Courses
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">Top-Rated IELTS Courses</h2>
              <p className="text-slate-500 text-lg">Handpicked by our expert team. Updated monthly with new content.</p>
            </div>
            <Link href="/courses" className="flex items-center gap-2 text-indigo-600 font-semibold hover:underline whitespace-nowrap">
              View all courses <ArrowRight className="w-4 h-4" />
            </Link>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {courses.map((c) => (
              <RevealSection key={c.id}>
                <CourseCard course={c} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-4">
              Real Student Stories
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">92% of Our Students Hit Band 7+</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">Real results from real students. See how we helped them transform their scores.</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {testimonials.map((t, i) => (
              <RevealSection key={t.name} className={cn("stagger-" + Math.min(i + 1, 4))}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                  <Quote className="w-6 h-6 text-indigo-200 mb-3" />
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">"{t.text}"</p>

                  {/* Band score badge */}
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-medium">Before</p>
                      <p className="text-xl font-extrabold text-slate-500">{t.prevBand}</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-emerald-500 flex-1" />
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-medium">After</p>
                      <p className="text-xl font-extrabold text-emerald-600">{t.band}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex">
                        {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{t.name} {t.flag}</p>
                      <p className="text-xs text-slate-400">{t.country}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          {/* Video testimonials teaser */}
          <RevealSection>
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white text-center">
              <Play className="w-10 h-10 text-white/60 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Watch Student Success Stories</h3>
              <p className="text-indigo-200 text-sm mb-5">See 30+ video testimonials from students who achieved Band 7, 7.5 and 8.0+</p>
              <a href="/lms/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors">
                Watch Stories <Play className="w-3.5 h-3.5 fill-indigo-600" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FREE RESOURCES ── */}
      <section id="resources" className="py-20 md:py-28 bg-gradient-to-br from-indigo-50/50 to-violet-50/30">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-4">
              Free for Everyone
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Kickstart Your Prep — For Free</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">No payment required. Access premium resources and start your IELTS journey today.</p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {resources.map((r, i) => (
              <RevealSection key={r.label} className={cn("stagger-" + Math.min(i + 1, 4))}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group cursor-pointer">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4", r.color)}>
                    <r.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{r.label}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">{r.count}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{r.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="text-center">
            <a href="/lms/" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 transition-all hover:scale-105">
              Access Free Resources <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-slate-400 text-sm mt-3">No credit card · No spam · Instant access</p>
          </RevealSection>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
              The OneSoft Advantage
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Why 50,000 Students Choose Us</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">We built the platform we wished existed when we were preparing for IELTS.</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map((w, i) => (
              <RevealSection key={w.title} className={cn("stagger-" + Math.min(i + 1, 4))}>
                <div className="flex gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", w.color)}>
                    <w.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1.5">{w.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 md:py-28 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-4">
              Simple Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Invest in Your Future</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">Start free, upgrade when you're ready. No hidden fees, cancel anytime.</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => (
              <RevealSection key={plan.name} className={cn("stagger-" + Math.min(i + 1, 4))}>
                <div className={cn("bg-white rounded-2xl border-2 p-6 flex flex-col h-full relative", plan.color)}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-sm">{plan.badge}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-slate-900 mb-0.5">{plan.name}</h3>
                  <p className="text-slate-400 text-xs mb-4">{plan.desc}</p>
                  <div className="mb-5">
                    <span className="text-4xl font-extrabold text-slate-900">${plan.price}</span>
                    <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-400 line-through">
                        <div className="w-4 h-4 rounded-full border border-slate-200 flex-shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/lms/" className={cn("w-full py-2.5 rounded-xl text-sm font-bold text-center transition-colors", plan.btnClass)}>
                    {plan.price === 0 ? "Get Started Free" : "Start Plan"}
                  </a>
                </div>
              </RevealSection>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">*Band guarantee applies to Mentorship plan. T&Cs apply. 30-day money-back on all paid plans.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <RevealSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-4">
              Got Questions?
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-lg">Everything you need to know before you start.</p>
          </RevealSection>

          <RevealSection>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-slate-100 rounded-xl px-5 shadow-xs">
                  <AccordionTrigger className="text-sm font-semibold text-slate-900 hover:no-underline py-4 text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-500 leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </RevealSection>

          <RevealSection className="text-center mt-10">
            <p className="text-slate-500 text-sm">Still have questions? <a href="#" className="text-indigo-600 font-semibold hover:underline">Chat with us live →</a></p>
          </RevealSection>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700">
        <RevealSection className="container mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" /> Limited offer — 70% off this month
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 max-w-2xl mx-auto leading-tight">
            Your Band 7 Journey Starts Today
          </h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            Join 50,000+ students who trusted us with their IELTS preparation. Start with a free mock test — no card needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/lms/" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-indigo-700 font-bold text-base hover:bg-indigo-50 transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2">
              Start Free Mock Test <ArrowRight className="w-4 h-4" />
            </a>
            <Link href="/courses" className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              Browse Courses
            </Link>
          </div>
          <p className="text-indigo-300 text-xs mt-5">No credit card · 30-day money-back · Cancel anytime</p>
        </RevealSection>
      </section>

      <Footer />
    </div>
  );
}
