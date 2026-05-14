import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  BookOpen, PenTool, Headphones, Mic, ArrowRight, CheckCircle2, Quote,
  BarChart3, Users, Layers, Lock, Star, GraduationCap,
  ClipboardList, MessageSquare, Settings, Clock, Award,
  Building2, Globe, LayoutDashboard, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const RED = "#c8102e";
const NAVY = "#1f1646";
const HERO_IMG = null; // replaced by CSS gradient below

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={cn("reveal-on-scroll", isVisible && "is-visible", className)}>
      {children}
    </div>
  );
}

/* ─── DATA ─────────────────────────────────────────────────────────────── */

const stats = [
  { value: "40+", label: "IELTS academies onboarded" },
  { value: "12K+", label: "Active students worldwide" },
  { value: "+1.5", label: "Average band improvement" },
  { value: "98%", label: "Academy satisfaction rate" },
];

const academyPains = [
  { icon: ClipboardList, title: "Scattered materials", desc: "PDFs in email, videos on YouTube, quizzes in Google Forms — students never know where to look." },
  { icon: BarChart3, title: "No real visibility", desc: "You have no idea which students are falling behind until it's too late to intervene." },
  { icon: Users, title: "Teacher coordination chaos", desc: "Multiple teachers, different classes, no shared system — admin overhead eats your day." },
  { icon: Clock, title: "Manual grading bottlenecks", desc: "Assignments pile up in inboxes. Feedback is slow, inconsistent, and hard to track." },
];

const platformFeatures = [
  {
    icon: Layers,
    title: "Curriculum Builder",
    desc: "Structure your entire IELTS programme into Courses → Units → Lessons. 8 purpose-built lesson types cover every format the exam demands.",
    bullets: ["Lecture & reading lessons", "Listening & speaking labs", "Grammar & vocabulary drills", "Quiz & assessment nodes"],
  },
  {
    icon: ClipboardList,
    title: "Assignment & Quiz System",
    desc: "Create assignments and auto-graded quizzes with IELTS-native question formats. Attach reference links, set due dates, and review every submission.",
    bullets: ["Fill-in-the-blank, matching, MCQ", "Timed mock-test mode", "Reference link attachments", "Submission links from students"],
  },
  {
    icon: BarChart3,
    title: "Gradebook & Analytics",
    desc: "A unified gradebook per course gives every teacher instant visibility into each student's scores, completion rate, and trajectory.",
    bullets: ["Per-student score tracking", "Assignment & quiz combined view", "Progress by lesson type", "Export-ready reports"],
  },
  {
    icon: Users,
    title: "Student & Enrollment Management",
    desc: "Enroll students into courses individually or in bulk. Track profiles, band targets, exam dates, and national test history in one place.",
    bullets: ["Detailed student profiles", "Band target & exam date tracking", "Bulk enrollment tools", "Cross-course progress view"],
  },
  {
    icon: MessageSquare,
    title: "Stream & Messaging",
    desc: "Every course has a built-in stream for announcements and discussion. Teachers and students stay in sync without leaving the platform.",
    bullets: ["Course-level announcement feed", "Direct teacher–student messages", "File & link sharing in chat", "Mobile-friendly notifications"],
  },
  {
    icon: LayoutDashboard,
    title: "Branded Student Portal",
    desc: "Students get a clean, focused portal showing their courses, assignments, quiz results, and feedback — nothing else to distract them.",
    bullets: ["My courses & lesson access", "Assignment submission UI", "Quiz-taking environment", "Grade & feedback view"],
  },
];

const ieltsBands = [
  { icon: BookOpen, title: "Reading", desc: "Side-by-side text and question panels with 12+ IELTS question types — matching headings, T/F/NG, sentence completion, and more." },
  { icon: PenTool, title: "Writing", desc: "Task 1 and Task 2 writing lessons with word-count tools, rich editor, and detailed tutor annotation and inline feedback." },
  { icon: Headphones, title: "Listening", desc: "Integrated audio player with synchronized multiple-choice, map completion, and form-fill question panels." },
  { icon: Mic, title: "Speaking", desc: "Speaking prompts with in-browser recording, examiner-style Part 1/2/3 structure, and pinpoint audio feedback from tutors." },
];

