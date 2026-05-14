import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BookOpen, PenTool, Headphones, Mic, ArrowRight, CheckCircle2,
  GraduationCap, ClipboardList, BarChart3, MessageSquare, Bell,
  ChevronRight, Users, Target, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicTenantInfo {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  adminEmail: string;
  tagline: string;
  welcomeMessage: string;
  accentColor: string;
}

function usePublicTenantInfo() {
  return useQuery<PublicTenantInfo | null>({
    queryKey: ["tenant-public"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/public", { credentials: "include" });
      if (!res.ok) return null;
      return res.json() as Promise<PublicTenantInfo | null>;
    },
    staleTime: 1000 * 60 * 10,
  });
}

const ieltsPillars = [
  {
    icon: BookOpen,
    title: "Reading",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    desc: "Side-by-side passages with 12+ IELTS question types — matching headings, True/False/Not Given, sentence completion, and more.",
  },
  {
    icon: PenTool,
    title: "Writing",
    color: "bg-violet-50 text-violet-600 border-violet-100",
    desc: "Task 1 and Task 2 lessons with word-count tools, rich editor, and detailed tutor feedback with inline annotations.",
  },
  {
    icon: Headphones,
    title: "Listening",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    desc: "Integrated audio player with synchronised MCQ, map completion, and form-fill panels — exactly like the real exam.",
  },
  {
    icon: Mic,
    title: "Speaking",
    color: "bg-orange-50 text-orange-600 border-orange-100",
    desc: "In-browser recording for Parts 1, 2 & 3. Tutors leave pinpoint audio feedback directly on your responses.",
  },
];

const studentFeatures = [
  { icon: BookOpen, title: "All your courses in one place", desc: "Access every lesson, video, and reading your academy has assigned — organised by course and unit." },
  { icon: ClipboardList, title: "Quizzes & mock tests", desc: "Practice with timed, IELTS-format quizzes. Get instant scores and see exactly which questions you got wrong." },
  { icon: ClipboardList, title: "Assignment submissions", desc: "Submit writing tasks and assignments directly on the platform. Your tutor marks and returns feedback fast." },
  { icon: BarChart3, title: "Track your progress", desc: "A personal dashboard shows your completion rate, quiz scores, and improvement over time across all four skills." },
  { icon: MessageSquare, title: "Message your tutor", desc: "Ask questions and get answers directly from your teacher — no need to switch apps or hunt for an email." },
  { icon: Bell, title: "Never miss a deadline", desc: "Notifications remind you about upcoming assignments, new lessons, and tutor feedback — right inside the portal." },
];

const howItWorks = [
  { step: "01", title: "Your academy enrols you", desc: "Your teacher sets up your account and enrols you in the right course for your current band level and target." },
  { step: "02", title: "Follow your programme", desc: "Work through lessons in order — reading passages, writing tasks, listening exercises, and speaking labs." },
  { step: "03", title: "Get feedback & improve", desc: "Submit assignments, take quizzes, and review tutor feedback. Watch your band score grow." },
];

