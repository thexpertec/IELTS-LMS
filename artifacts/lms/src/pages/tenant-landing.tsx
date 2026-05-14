import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BookOpen, PenTool, Headphones, Mic, Home,
  GraduationCap, ClipboardList, BarChart3, MessageSquare,
  Users, CheckCircle, Search,
} from "lucide-react";

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

/* ── BC exact color tokens ─────────────────────────────────────────────────── */
const BC_RED    = "#C8102E";
const BC_NAVY   = "#1F1F6B";
const BC_BLUE   = "#009BDE";   // bright blue nav bar
const BC_CYAN   = "#3DBBDB";   // active tab / accent

const navTabs = [
  { label: "My Learning", href: "#learning" },
  { label: "Courses", href: "#courses" },
  { label: "IELTS Skills", href: "#skills" },
  { label: "Results & Progress", href: "#progress" },
];

const ieltsPillars = [
  {
    icon: BookOpen,
    title: "Academic Reading",
    img: "/lms/images/reading.jpg",
    desc: "Develop skills for every IELTS reading question type — matching headings, True/False/Not Given, sentence completion, and multiple choice.",
    color: BC_BLUE,
  },
  {
    icon: PenTool,
    title: "Academic Writing",
    img: "/lms/images/writing.jpg",
    desc: "Master Task 1 and Task 2 with structured writing exercises, vocabulary building, and detailed tutor feedback on every submission.",
    color: BC_RED,
  },
  {
    icon: Headphones,
    title: "Listening",
    img: "/lms/images/listening.jpg",
    desc: "Practise with authentic listening exercises using an integrated audio player and IELTS-format question panels including maps and forms.",
    color: BC_CYAN,
  },
  {
    icon: Mic,
    title: "Speaking",
    img: "/lms/images/speaking.jpg",
    desc: "Record your answers for Parts 1, 2 & 3 directly in the browser. Receive pinpoint audio feedback from your tutor on each response.",
    color: "#6B2D8B",
  },
];

const portalFeatures = [
  {
    icon: ClipboardList,
    title: "Quizzes & Mock Tests",
    desc: "Timed, IELTS-format quizzes with instant scoring. Review every answer in detail to understand your mistakes.",
  },
  {
    icon: BookOpen,
    title: "Structured Curriculum",
    desc: "Your academy organises lessons into courses and units — follow your personalised programme step by step.",
  },
  {
    icon: MessageSquare,
    title: "Assignment Submissions",
    desc: "Submit writing and speaking tasks directly on the platform. Your tutor marks and returns feedback quickly.",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    desc: "Your personal dashboard shows completion rates, quiz scores, and improvement trends across all four skills.",
  },
  {
    icon: MessageSquare,
    title: "Message Your Tutor",
    desc: "Ask questions and get answers from your teacher directly inside the portal — no switching between apps.",
  },
  {
    icon: Users,
    title: "Study with Classmates",
    desc: "Course announcements and discussion streams keep you connected with your cohort throughout the programme.",
  },
];

const howSteps = [
  {
    num: "1",
    title: "Get enrolled",
    desc: "Your academy creates your account and enrols you into the right course for your current band level and target score.",
  },
  {
    num: "2",
    title: "Follow your programme",
    desc: "Work through reading passages, writing tasks, listening exercises and speaking labs — in the order your teacher designed.",
  },
  {
    num: "3",
    title: "Submit & get feedback",
    desc: "Complete assignments and quizzes, receive tutor feedback, and track your improvement week by week.",
  },
  {
    num: "4",
    title: "Achieve your band score",
    desc: "With a structured programme and consistent feedback, reach the IELTS band score you need — faster.",
  },
];

