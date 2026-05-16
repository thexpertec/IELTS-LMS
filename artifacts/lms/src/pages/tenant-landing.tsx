import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SeoHead } from "@/components/seo-head";
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

type CmsSections = Record<string, Record<string, unknown>>;

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

function useCmsSections() {
  return useQuery<CmsSections>({
    queryKey: ["tenant-cms-sections-public"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/cms-sections", { credentials: "include" });
      if (!res.ok) return {};
      return res.json() as Promise<CmsSections>;
    },
    staleTime: 1000 * 60 * 5,
  });
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}
function arr<T>(v: unknown, fallback: T[]): T[] {
  return Array.isArray(v) ? v as T[] : fallback;
}

/* ── BC exact color tokens ─────────────────────────────────────────────────── */
const BC_RED    = "#C8102E";
const BC_NAVY   = "#1F1F6B";
const BC_BLUE   = "#009BDE";
const BC_CYAN   = "#3DBBDB";

const navTabs = [
  { label: "My Learning",        href: "#learning" },
  { label: "Courses",            href: "/courses-list" },
  { label: "IELTS Skills",       href: "#skills" },
  { label: "Results & Progress", href: "#progress" },
];

/* Default static data (used when no CMS override exists) */
const DEFAULT_SKILLS = [
  { title: "Academic Reading",  desc: "Develop skills for every IELTS reading question type — matching headings, True/False/Not Given, sentence completion, and multiple choice.", imgUrl: "/lms/images/reading.jpg",   color: BC_BLUE,    Icon: BookOpen },
  { title: "Academic Writing",  desc: "Master Task 1 and Task 2 with structured writing exercises, vocabulary building, and detailed tutor feedback on every submission.",       imgUrl: "/lms/images/writing.jpg",   color: BC_RED,     Icon: PenTool },
  { title: "Listening",         desc: "Practise with authentic listening exercises using an integrated audio player and IELTS-format question panels including maps and forms.",  imgUrl: "/lms/images/listening.jpg", color: BC_CYAN,    Icon: Headphones },
  { title: "Speaking",          desc: "Record your answers for Parts 1, 2 & 3 directly in the browser. Receive pinpoint audio feedback from your tutor on each response.",      imgUrl: "/lms/images/speaking.jpg",  color: "#6B2D8B",  Icon: Mic },
];

const DEFAULT_FEATURES = [
  { title: "Quizzes & Mock Tests",    desc: "Timed, IELTS-format quizzes with instant scoring. Review every answer in detail to understand your mistakes.",                          Icon: ClipboardList },
  { title: "Structured Curriculum",   desc: "Your academy organises lessons into courses and units — follow your personalised programme step by step.",                             Icon: BookOpen },
  { title: "Assignment Submissions",  desc: "Submit writing and speaking tasks directly on the platform. Your tutor marks and returns feedback quickly.",                          Icon: MessageSquare },
  { title: "Progress Dashboard",      desc: "Your personal dashboard shows completion rates, quiz scores, and improvement trends across all four skills.",                         Icon: BarChart3 },
  { title: "Message Your Tutor",      desc: "Ask questions and get answers from your teacher directly inside the portal — no switching between apps.",                             Icon: MessageSquare },
  { title: "Study with Classmates",   desc: "Course announcements and discussion streams keep you connected with your cohort throughout the programme.",                           Icon: Users },
];

const DEFAULT_STEPS = [
  { title: "Get enrolled",              desc: "Your academy creates your account and enrols you into the right course for your current band level and target score." },
  { title: "Follow your programme",     desc: "Work through reading passages, writing tasks, listening exercises and speaking labs — in the order your teacher designed." },
  { title: "Submit & get feedback",     desc: "Complete assignments and quizzes, receive tutor feedback, and track your improvement week by week." },
  { title: "Achieve your band score",   desc: "With a structured programme and consistent feedback, reach the IELTS band score you need — faster." },
];

const DEFAULT_STATS = [
  { val: "+1.5", label: "Average band improvement" },
  { val: "12K+", label: "Active students on the platform" },
  { val: "40+",  label: "IELTS academies onboarded" },
  { val: "98%",  label: "Academy satisfaction rate" },
];

const ICON_MAP: Record<number, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  0: ClipboardList, 1: BookOpen, 2: MessageSquare, 3: BarChart3, 4: MessageSquare, 5: Users,
};
const SKILL_ICON_MAP: Record<number, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  0: BookOpen, 1: PenTool, 2: Headphones, 3: Mic,
};
const SKILL_COLORS = [BC_BLUE, BC_RED, BC_CYAN, "#6B2D8B"];