export default function TenantLanding() {
  const { data: tenant } = usePublicTenantInfo();

  const academyName = tenant?.name ?? "Your IELTS Academy";
  const tagline = tenant?.tagline || tenant?.description || "The complete IELTS learning portal for your students.";
  const welcomeMessage = tenant?.welcomeMessage || "";

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Top red utility bar ── */}
      <div className="bg-[#CC0000] shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-9 flex items-center justify-end gap-0">
          <a
            href="/lms/admin-login"
            className="px-4 h-9 flex items-center text-white text-sm font-medium hover:bg-white/15 transition-colors"
          >
            Admin Login
          </a>
          <Link
            href="/student/login"
            className="px-4 h-9 flex items-center text-white text-sm font-medium bg-white/20"
          >
            Student Login
          </Link>
        </div>
      </div>

      {/* ── Navy branding bar ── */}
      <div className="bg-[#0d1b60] shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt={academyName} className="h-9 w-auto rounded" />
            ) : (
              <div className="w-10 h-10 rounded bg-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-[#0d1b60]" />
              </div>
            )}
            <div className="leading-tight">
              <span className="text-white font-bold text-xl tracking-tight">{academyName}</span>
            </div>
          </div>
          <Link
            href="/student/login"
            className="hidden sm:flex items-center gap-2 px-5 h-9 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-semibold transition-colors"
          >
            Student Login <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Navigation tab bar ── */}
      <div className="bg-[#162270] border-b border-white/10 shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <nav className="flex items-end gap-0 h-10">
            {[
              { label: "Home", href: "#home" },
              { label: "What You'll Learn", href: "#skills" },
              { label: "Features", href: "#features" },
              { label: "How It Works", href: "#how-it-works" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 h-10 flex items-center text-sm font-medium text-white/65 hover:text-white hover:bg-white/5 border-b-2 border-transparent hover:border-white/30 transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Hero ── */}
      <section
        id="home"
        className="relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          minHeight: "520px",
        }}
      >
        <div className="absolute inset-0 bg-[#0d1b60]/55" />
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 md:px-8 py-16 md:py-24 flex flex-col lg:flex-row items-start gap-10">

          {/* White card */}
          <div className="bg-white w-full lg:w-[480px] shrink-0 p-8 shadow-2xl">
            {welcomeMessage && (
              <p className="text-[#CC0000] text-sm font-semibold mb-3 uppercase tracking-wide">
                {welcomeMessage}
              </p>
            )}
            <h1 className="text-3xl font-bold text-[#0d1b60] leading-tight mb-4">
              Start your IELTS<br />journey with us.
            </h1>
            <p className="text-gray-600 leading-relaxed mb-7 text-sm">
              {tagline}
            </p>
            <Link href="/student/login">
              <Button className="w-full h-12 rounded-none bg-[#CC0000] hover:bg-[#aa0000] text-white font-semibold gap-2 text-base">
                Log In as a Student <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-center text-xs text-gray-400 mt-4">
              Use the credentials provided by your academy.
            </p>
          </div>

          {/* Right stats */}
          <div className="text-white lg:pl-8 self-center">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Everything you need<br />to achieve Band 7+.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-md">
              Your personalised IELTS programme — reading, writing, listening, and speaking — guided by expert tutors, all in one place.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              {[
                { icon: BookOpen, label: "Structured Courses" },
                { icon: ClipboardList, label: "IELTS-Format Quizzes" },
                { icon: BarChart3, label: "Progress Tracking" },
                { icon: MessageSquare, label: "Tutor Feedback" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-white/80 text-sm font-medium">
                  <item.icon className="w-4 h-4 text-[#3DB7E4] shrink-0" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── IELTS skills ── */}
      <section id="skills" className="py-20 bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CC0000]/8 text-[#CC0000] text-xs font-bold uppercase tracking-wider mb-4">
              All Four IELTS Skills
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b60] mb-4">
              Practise every part of the exam.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Your academy has built dedicated lessons for all four skills — each designed to mirror the real IELTS exam format.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ieltsPillars.map((pillar) => (
              <div key={pillar.title} className={`rounded-none border-t-4 border-t-[#CC0000] bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-10 h-10 rounded flex items-center justify-center mb-4 ${pillar.color} border`}>
                  <pillar.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0d1b60] mb-2">{pillar.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Student features ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0d1b60]/8 text-[#0d1b60] text-xs font-bold uppercase tracking-wider mb-4">
              Student Portal
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0d1b60] mb-4">
              Your learning hub — all in one place.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Everything you need to study, submit work, and track your progress is inside the portal.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#0d1b60]/20 hover:shadow-sm transition-all">
                <div className="w-9 h-9 bg-[#0d1b60] flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0d1b60] mb-1 text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 bg-[#0d1b60]">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider mb-4">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Three steps to your target band.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0 max-w-4xl mx-auto">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative flex flex-col items-start p-8 border-l border-white/10 first:border-l-0">
                <span className="text-5xl font-black text-white/10 mb-4 leading-none">{item.step}</span>
                <h3 className="text-white font-bold text-lg mb-3">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                {i < howItWorks.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-[#CC0000] hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What students achieve ── */}
      <section className="py-16 bg-gray-50 border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Target, value: "+1.5", label: "Average band improvement" },
              { icon: Users, value: "12K+", label: "Students on the platform" },
              { icon: Award, value: "98%", label: "Academy satisfaction rate" },
              { icon: CheckCircle2, value: "8", label: "IELTS-native lesson types" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <s.icon className="w-7 h-7 text-[#CC0000] mb-3" />
                <p className="text-3xl font-black text-[#0d1b60] mb-1">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#0d1b60] mb-4">
            Ready to start learning?
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Log in with the credentials your academy has provided and begin your IELTS programme today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/student/login">
              <Button className="h-12 px-10 rounded-none bg-[#CC0000] hover:bg-[#aa0000] text-white font-semibold gap-2 text-base">
                Student Login <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {tenant?.adminEmail && (
              <a href={`mailto:${tenant.adminEmail}`}>
                <Button variant="outline" className="h-12 px-10 rounded-none border-[#0d1b60] text-[#0d1b60] hover:bg-[#0d1b60] hover:text-white font-semibold text-base">
                  Contact Your Academy
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0a1550] py-8 mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-[#0d1b60]" />
            </div>
            <span className="text-white/70 text-sm font-medium">{academyName}</span>
          </div>
          <p className="text-white/35 text-xs">
            © {new Date().getFullYear()} {academyName}. Powered by IELTS Academy LMS.
          </p>
          <a
            href="/lms/admin-login"
            className="text-white/35 hover:text-white/60 text-xs transition-colors"
          >
            Admin Login
          </a>
        </div>
      </footer>
    </div>
  );
}
