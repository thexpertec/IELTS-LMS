import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Button } from "@/components/ui/button";
import {
  BookOpen, PenTool, Headphones, Mic, ArrowRight, CheckCircle2, Quote,
  BarChart3, Users, Layers, Shield, Star, TrendingUp, Zap, GraduationCap,
  ClipboardList, MessageSquare, FileText, Settings, Clock, Award,
  ChevronRight, Building2, Globe, Lock, LayoutDashboard, PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={cn("reveal-on-scroll", isVisible && "is-visible", className)}>
      {children}
    </div>
  );
}

/* ─── DATA ───────────────────────────────────────────────────────── */

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
    color: "bg-indigo-50 text-indigo-600",
    title: "Curriculum Builder",
    desc: "Structure your entire IELTS programme into Courses → Units → Lessons. 8 purpose-built lesson types cover every format the exam demands.",
    bullets: ["Lecture & reading lessons", "Listening & speaking labs", "Grammar & vocabulary drills", "Quiz & assessment nodes"],
  },
  {
    icon: ClipboardList,
    color: "bg-violet-50 text-violet-600",
    title: "Assignment & Quiz System",
    desc: "Create assignments and auto-graded quizzes with IELTS-native question formats. Attach reference links, set due dates, and review every submission.",
    bullets: ["Fill-in-the-blank, matching, MCQ", "Timed mock-test mode", "Reference link attachments", "Submission links from students"],
  },
  {
    icon: BarChart3,
    color: "bg-emerald-50 text-emerald-600",
    title: "Gradebook & Analytics",
    desc: "A unified gradebook per course gives every teacher instant visibility into each student's scores, completion rate, and trajectory.",
    bullets: ["Per-student score tracking", "Assignment & quiz combined view", "Progress by lesson type", "Export-ready reports"],
  },
  {
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    title: "Student & Enrollment Management",
    desc: "Enroll students into courses individually or in bulk. Track profiles, band targets, exam dates, and national test history in one place.",
    bullets: ["Detailed student profiles", "Band target & exam date tracking", "Bulk enrollment tools", "Cross-course progress view"],
  },
  {
    icon: MessageSquare,
    color: "bg-orange-50 text-orange-600",
    title: "Stream & Messaging",
    desc: "Every course has a built-in stream for announcements and discussion. Teachers and students stay in sync without leaving the platform.",
    bullets: ["Course-level announcement feed", "Direct teacher–student messages", "File & link sharing in chat", "Mobile-friendly notifications"],
  },
  {
    icon: LayoutDashboard,
    color: "bg-pink-50 text-pink-600",
    title: "Branded Student Portal",
    desc: "Students get a clean, focused portal showing their courses, assignments, quiz results, and feedback — nothing else to distract them.",
    bullets: ["My courses & lesson access", "Assignment submission UI", "Quiz-taking environment", "Grade & feedback view"],
  },
];