export default function TenantLanding() {
  const { data: tenant } = usePublicTenantInfo();

  const academyName = tenant?.name ?? "IELTS Academy";
  const tagline = tenant?.tagline || tenant?.description || "";
  const welcomeMsg = tenant?.welcomeMessage || "";

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#333]">

      {/* ══════════════════════════════════════
          TIER 1 — Red utility bar
      ══════════════════════════════════════ */}
      <div style={{ backgroundColor: BC_RED }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-10 flex items-center justify-end gap-1">
          <a
            href="/lms/admin-login"
            className="px-3 py-1 text-white text-[13px] font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors"
          >
            Admin Login
          </a>
          <Link
            href="/student/login"
            className="px-3 py-1 text-white text-[13px] font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors"
          >
            Log in
          </Link>
          <button className="flex items-center gap-1.5 px-3 py-1 text-white text-[13px] font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors">
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TIER 2 — Navy logo bar
      ══════════════════════════════════════ */}
      <div style={{ backgroundColor: BC_NAVY }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-[72px] flex items-center gap-5">
          {/* Academy logo / icon */}
          <div className="flex items-center gap-4">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt={academyName} className="h-11 w-auto" />
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
            <span className="text-white font-bold text-[26px] tracking-tight leading-none">
              {academyName}
            </span>
            <span className="text-white/40 text-[13px] mt-1 self-end pb-1">™</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TIER 3 — Bright blue navigation bar
      ══════════════════════════════════════ */}
      <div style={{ backgroundColor: BC_BLUE }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4">
          <nav className="flex items-stretch h-[44px]">
            {/* Home icon tab (active state — cyan background) */}
            <a
              href="#"
              style={{ backgroundColor: BC_CYAN }}
              className="flex items-center justify-center w-12 shrink-0 hover:brightness-95 transition-all"
              aria-label="Home"
            >
              <Home className="w-5 h-5 text-white" />
            </a>

            {navTabs.map((tab, i) => (
              <a
                key={i}
                href={tab.href}
                className="flex items-center px-4 h-full text-white text-[13px] font-medium whitespace-nowrap hover:bg-white/15 border-l border-white/20 transition-colors"
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* ══════════════════════════════════════
          HERO — full-width photo + floating card
      ══════════════════════════════════════ */}
      <div
        className="relative w-full shrink-0"
        style={{
          backgroundImage: "url('/lms/images/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          minHeight: "480px",
        }}
      >
        {/* Subtle left gradient to make card pop */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />

        {/* Floating white card — bottom left, BC style */}
        <div className="absolute bottom-8 left-4 md:left-10 w-[300px] md:w-[360px] bg-white shadow-xl p-8 rounded-sm">
          {welcomeMsg && (
            <p className="text-[13px] font-semibold uppercase tracking-widest mb-2" style={{ color: BC_RED }}>
              {welcomeMsg}
            </p>
          )}
          <h1 className="text-[26px] md:text-[30px] font-bold leading-snug mb-4" style={{ color: BC_NAVY }}>
            {tagline || "Start your future with IELTS"}
          </h1>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
            Your personalised IELTS learning programme — everything you need to reach your target band score, in one portal.
          </p>
          <Link href="/student/login">
            <button
              style={{ backgroundColor: BC_RED }}
              className="w-full py-3 text-white text-[14px] font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              Log in to Student Portal
            </button>
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAGLINE BAND
      ══════════════════════════════════════ */}
      <div className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-screen-md mx-auto px-4 text-center">
          <p className="text-[18px] md:text-[22px] font-bold leading-relaxed" style={{ color: BC_NAVY }}>
            Dreaming of studying, living or working abroad? Your IELTS journey starts here — in a structured programme designed by your academy.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          IELTS SKILLS — 4 photo cards (BC card-grid style)
      ══════════════════════════════════════ */}
      <section id="skills" className="py-14 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h2 className="text-[22px] font-bold" style={{ color: BC_NAVY }}>
              All four IELTS skills in your programme
            </h2>
            <div className="mt-2 h-1 w-16" style={{ backgroundColor: BC_RED }} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ieltsPillars.map((p) => (
              <div key={p.title} className="group cursor-pointer">
                <div className="relative overflow-hidden h-44">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: p.color }}
                  />
                </div>
                <div className="pt-4 pb-2 border-b-2 border-gray-100 group-hover:border-b-2" style={{}}>
                  <div className="flex items-center gap-2 mb-2">
                    <p.icon className="w-4 h-4 shrink-0" style={{ color: p.color }} />
                    <h3 className="font-bold text-[15px]" style={{ color: BC_NAVY }}>
                      {p.title}
                    </h3>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{p.desc}</p>
                  <a
                    href="/lms/student/login"
                    className="inline-flex items-center gap-1 mt-3 text-[13px] font-semibold hover:underline"
                    style={{ color: BC_BLUE }}
                  >
                    Start practising →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PORTAL FEATURES — BC info-block grid
      ══════════════════════════════════════ */}
      <section id="courses" className="py-14" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h2 className="text-[22px] font-bold" style={{ color: BC_NAVY }}>
              What's inside your student portal
            </h2>
            <div className="mt-2 h-1 w-16" style={{ backgroundColor: BC_RED }} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {portalFeatures.map((f, i) => (
              <div key={i} className="bg-white p-7 hover:bg-[#F0F7FC] transition-colors group">
                <div
                  className="w-10 h-10 flex items-center justify-center mb-4"
                  style={{ backgroundColor: BC_BLUE + "18" }}
                >
                  <f.icon className="w-5 h-5" style={{ color: BC_BLUE }} />
                </div>
                <h3 className="font-bold text-[15px] mb-2" style={{ color: BC_NAVY }}>
                  {f.title}
                </h3>
                <p className="text-[13px] text-gray-600 leading-relaxed mb-4">{f.desc}</p>
                <a
                  href="/lms/student/login"
                  className="text-[13px] font-semibold hover:underline"
                  style={{ color: BC_BLUE }}
                >
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS — BC step list
      ══════════════════════════════════════ */}
      <section id="learning" className="py-14 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h2 className="text-[22px] font-bold" style={{ color: BC_NAVY }}>
              How your programme works
            </h2>
            <div className="mt-2 h-1 w-16" style={{ backgroundColor: BC_RED }} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howSteps.map((step, i) => (
              <div key={i} className="flex flex-col">
                <div
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-[18px] mb-4 shrink-0"
                  style={{ backgroundColor: BC_BLUE }}
                >
                  {step.num}
                </div>
                <h3 className="font-bold text-[15px] mb-2" style={{ color: BC_NAVY }}>
                  {step.title}
                </h3>
                <p className="text-[13px] text-gray-600 leading-relaxed flex-1">{step.desc}</p>
                {i < howSteps.length - 1 && (
                  <div className="hidden lg:block absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BAND — BC style dark navy
      ══════════════════════════════════════ */}
      <section id="progress" className="py-12" style={{ backgroundColor: BC_NAVY }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "+1.5", label: "Average band improvement" },
              { val: "12K+", label: "Active students on the platform" },
              { val: "40+", label: "IELTS academies onboarded" },
              { val: "98%", label: "Academy satisfaction rate" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[36px] font-black text-white leading-none mb-2">{s.val}</p>
                <p className="text-[13px] text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════ */}
      <section className="py-14 bg-white border-t border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-[22px] font-bold mb-2" style={{ color: BC_NAVY }}>
                Ready to start your IELTS programme?
              </h2>
              <p className="text-[14px] text-gray-600 max-w-lg">
                Log in with the credentials your academy has provided and begin your personalised learning programme today.
              </p>
              {tenant?.adminEmail && (
                <p className="text-[13px] mt-2 text-gray-400">
                  Questions? Contact your academy:{" "}
                  <a href={`mailto:${tenant.adminEmail}`} className="hover:underline" style={{ color: BC_BLUE }}>
                    {tenant.adminEmail}
                  </a>
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/student/login">
                <button
                  style={{ backgroundColor: BC_RED }}
                  className="px-8 py-3 text-white text-[14px] font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Log in to Student Portal
                </button>
              </Link>
              <a href="/lms/admin-login">
                <button
                  style={{ backgroundColor: BC_NAVY }}
                  className="px-8 py-3 text-white text-[14px] font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Admin Login
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ backgroundColor: BC_NAVY }} className="mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {tenant?.logoUrl ? (
                <img src={tenant.logoUrl} alt={academyName} className="h-8 w-auto" />
              ) : (
                <div className="grid grid-cols-3 gap-0.5 w-6 h-6 shrink-0">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[1px]" />
                  ))}
                </div>
              )}
              <span className="text-white font-bold text-[16px]">{academyName}</span>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {["Student Login", "Admin Login", "Contact Academy"].map((label, i) => (
                <a
                  key={i}
                  href={i === 0 ? "/lms/student/login" : i === 1 ? "/lms/admin-login" : `mailto:${tenant?.adminEmail ?? ""}`}
                  className="text-white/60 hover:text-white text-[13px] transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>

            <p className="text-white/35 text-[12px]">
              © {new Date().getFullYear()} {academyName}. Powered by IELTS Academy LMS.
            </p>
          </div>
        </div>

        {/* BC-style bottom red stripe */}
        <div style={{ backgroundColor: BC_RED }} className="h-1.5 w-full" />
      </footer>
    </div>
  );
}