const testimonials = [
  {
    quote: "We replaced three separate tools with OneSoft. Our teachers now spend time teaching — not managing spreadsheets and chasing submissions in email.",
    author: "Priya Mehta",
    role: "Director, Excel IELTS Academy — Dubai",
    rating: 5,
  },
  {
    quote: "The quiz builder alone was worth switching. We created 200+ questions in one afternoon. Students get instant feedback and we see exactly who needs extra practice.",
    author: "James Thornton",
    role: "Head Tutor, BritPrep Language School — London",
    rating: 5,
  },
  {
    quote: "Our band score improvement jumped after we moved to OneSoft. The structured curriculum forced students to follow the full programme instead of skipping around.",
    author: "Min-Ji Park",
    role: "Founder, Seoul Band 7 Academy",
    rating: 5,
  },
];

const plans = [
  {
    name: "Starter",
    price: "99",
    period: "/ month",
    desc: "For small academies or independent tutors just getting started.",
    features: ["Up to 50 active students", "5 teacher accounts", "Full curriculum builder", "Quiz & assignment system", "Student portal", "Email support"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Academy",
    price: "249",
    period: "/ month",
    desc: "The complete platform for growing IELTS academies.",
    features: ["Up to 300 active students", "Unlimited teacher accounts", "Everything in Starter", "Advanced gradebook & analytics", "Stream & messaging", "Priority support & onboarding"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For multi-branch institutes and large language schools.",
    features: ["Unlimited students", "Multi-branch management", "Custom branding & domain", "API & LTI integrations", "SLA & dedicated CSM", "Staff training included"],
    cta: "Talk to Sales",
    highlight: false,
  },
];

const faqs = [
  {
    q: "How long does it take to set up our academy on OneSoft?",
    a: "Most academies are fully live within 48 hours. Our onboarding team helps you migrate existing materials, set up your curriculum structure, and enroll your first cohort.",
  },
  {
    q: "Can multiple teachers manage different classes?",
    a: "Yes. You can create unlimited teacher accounts on the Academy and Enterprise plans. Each teacher manages their own courses and students, while academy admins have a full cross-teacher view.",
  },
  {
    q: "Does it support computer-delivered IELTS formatting?",
    a: "Absolutely. Our lesson and quiz interfaces replicate the computer-delivered IELTS experience — split-screen reading, inline highlighting, timed sections, and all official question formats.",
  },
  {
    q: "Can students access it on mobile?",
    a: "Yes. The student portal is fully responsive and optimised for mobile browsers. Students can read lessons, watch videos, submit assignments, and take quizzes from any device.",
  },
  {
    q: "Is student data secure and private?",
    a: "All data is stored with full tenant isolation — your academy's data is completely separated from other academies. We use TLS encryption in transit and AES-256 at rest.",
  },
  {
    q: "Is there a free trial?",
    a: "Every plan includes a free 14-day trial with full access. No credit card required. You can explore the entire platform — curriculum builder, quizzes, gradebook, and student portal — before committing.",
  },
];

/* ─── COMPONENT ──────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[82vh] flex items-center pt-[100px]">
        {/* Rich photographic-style gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 80% at 80% 40%, #2a5298 0%, transparent 60%),
              radial-gradient(ellipse 50% 60% at 60% 70%, #1a3a6b 0%, transparent 50%),
              radial-gradient(ellipse 40% 50% at 90% 80%, #0d2137 0%, transparent 45%),
              linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 30%, #1f2a5c 55%, #14395e 75%, #0d2537 100%)
            `,
          }}
        />
        {/* Subtle texture dots */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        {/* Atmospheric light bloom on right */}
        <div className="absolute right-0 top-0 w-2/3 h-full opacity-20" style={{
          background: "radial-gradient(ellipse 60% 70% at 80% 40%, #4a90d9 0%, transparent 65%)",
        }} />

        <div className="relative w-full">
          <div className="container mx-auto px-4 md:px-6">
            {/* Left-aligned card — BC style */}
            <div className="bg-white rounded-sm shadow-2xl p-8 md:p-10 max-w-[420px]">
              <RevealSection>
                <p className="text-xs font-bold uppercase tracking-[0.18em] mb-4" style={{ color: RED }}>
                  The IELTS Academy Platform
                </p>
                <h1 className="text-3xl md:text-4xl font-bold leading-snug mb-4 text-gray-900">
                  Run your entire IELTS academy on one platform.
                </h1>
                <p className="text-sm text-gray-600 leading-relaxed mb-7">
                  Curriculum builder, IELTS-native quizzes, gradebook, student portal, and real-time analytics — everything your academy needs to deliver outstanding band scores.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/lms/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-sm shadow-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: RED }}
                  >
                    Book your free demo <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold border-2 rounded-sm hover:bg-gray-50 transition-colors text-gray-800"
                    style={{ borderColor: NAVY }}
                  >
                    See all features
                  </a>
                </div>
                <p className="text-[11px] text-gray-400 mt-4">Free 14-day trial · No credit card required</p>
              </RevealSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── GLOBAL REACH BANNER ──────────────────────────────────────── */}
      <section className="py-10 border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-lg md:text-xl font-semibold text-gray-800 max-w-3xl mx-auto leading-relaxed">
            Dreaming of running a world-class IELTS academy? Join <span style={{ color: RED }} className="font-bold">40+ academies</span> and <span style={{ color: RED }} className="font-bold">12,000+ students</span> already achieving higher band scores with OneSoft.
          </p>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      <section style={{ backgroundColor: NAVY }} className="py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/20">
            {stats.map((s, i) => (
              <RevealSection key={i} className={`stagger-${i + 1} text-center px-6`}>
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{s.value}</p>
                <p className="text-sm text-white/60 leading-snug">{s.label}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ───────────────────────────────────────────────── */}
      <section className="py-10 bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <p className="text-center text-[10px] font-bold text-gray-400 mb-7 uppercase tracking-[0.2em]">
            Trusted by IELTS academies across 15 countries
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-50">
            {["Excel Academy", "BritPrep", "Band 7 School", "ProIELTS", "Global English", "LangMaster"].map((name, i) => (
              <span key={i} className="text-sm font-bold text-gray-700 tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────── */}
      <section id="academies" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="max-w-2xl mx-auto mb-14">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-5 text-white rounded-sm"
                style={{ backgroundColor: RED }}
              >
                Sound familiar?
              </span>
              <h2 className="text-3xl md:text-[2.6rem] font-bold leading-snug mb-4 text-gray-900">
                Running an IELTS academy is harder than it should be.
              </h2>
              <p className="text-gray-500 text-base leading-relaxed">
                Most academies cobble together five different tools and still lose students through the cracks. OneSoft replaces all of it.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {academyPains.map((pain, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className="border-t-4 bg-white border border-gray-100 rounded-sm p-6 h-full hover:shadow-md transition-shadow" style={{ borderTopColor: RED }}>
                  <div
                    className="w-10 h-10 rounded-sm flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#fef2f2" }}
                  >
                    <pain.icon className="w-5 h-5" style={{ color: RED }} />
                  </div>
                  <h3 className="font-bold mb-2 text-gray-800">{pain.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{pain.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-10">
            <div className="flex items-center gap-3 px-6 py-4 rounded-sm border-l-4 bg-emerald-50 border-emerald-500 max-w-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-emerald-800">OneSoft LMS solves every one of these — in a single platform.</span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="max-w-2xl mx-auto mb-14">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-5 text-white rounded-sm"
                style={{ backgroundColor: NAVY }}
              >
                Platform Features
              </span>
              <h2 className="text-3xl md:text-[2.6rem] font-bold leading-snug mb-4 text-gray-900">
                Everything your academy needs, built in.
              </h2>
              <p className="text-gray-500 text-base leading-relaxed">
                No integrations. No duct tape. One platform designed end-to-end for how IELTS academies actually operate.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feat, i) => (
              <RevealSection key={i} className={`stagger-${i % 3 + 1}`}>
                <div className="group bg-white rounded-sm border border-gray-100 p-7 h-full flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-t-4" style={{ borderTopColor: NAVY }}>
                  <div
                    className="w-12 h-12 rounded-sm flex items-center justify-center mb-5"
                    style={{ backgroundColor: "#eef0f8" }}
                  >
                    <feat.icon className="w-6 h-6" style={{ color: NAVY }} />
                  </div>
                  <h3 className="text-base font-bold mb-2.5 text-gray-900">{feat.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">{feat.desc}</p>
                  <ul className="space-y-2">
                    {feat.bullets.map((b, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="max-w-2xl mx-auto mb-14">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-5 text-white rounded-sm"
                style={{ backgroundColor: RED }}
              >
                How It Works
              </span>
              <h2 className="text-3xl md:text-[2.6rem] font-bold leading-snug mb-4 text-gray-900">
                Up and running in 3 steps.
              </h2>
              <p className="text-gray-500 text-base leading-relaxed">
                From zero to a fully functioning online IELTS academy in under 48 hours.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
            {[
              {
                num: "01",
                icon: Settings,
                title: "Build your curriculum",
                desc: "Use the drag-and-drop curriculum builder to organise your programme into courses, units, and lessons across all four IELTS bands. Import your existing content or start fresh.",
                detail: "Takes about 2–4 hours for a full programme",
              },
              {
                num: "02",
                icon: Users,
                title: "Enroll your students",
                desc: "Create student profiles with band targets and exam dates. Enroll them into courses individually or in bulk. Each student instantly gets access to their own portal.",
                detail: "Bulk enrollment via CSV import",
              },
              {
                num: "03",
                icon: BarChart3,
                title: "Track and improve",
                desc: "Assign quizzes and tasks, grade submissions, leave feedback, and monitor every student's progress through the unified gradebook and analytics dashboard.",
                detail: "Real-time updates as students complete work",
              },
            ].map((step, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className="relative bg-white rounded-sm border border-gray-200 p-8 hover:shadow-lg transition-all duration-300 group h-full border-l-4" style={{ borderLeftColor: NAVY }}>
                  <div
                    className="w-12 h-12 rounded-sm text-white flex items-center justify-center font-bold text-base mb-5 shadow-sm"
                    style={{ backgroundColor: NAVY }}
                  >
                    {step.num}
                  </div>
                  <step.icon className="w-5 h-5 text-gray-400 mb-4" />
                  <h3 className="text-base font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{step.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {step.detail}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── IELTS TOOLS ──────────────────────────────────────────────── */}
      <section id="ielts-tools" className="py-20 md:py-28" style={{ backgroundColor: NAVY }}>
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="max-w-2xl mx-auto mb-14">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-5 rounded-sm"
                style={{ backgroundColor: RED, color: "#fff" }}
              >
                IELTS-Native Tools
              </span>
              <h2 className="text-3xl md:text-[2.6rem] font-bold leading-snug mb-4 text-white">
                Built for every band. Not adapted for none.
              </h2>
              <p className="text-white/60 text-base leading-relaxed">
                Generic LMS platforms treat all content the same. We built specialist tools for each of the four IELTS bands.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
            {ieltsBands.map((band, i) => (
              <RevealSection key={i} className={`stagger-${i % 2 + 1}`}>
                <div className="group bg-white/5 border border-white/10 rounded-sm p-7 hover:bg-white/10 hover:border-white/25 transition-all duration-300">
                  <div
                    className="w-12 h-12 rounded-sm flex items-center justify-center mb-5 bg-white/10"
                  >
                    <band.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-3">{band.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{band.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-10">
            <div className="bg-white/5 border border-white/10 rounded-sm p-8 max-w-4xl">
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { label: "Question types supported", value: "12+" },
                  { label: "Lesson formats available", value: "8" },
                  { label: "Mock test formats", value: "Full IELTS" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-4xl font-bold text-white mb-1">{s.value}</p>
                    <p className="text-sm text-white/50">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── ADMIN CALLOUT ────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <div className="relative rounded-sm overflow-hidden shadow-2xl aspect-[4/3] border border-gray-100 bg-gray-50">
                <img
                  src="/platform-mockup.png"
                  alt="OneSoft LMS Admin Dashboard"
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <div className="absolute top-4 right-4 bg-white rounded-sm px-4 py-2.5 shadow-lg border border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-gray-700">Live admin dashboard</span>
                </div>
              </div>
            </RevealSection>

            <div className="space-y-8">
              <RevealSection>
                <span
                  className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4 text-white rounded-sm"
                  style={{ backgroundColor: NAVY }}
                >
                  Admin Control
                </span>
                <h2 className="text-3xl md:text-[2.4rem] font-bold mt-2 mb-4 leading-snug text-gray-900">
                  Everything in one admin view.
                </h2>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Academy managers get a unified dashboard: all courses, all teachers, all students, all submissions — with no switching between apps or spreadsheets.
                </p>
              </RevealSection>

              <div className="space-y-4">
                {[
                  { icon: GraduationCap, title: "Student profiles with band history", desc: "Track each student's target band, exam dates, past scores, and full lesson completion history." },
                  { icon: ClipboardList, title: "Assignment workflow automation", desc: "Assignments are auto-distributed to enrolled students, deadlines enforced, and submissions collected in one place." },
                  { icon: BarChart3, title: "Cross-teacher gradebook", desc: "See every student's score across all courses and all teachers from a single gradebook view." },
                  { icon: Lock, title: "Full tenant isolation", desc: "Your academy's data is completely private. No data is ever shared with other academies on the platform." },
                ].map((item, i) => (
                  <RevealSection key={i} className={`stagger-${i + 1}`}>
                    <div className="flex items-start gap-4">
                      <div
                        className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: "#eef0f8" }}
                      >
                        <item.icon className="w-4 h-4" style={{ color: NAVY }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-0.5 text-gray-800">{item.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="max-w-2xl mx-auto mb-14">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-5 text-white rounded-sm"
                style={{ backgroundColor: RED }}
              >
                Academy Stories
              </span>
              <h2 className="text-3xl md:text-[2.6rem] font-bold leading-snug text-gray-900">
                What academy directors say.
              </h2>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className="bg-white rounded-sm border border-gray-100 p-7 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow border-t-4" style={{ borderTopColor: NAVY }}>
                  <div className="flex mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <Quote className="w-7 h-7 mb-3 opacity-20" style={{ color: NAVY }} />
                  <p className="text-gray-700 text-sm leading-relaxed mb-7 flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: NAVY }}
                    >
                      {t.author[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{t.author}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="max-w-2xl mx-auto mb-14">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-5 text-white rounded-sm"
                style={{ backgroundColor: NAVY }}
              >
                Pricing
              </span>
              <h2 className="text-3xl md:text-[2.6rem] font-bold leading-snug mb-4 text-gray-900">
                Plans for every academy size.
              </h2>
              <p className="text-gray-500 text-base leading-relaxed">
                Start free, scale when you grow. No hidden fees, no per-student charges on the Academy plan.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
            {plans.map((plan, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div
                  className={`relative rounded-sm p-7 h-full flex flex-col ${
                    plan.highlight
                      ? "text-white shadow-2xl scale-[1.03]"
                      : "bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  }`}
                  style={plan.highlight ? { backgroundColor: NAVY } : {}}
                >
                  {plan.highlight && (
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-sm text-white text-xs font-bold shadow-md whitespace-nowrap"
                      style={{ backgroundColor: RED }}
                    >
                      Best for Growing Academies
                    </div>
                  )}
                  <div className="mb-6">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>
                      {plan.name}
                    </p>
                    <div className="flex items-end gap-1 mb-3">
                      {plan.price !== "Custom" && (
                        <span className={`text-lg font-medium ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>$</span>
                      )}
                      <span className="text-5xl font-bold leading-none">{plan.price}</span>
                      {plan.period && (
                        <span className={`text-sm mb-1.5 ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>{plan.period}</span>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${plan.highlight ? "text-white/70" : "text-gray-500"}`}>{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-emerald-300" : "text-emerald-500"}`} />
                        <span className={plan.highlight ? "text-white/90" : "text-gray-700"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={plan.cta === "Talk to Sales" ? "mailto:contact@onesoftlms.com" : "/lms/"}
                    className="w-full py-3 text-center text-sm font-semibold rounded-sm transition-opacity hover:opacity-90"
                    style={
                      plan.highlight
                        ? { backgroundColor: RED, color: "#fff" }
                        : { backgroundColor: NAVY, color: "#fff" }
                    }
                  >
                    {plan.cta}
                  </a>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-10">
            <p className="text-sm text-gray-500">
              All plans include a <span className="font-semibold text-gray-800">free 14-day trial</span> with full access. No credit card required.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <RevealSection>
            <div className="mb-12">
              <span
                className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-5 text-white rounded-sm"
                style={{ backgroundColor: NAVY }}
              >
                FAQ
              </span>
              <h2 className="text-3xl md:text-[2.4rem] font-bold text-gray-900">Questions from academy directors.</h2>
            </div>
          </RevealSection>

          <RevealSection className="stagger-1">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-white border border-gray-200 rounded-sm px-5 shadow-sm data-[state=open]:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-5 text-left text-gray-800" style={{ ["--hover-color" as string]: RED }}>
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 text-sm leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </RevealSection>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 relative overflow-hidden" style={{ backgroundColor: NAVY }}>
        <div className="absolute inset-0 opacity-20" style={{
          background: "radial-gradient(ellipse 60% 70% at 80% 30%, #2a5298 0%, transparent 65%)",
        }} />
        <div className="relative container mx-auto px-4 md:px-6 max-w-3xl">
          <RevealSection>
            <span
              className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6 text-white rounded-sm"
              style={{ backgroundColor: RED }}
            >
              For IELTS Academies
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to transform<br />your academy?
            </h2>
            <p className="text-white/60 text-base mb-10 max-w-xl leading-relaxed">
              Join 40+ IELTS academies already delivering higher band scores with less admin work. Set up takes under 48 hours — and the first 14 days are free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/lms/"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white rounded-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: RED }}
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@onesoftlms.com"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white border border-white/30 rounded-sm hover:bg-white/10 transition-colors"
              >
                Book a Demo Call
              </a>
            </div>
            <p className="text-white/30 text-xs mt-6">No credit card required · Full access during trial · Cancel anytime</p>
          </RevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