const ieltsBands = [
  { icon: BookOpen, title: "Reading", color: "text-blue-600 bg-blue-50", desc: "Side-by-side text and question panels with 12+ IELTS question types — matching headings, T/F/NG, sentence completion, and more." },
  { icon: PenTool, title: "Writing", color: "text-violet-600 bg-violet-50", desc: "Task 1 and Task 2 writing lessons with word-count tools, rich editor, and detailed tutor annotation and inline feedback." },
  { icon: Headphones, title: "Listening", color: "text-emerald-600 bg-emerald-50", desc: "Integrated audio player with synchronized multiple-choice, map completion, and form-fill question panels." },
  { icon: Mic, title: "Speaking", color: "text-orange-600 bg-orange-50", desc: "Speaking prompts with in-browser recording, examiner-style Part 1/2/3 structure, and pinpoint audio feedback from tutors." },
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
    quote: "Our band score improvement jumped after we moved to OneSoft. The structured curriculum with proper lessons forced students to follow the full programme instead of skipping around.",
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
    a: "Most academies are fully live within 48 hours. Our onboarding team helps you migrate existing materials, set up your curriculum structure, and enroll your first cohort. The platform itself takes minutes to configure.",
  },
  {
    q: "Can multiple teachers manage different classes?",
    a: "Yes. You can create unlimited teacher accounts on the Academy and Enterprise plans. Each teacher manages their own courses and students, while academy admins have a full cross-teacher view.",
  },
  {
    q: "Does it support computer-delivered IELTS formatting?",
    a: "Absolutely. Our lesson and quiz interfaces are meticulously designed to replicate the computer-delivered IELTS experience — split-screen reading, inline highlighting, timed sections, and all official question formats.",
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

/* ─── COMPONENT ──────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-24 md:pt-44 md:pb-36">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#1e1b4b] to-[#2e1065]" />
        <div className="orb w-[700px] h-[700px] bg-indigo-600/25 top-[-300px] right-[-150px]" />
        <div className="orb w-[500px] h-[500px] bg-violet-600/15 bottom-[-200px] left-[-100px]" />
        <div className="orb w-[350px] h-[350px] bg-emerald-500/10 top-[100px] left-[45%]" />

        <div className="relative container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <RevealSection>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium mb-8 backdrop-blur-sm">
                <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                The LMS built for IELTS Academies
              </div>
            </RevealSection>

            <RevealSection className="stagger-1">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.06] text-white mb-6 tracking-tight">
                Run your entire<br />
                IELTS academy<br />
                <span className="gradient-text">on one platform.</span>
              </h1>
            </RevealSection>

            <RevealSection className="stagger-2">
              <p className="text-lg md:text-xl text-white/65 mb-10 leading-relaxed max-w-2xl mx-auto">
                Curriculum builder, IELTS-native quizzes, assignment grading, gradebook, student portal, and real-time analytics — everything your academy needs to deliver outstanding band scores, without the admin chaos.
              </p>
            </RevealSection>

            <RevealSection className="stagger-3">
              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-5">
                <Button size="lg" className="h-13 px-8 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/40" asChild>
                  <a href="/lms/">Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></a>
                </Button>
                <Button size="lg" className="h-13 px-8 text-base font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20" asChild>
                  <a href="#features">See All Features</a>
                </Button>
              </div>
              <p className="text-xs text-white/40">Free 14-day trial · No credit card required · Setup in under 48 hours</p>
            </RevealSection>
          </div>

          {/* Floating proof cards */}
          <RevealSection className="stagger-4">
            <div className="flex flex-wrap justify-center gap-4 mt-14">
              {[
                { icon: TrendingUp, label: "+1.5 Band improvement", color: "text-emerald-400" },
                { icon: GraduationCap, label: "12,000+ active students", color: "text-indigo-300" },
                { icon: Building2, label: "40+ IELTS academies", color: "text-violet-300" },
                { icon: Star, label: "98% satisfaction rate", color: "text-yellow-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 backdrop-blur-sm">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm text-white/80 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── SOCIAL PROOF LOGOS ────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50/50 py-10">
        <div className="container mx-auto px-4 md:px-6">
          <p className="text-center text-[10px] font-bold text-gray-400 mb-7 uppercase tracking-[0.2em]">
            Trusted by IELTS academies across 15 countries
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-45 hover:opacity-75 transition-opacity duration-500">
            {["Excel Academy", "BritPrep", "Band 7 School", "ProIELTS", "Global English", "LangMaster"].map((name, i) => (
              <span key={i} className="text-sm font-bold text-gray-700 tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ───────────────────────────────────────────── */}
      <section id="academies" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-500 text-xs font-semibold mb-4 uppercase tracking-wide">
                Sound familiar?
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5">
                Running an IELTS academy<br className="hidden md:block" /> is harder than it should be.
              </h2>
              <p className="text-lg text-muted-foreground">
                Most academies cobble together five different tools and still lose students through the cracks. OneSoft replaces all of it.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {academyPains.map((pain, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className="bg-red-50/60 border border-red-100 rounded-2xl p-6 h-full">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                    <pain.icon className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="font-bold mb-2 text-gray-800">{pain.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{pain.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/5 border border-primary/15">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">OneSoft LMS solves every one of these — in a single platform.</span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ─────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 bg-gray-50/60">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">
                Platform Features
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5">
                Everything your academy needs, built in.
              </h2>
              <p className="text-lg text-muted-foreground">
                No integrations. No duct tape. One platform designed end-to-end for how IELTS academies actually operate.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feat, i) => (
              <RevealSection key={i} className={`stagger-${i % 3 + 1}`}>
                <div className="group bg-white rounded-2xl border border-gray-100 p-7 h-full flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl ${feat.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2.5">{feat.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">{feat.desc}</p>
                  <ul className="space-y-2">
                    {feat.bullets.map((b, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
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

      {/* ── ACADEMY WORKFLOW ──────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">
                How It Works
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5">Up and running in 3 steps.</h2>
              <p className="text-lg text-muted-foreground">From zero to a fully functioning online IELTS academy in under 48 hours.</p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                <div className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm mb-5 shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                    {step.num}
                  </div>
                  <step.icon className="w-5 h-5 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{step.desc}</p>
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

      {/* ── IELTS TOOLS ───────────────────────────────────────────── */}
      <section id="ielts-tools" className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#1e1b4b] to-[#2e1065]">
        <div className="orb w-[500px] h-[500px] bg-indigo-500/20 top-[-100px] right-[-150px]" />
        <div className="orb w-[400px] h-[400px] bg-violet-500/15 bottom-[-100px] left-[-100px]" />

        <div className="relative container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-4 uppercase tracking-wide border border-white/15">
                IELTS-Native Tools
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5 text-white">
                Built for every band.<br />Not adapted for none.
              </h2>
              <p className="text-lg text-white/60">
                Generic LMS platforms treat all content the same. We built specialist tools for each of the four IELTS bands.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {ieltsBands.map((band, i) => (
              <RevealSection key={i} className={`stagger-${i % 2 + 1}`}>
                <div className="group bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl ${band.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                    <band.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{band.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{band.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-12">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { label: "Question types supported", value: "12+" },
                  { label: "Lesson formats available", value: "8" },
                  { label: "Mock test formats", value: "Full IELTS" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-white/55">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── ADMIN DASHBOARD CALLOUT ───────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] border border-gray-100 bg-gray-50">
                <img
                  src="/platform-mockup.png"
                  alt="OneSoft LMS Admin Dashboard"
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                {/* floating badge */}
                <div className="absolute top-4 right-4 bg-white rounded-xl px-4 py-2.5 shadow-lg border border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-gray-700">Live admin dashboard</span>
                </div>
              </div>
            </RevealSection>

            <div className="space-y-8">
              <RevealSection>
                <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-2 uppercase tracking-wide">
                  Admin Control
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
                  Everything in one admin view.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
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
                      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-0.5">{item.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-gray-50/60">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">
                Academy Stories
              </span>
              <h2 className="text-3xl md:text-5xl font-bold">What academy directors say.</h2>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-7 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-primary/20 mb-3" />
                  <p className="text-foreground text-sm leading-relaxed mb-7 flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {t.author[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.author}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">
                Pricing
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5">Plans for every academy size.</h2>
              <p className="text-muted-foreground text-lg">Start free, scale when you grow. No hidden fees, no per-student charges on Academy plan.</p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className={`relative rounded-2xl p-7 h-full flex flex-col ${
                  plan.highlight
                    ? "bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.03]"
                    : "bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                }`}>
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-400 text-white text-xs font-bold shadow-md whitespace-nowrap">
                      Best for Growing Academies
                    </div>
                  )}
                  <div className="mb-6">
                    <p className={`text-sm font-semibold mb-2 ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>{plan.name}</p>
                    <div className="flex items-end gap-1 mb-3">
                      {plan.price !== "Custom" && <span className={`text-lg font-medium ${plan.highlight ? "text-white/65" : "text-muted-foreground"}`}>$</span>}
                      <span className="text-5xl font-bold leading-none">{plan.price}</span>
                      {plan.period && <span className={`text-sm mb-1.5 ${plan.highlight ? "text-white/60" : "text-muted-foreground"}`}>{plan.period}</span>}
                    </div>
                    <p className={`text-sm leading-relaxed ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-emerald-300" : "text-emerald-500"}`} />
                        <span className={plan.highlight ? "text-white/90" : "text-foreground"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-xl h-11 font-semibold text-sm ${
                      plan.highlight
                        ? "bg-white text-primary hover:bg-white/90"
                        : "bg-primary text-white hover:bg-primary/90"
                    }`}
                    asChild
                  >
                    <a href={plan.cta === "Talk to Sales" ? "mailto:contact@onesoftlms.com" : "/lms/"}>
                      {plan.cta}
                    </a>
                  </Button>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              All plans include a <span className="font-semibold text-foreground">free 14-day trial</span> with full access. No credit card required.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50/60">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold">Questions from academy directors.</h2>
            </div>
          </RevealSection>

          <RevealSection className="stagger-1">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-white border border-gray-100 rounded-xl px-5 shadow-sm data-[state=open]:shadow-md transition-shadow">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary py-5 text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </RevealSection>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#1e1b4b] to-[#2e1065]" />
        <div className="orb w-[600px] h-[600px] bg-primary/30 top-[-200px] left-[-100px]" />
        <div className="orb w-[400px] h-[400px] bg-violet-500/20 bottom-[-100px] right-[-50px]" />

        <div className="relative container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <RevealSection>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-8 uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5 text-indigo-300" />
              For IELTS Academies
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to transform<br />your academy?
            </h2>
            <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
              Join 40+ IELTS academies already delivering higher band scores with less admin work. Set up takes under 48 hours — and the first 14 days are free.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="h-13 px-10 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/40" asChild>
                <a href="/lms/">Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></a>
              </Button>
              <Button size="lg" className="h-13 px-10 text-base font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20" asChild>
                <a href="mailto:contact@onesoftlms.com">Book a Demo Call</a>
              </Button>
            </div>
            <p className="text-xs text-white/35 mt-6">No credit card required · Full access during trial · Cancel anytime</p>
          </RevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