function useSeoSettings() {
  return useQuery<Record<string, unknown>>({
    queryKey: ["tenant-seo-public"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/seo", { credentials: "include" });
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });
}

export default function TenantLanding() {
  const { data: tenant } = usePublicTenantInfo();
  const { data: cms = {} } = useCmsSections();
  const { data: seo = {} } = useSeoSettings();

  const academyName = tenant?.name ?? "IELTS Academy";

  /* ── Pull content from CMS with fallbacks ─────────────────────── */
  const hero       = (cms.portal_home   ?? {}) as Record<string, unknown>;
  const taglineSec = (cms.tagline_band  ?? {}) as Record<string, unknown>;
  const skillsSec  = (cms.ielts_skills  ?? {}) as Record<string, unknown>;
  const featuresSec= (cms.portal_features ?? {}) as Record<string, unknown>;
  const howSec     = (cms.how_it_works  ?? {}) as Record<string, unknown>;
  const statsSec   = (cms.stats         ?? {}) as Record<string, unknown>;
  const ctaSec     = (cms.cta_section   ?? {}) as Record<string, unknown>;
  const brandSec   = (cms.branding      ?? {}) as Record<string, unknown>;
  const contactSec = (cms.contact       ?? {}) as Record<string, unknown>;

  const logoUrl      = str(brandSec.logoUrl)  || tenant?.logoUrl || "";
  const heroWelcome  = str(hero.welcomeText)  || tenant?.welcomeMessage || "";
  const heroHeadline = str(hero.headline)     || tenant?.tagline || tenant?.description || "Start your future with IELTS";
  const heroDesc     = str(hero.heroDescription, "Your personalised IELTS learning programme — everything you need to reach your target band score, in one portal.");
  const heroCta      = str(hero.ctaText,      "Log in to Student Portal");
  const heroImg      = str(hero.heroImageUrl) || "/lms/images/hero.jpg";

  const taglineText  = str(taglineSec.text, "Dreaming of studying, living or working abroad? Your IELTS journey starts here — in a structured programme designed by your academy.");

  const skillsHeading  = str(skillsSec.sectionHeading, "All four IELTS skills in your programme");
  const skills = arr<{ title: string; desc: string; imgUrl?: string }>(skillsSec.skills, []);
  const resolvedSkills = skills.length > 0 ? skills : DEFAULT_SKILLS;

  const featuresHeading = str(featuresSec.sectionHeading, "What's inside your student portal");
  const features = arr<{ title: string; desc: string }>(featuresSec.features, []);
  const resolvedFeatures = features.length > 0 ? features : DEFAULT_FEATURES;

  const howHeading = str(howSec.sectionHeading, "How your programme works");
  const steps = arr<{ title: string; desc: string }>(howSec.steps, []);
  const resolvedSteps = steps.length > 0 ? steps : DEFAULT_STEPS;

  const resolvedStats = [
    { val: str(statsSec.stat1Val, "+1.5"), label: str(statsSec.stat1Label, "Average band improvement") },
    { val: str(statsSec.stat2Val, "12K+"), label: str(statsSec.stat2Label, "Active students on the platform") },
    { val: str(statsSec.stat3Val, "40+"),  label: str(statsSec.stat3Label, "IELTS academies onboarded") },
    { val: str(statsSec.stat4Val, "98%"),  label: str(statsSec.stat4Label, "Academy satisfaction rate") },
  ];

  const ctaHeading     = str(ctaSec.heading,        "Ready to start your IELTS programme?");
  const ctaDesc        = str(ctaSec.description,    "Log in with the credentials your academy has provided and begin your personalised learning programme today.");
  const ctaStudentText = str(ctaSec.studentCtaText, "Log in to Student Portal");
  const ctaAdminText   = str(ctaSec.adminCtaText,   "Admin Login");

  const contactEmail   = str(contactSec.email) || tenant?.adminEmail || "";
  const footerText     = str(brandSec.footerText) || `© ${new Date().getFullYear()} ${academyName}. Powered by IELTS Academy LMS.`;

  const siteTitle = String(seo.siteTitle ?? "") || academyName;
  const titleTpl  = String(seo.titleTemplate ?? "") || `%s | ${siteTitle}`;
  const homeTitle = String(seo.homepageTitle ?? "") || titleTpl.replace("%s", academyName);
  const homeDesc  = String(seo.homepageDescription ?? "") || String(seo.defaultDescription ?? "") || tenant?.description || "";
  const seoOgImg  = String(seo.ogImage ?? "") || logoUrl;
  const seoNoIdx  = seo.noIndex === true;

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#333]">
      <SeoHead
        title={homeTitle}
        description={homeDesc}
        keywords={String(seo.defaultKeywords ?? "")}
        ogTitle={homeTitle}
        ogDescription={homeDesc}
        ogImage={seoOgImg}
        ogType="website"
        twitterCard={(seo.twitterCard as "summary" | "summary_large_image") ?? "summary_large_image"}
        noIndex={seoNoIdx}
        structuredData={siteTitle ? {
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": siteTitle,
          "description": homeDesc,
          "url": window.location.origin,
          ...(seoOgImg ? { "logo": seoOgImg } : {}),
        } : undefined}
      />

      {/* TIER 1 — Red utility bar */}
      <div style={{ backgroundColor: BC_RED }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-10 flex items-center justify-end gap-1">
          <a href="/lms/admin-login" className="px-3 py-1 text-white text-[13px] font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors">
            Admin Login
          </a>
          <Link href="/student/login" className="px-3 py-1 text-white text-[13px] font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors">
            Log in
          </Link>
          <button className="flex items-center gap-1.5 px-3 py-1 text-white text-[13px] font-medium border border-white/60 hover:border-white hover:bg-white/10 transition-colors">
            <Search className="w-3.5 h-3.5" />Search
          </button>
        </div>
      </div>

      {/* TIER 2 — Navy logo bar */}
      <div style={{ backgroundColor: BC_NAVY }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-[72px] flex items-center gap-5">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={academyName} className="h-11 w-auto" />
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
            <span className="text-white font-bold text-[26px] tracking-tight leading-none">{academyName}</span>
            <span className="text-white/40 text-[13px] mt-1 self-end pb-1">™</span>
          </div>
        </div>
      </div>

      {/* TIER 3 — Blue navigation bar */}
      <div style={{ backgroundColor: BC_BLUE }} className="shrink-0">
        <div className="max-w-screen-xl mx-auto px-4">
          <nav className="flex items-stretch h-[44px]">
            <a href="#" style={{ backgroundColor: BC_CYAN }} className="flex items-center justify-center w-12 shrink-0 hover:brightness-95 transition-all" aria-label="Home">
              <Home className="w-5 h-5 text-white" />
            </a>
            {navTabs.map((tab, i) => (
              <a key={i} href={tab.href} className="flex items-center px-4 h-full text-white text-[13px] font-medium whitespace-nowrap hover:bg-white/15 border-l border-white/20 transition-colors">
                {tab.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* HERO */}
      <div
        className="relative w-full shrink-0"
        style={{ backgroundImage: `url('${heroImg}')`, backgroundSize: "cover", backgroundPosition: "center 30%", minHeight: "480px" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-4 md:left-10 w-[300px] md:w-[360px] bg-white shadow-xl p-8 rounded-sm">
          {heroWelcome && (
            <p className="text-[13px] font-semibold uppercase tracking-widest mb-2" style={{ color: BC_RED }}>
              {heroWelcome}
            </p>
          )}
          <h1 className="text-[26px] md:text-[30px] font-bold leading-snug mb-4" style={{ color: BC_NAVY }}>
            {heroHeadline}
          </h1>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-6">{heroDesc}</p>
          <Link href="/student/login">
            <button style={{ backgroundColor: BC_RED }} className="w-full py-3 text-white text-[14px] font-semibold rounded-full hover:opacity-90 transition-opacity">
              {heroCta}
            </button>
          </Link>
        </div>
      </div>

      {/* TAGLINE BAND */}
      <div className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-screen-md mx-auto px-4 text-center">
          <p className="text-[18px] md:text-[22px] font-bold leading-relaxed" style={{ color: BC_NAVY }}>
            {taglineText}
          </p>
        </div>
      </div>

      {/* IELTS SKILLS */}
      <section id="skills" className="py-14 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h2 className="text-[22px] font-bold" style={{ color: BC_NAVY }}>{skillsHeading}</h2>
            <div className="mt-2 h-1 w-16" style={{ backgroundColor: BC_RED }} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resolvedSkills.map((skill, i) => {
              const Icon = (skill as any).Icon ?? SKILL_ICON_MAP[i % 4] ?? BookOpen;
              const color = (skill as any).color ?? SKILL_COLORS[i % 4];
              const imgUrl = skill.imgUrl ?? DEFAULT_SKILLS[i % 4]?.imgUrl ?? "";
              return (
                <div key={i} className="group cursor-pointer">
                  <div className="relative overflow-hidden h-44">
                    <img src={imgUrl} alt={skill.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: color }} />
                  </div>
                  <div className="pt-4 pb-2 border-b-2 border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                      <h3 className="font-bold text-[15px]" style={{ color: BC_NAVY }}>{skill.title}</h3>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{skill.desc}</p>
                    <a href="/lms/student/login" className="inline-flex items-center gap-1 mt-3 text-[13px] font-semibold hover:underline" style={{ color: BC_BLUE }}>
                      Start practising →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PORTAL FEATURES */}
      <section id="courses" className="py-14" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h2 className="text-[22px] font-bold" style={{ color: BC_NAVY }}>{featuresHeading}</h2>
            <div className="mt-2 h-1 w-16" style={{ backgroundColor: BC_RED }} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {resolvedFeatures.map((f: any, i) => {
              const Icon = f.Icon ?? ICON_MAP[i % 6] ?? ClipboardList;
              return (
                <div key={i} className="bg-white p-7 hover:bg-[#F0F7FC] transition-colors group">
                  <div className="w-10 h-10 flex items-center justify-center mb-4" style={{ backgroundColor: BC_BLUE + "18" }}>
                    <Icon className="w-5 h-5" style={{ color: BC_BLUE }} />
                  </div>
                  <h3 className="font-bold text-[15px] mb-2" style={{ color: BC_NAVY }}>{f.title}</h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-4">{f.desc}</p>
                  <a href="/lms/student/login" className="text-[13px] font-semibold hover:underline" style={{ color: BC_BLUE }}>Learn more →</a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="learning" className="py-14 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h2 className="text-[22px] font-bold" style={{ color: BC_NAVY }}>{howHeading}</h2>
            <div className="mt-2 h-1 w-16" style={{ backgroundColor: BC_RED }} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resolvedSteps.map((step: any, i) => (
              <div key={i} className="flex flex-col">
                <div className="w-10 h-10 flex items-center justify-center text-white font-bold text-[18px] mb-4 shrink-0" style={{ backgroundColor: BC_BLUE }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-[15px] mb-2" style={{ color: BC_NAVY }}>{step.title}</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed flex-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section id="progress" className="py-12" style={{ backgroundColor: BC_NAVY }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {resolvedStats.map((s) => (
              <div key={s.label}>
                <p className="text-[36px] font-black text-white leading-none mb-2">{s.val}</p>
                <p className="text-[13px] text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-14 bg-white border-t border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-[22px] font-bold mb-2" style={{ color: BC_NAVY }}>{ctaHeading}</h2>
              <p className="text-[14px] text-gray-600 max-w-lg">{ctaDesc}</p>
              {contactEmail && (
                <p className="text-[13px] mt-2 text-gray-400">
                  Questions? Contact your academy:{" "}
                  <a href={`mailto:${contactEmail}`} className="hover:underline" style={{ color: BC_BLUE }}>
                    {contactEmail}
                  </a>
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/student/login">
                <button style={{ backgroundColor: BC_RED }} className="px-8 py-3 text-white text-[14px] font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                  {ctaStudentText}
                </button>
              </Link>
              <a href="/lms/admin-login">
                <button style={{ backgroundColor: BC_NAVY }} className="px-8 py-3 text-white text-[14px] font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                  {ctaAdminText}
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: BC_NAVY }} className="mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt={academyName} className="h-8 w-auto" />
              ) : (
                <div className="grid grid-cols-3 gap-0.5 w-6 h-6 shrink-0">
                  {Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-white rounded-[1px]" />)}
                </div>
              )}
              <span className="text-white font-bold text-[16px]">{academyName}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {["Student Login", "Admin Login", "Contact Academy"].map((label, i) => (
                <a
                  key={i}
                  href={i === 0 ? "/lms/student/login" : i === 1 ? "/lms/admin-login" : `mailto:${contactEmail}`}
                  className="text-white/60 hover:text-white text-[13px] transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <p className="text-white/35 text-[12px]">{footerText}</p>
          </div>
        </div>
        <div style={{ backgroundColor: BC_RED }} className="h-1.5 w-full" />
      </footer>
    </div>
  );
}
