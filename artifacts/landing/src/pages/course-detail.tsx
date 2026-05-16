import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Star, Users, Clock, BookOpen, Award, Play, CheckCircle2, Download,
  Headphones, FileText, ClipboardList, Lock, LockOpen, Globe, RefreshCw, Zap,
  Mic, PenTool, BarChart3, MessageSquare, Youtube, Twitter, Linkedin,
  ChevronRight, ArrowLeft, Share2, Heart, Shield, CreditCard,
  ChevronDown, ChevronUp, Quote, TrendingUp, Brain, Video,
  ThumbsUp, Flag, MoreHorizontal, Volume2, ArrowRight, GraduationCap,
} from "lucide-react";

/* ─── COURSE DATA ─────────────────────────────────────────────── */

const COURSE = {
  title: "IELTS Academic Complete Course — Band 7+ Guarantee",
  subtitle: "Master all 4 IELTS skills with AI-powered feedback, certified examiner guidance, and 4 full mock tests. Achieve Band 7 or higher — guaranteed.",
  category: "Full Course · Academic",
  updatedAt: "May 2026",
  language: "English",
  level: "All Levels",
  duration: "48 hours",
  lessons: 94,
  students: 18_420,
  rating: 4.9,
  reviews: 2_847,
  price: 129,
  originalPrice: 299,
  discount: 57,
  hasCert: true,
  hasAI: true,
  heroImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&q=80",
  previewVideo: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80",
  instructor: {
    name: "Dr. Sarah Mitchell",
    role: "Ex-IELTS Examiner · Cambridge Certified",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80",
    bio: "Dr. Sarah Mitchell is a former British Council IELTS examiner with 14 years of experience training students in 22 countries. She holds a PhD in Applied Linguistics from Cambridge University, a CELTA, and a DELTA qualification. Her students have an average band improvement of 1.5 points. She has authored 3 IELTS preparation books published by Oxford University Press.",
    students: 52_400,
    courses: 6,
    rating: 4.9,
    achievements: ["PhD Applied Linguistics – Cambridge", "Ex-British Council IELTS Examiner", "CELTA & DELTA Certified", "Oxford University Press Author", "14 Years Teaching Experience"],
  },
};

const OUTCOMES = [
  "Score Band 7+ in all four IELTS skills: Listening, Reading, Writing, and Speaking",
  "Master every question type used in the IELTS Academic exam with proven strategies",
  "Write Band 7+ essays and Task 1 reports with AI-graded feedback on every attempt",
  "Build a 3,000+ word Academic Word List vocabulary with IELTS-specific usage",
  "Achieve fluency and coherence in Speaking Parts 1, 2, and 3 with cue card confidence",
  "Complete 4 full-length timed mock exams under real exam conditions",
  "Identify and fix your personal weakest areas using the progress analytics dashboard",
  "Understand exactly how IELTS examiners apply the official 4-criteria band descriptors",
];

const REQUIREMENTS = [
  "English level B1 or above (IELTS Band 4.5 equivalent or higher)",
  "No prior IELTS preparation experience required — we start from the fundamentals",
  "A notebook or digital notes app for vocabulary and strategy notes",
  "Commitment to 1–2 hours of daily practice for best results",
];

const CURRICULUM = [
  {
    id: "m1",
    title: "Module 1: IELTS Overview & Exam Strategy",
    lessons: 6,
    duration: "3h 20m",
    items: [
      { type: "video", title: "Welcome & Course Roadmap", duration: "8:42", free: true },
      { type: "video", title: "How IELTS Is Scored: Band Descriptors Explained", duration: "14:05", free: true },
      { type: "video", title: "Academic vs General Training: Key Differences", duration: "11:22", free: false },
      { type: "quiz", title: "IELTS Knowledge Check Quiz", duration: "15 min", free: false },
      { type: "pdf", title: "Band Score Calculator & Study Planner (PDF)", duration: "", free: false },
      { type: "video", title: "How to Use This Course for Maximum Results", duration: "9:14", free: false },
    ],
  },
  {
    id: "m2",
    title: "Module 2: IELTS Listening — Sections 1 to 4",
    lessons: 12,
    duration: "7h 15m",
    items: [
      { type: "audio", title: "Section 1 Walkthrough: Social Conversations", duration: "22:10", free: false },
      { type: "video", title: "Note-Taking & Gap-Fill Strategies", duration: "18:44", free: true },
      { type: "audio", title: "Section 2: Monologue Practice — Map & Diagram", duration: "25:30", free: false },
      { type: "video", title: "Multiple Choice Traps & How to Avoid Them", duration: "16:02", free: false },
      { type: "audio", title: "Section 3: Academic Discussion (4 speakers)", duration: "28:15", free: false },
      { type: "audio", title: "Section 4: Academic Lecture — Heading Match", duration: "24:50", free: false },
      { type: "quiz", title: "Listening Full Practice Test 1", duration: "30 min", free: false },
      { type: "pdf", title: "Listening Answer Sheet & Answer Key (PDF)", duration: "", free: false },
    ],
  },
  {
    id: "m3",
    title: "Module 3: IELTS Reading — All Question Types",
    lessons: 14,
    duration: "8h 40m",
    items: [
      { type: "video", title: "Skimming vs Scanning: When to Use Each", duration: "12:30", free: true },
      { type: "video", title: "True / False / Not Given: The Definitive Strategy", duration: "19:44", free: false },
      { type: "video", title: "Heading Matching Without Reading Every Paragraph", duration: "17:22", free: false },
      { type: "video", title: "Sentence Completion & Summary Fill", duration: "15:08", free: false },
      { type: "quiz", title: "Reading Practice Passage — Academic Text 1", duration: "60 min", free: false },
      { type: "pdf", title: "Reading Timing Strategies Cheat Sheet (PDF)", duration: "", free: false },
    ],
  },
  {
    id: "m4",
    title: "Module 4: IELTS Writing — Task 1 (Graphs, Charts, Maps)",
    lessons: 16,
    duration: "10h 05m",
    items: [
      { type: "video", title: "Task 1 Overview: Band Descriptors & Marking", duration: "13:20", free: true },
      { type: "video", title: "Line Graphs: Describe Trends & Make Comparisons", duration: "21:45", free: false },
      { type: "video", title: "Bar Charts & Pie Charts: Data Selection Strategy", duration: "19:00", free: false },
      { type: "video", title: "Maps & Process Diagrams: Step-by-Step", duration: "23:15", free: false },
      { type: "assignment", title: "AI-Graded Essay: Line Graph (Submitted & Scored)", duration: "45 min", free: false },
      { type: "assignment", title: "AI-Graded Essay: Two-Chart Comparison", duration: "40 min", free: false },
      { type: "pdf", title: "Task 1 Vocabulary & Sentence Starters Bank (PDF)", duration: "", free: false },
    ],
  },
  {
    id: "m5",
    title: "Module 5: IELTS Writing — Task 2 (Academic Essays)",
    lessons: 18,
    duration: "11h 30m",
    items: [
      { type: "video", title: "Task 2 Essay Types: Opinion, Discussion, Problem-Solution", duration: "16:40", free: true },
      { type: "video", title: "Planning Your Essay in 5 Minutes", duration: "14:22", free: false },
      { type: "video", title: "Introduction & Thesis Statement Mastery", duration: "18:55", free: false },
      { type: "video", title: "Body Paragraph Structure: PEEL Method", duration: "20:14", free: false },
      { type: "video", title: "Conclusion Writing for Band 7+", duration: "12:30", free: false },
      { type: "assignment", title: "AI-Graded Essay: Opinion Essay", duration: "60 min", free: false },
      { type: "assignment", title: "AI-Graded Essay: Discussion Essay", duration: "60 min", free: false },
      { type: "pdf", title: "250 Band 8 Essay Vocabulary Phrases (PDF)", duration: "", free: false },
    ],
  },
  {
    id: "m6",
    title: "Module 6: IELTS Speaking — Parts 1, 2 & 3",
    lessons: 14,
    duration: "7h 50m",
    items: [
      { type: "video", title: "Speaking Assessment Criteria Decoded", duration: "11:15", free: true },
      { type: "video", title: "Part 1: Answering Familiar Topic Questions Fluently", duration: "17:30", free: false },
      { type: "video", title: "Part 2: Cue Card Strategy & 1-Minute Planning", duration: "19:45", free: false },
      { type: "video", title: "Part 3: Extended Discussion & Opinion Giving", duration: "22:10", free: false },
      { type: "audio", title: "Band 9 Model Speaking Sample — Full Interview", duration: "14:22", free: false },
      { type: "quiz", title: "Cue Card Practice Set: 20 Topics with Model Answers", duration: "", free: false },
      { type: "pdf", title: "200 Cue Card Topics & Vocabulary by Theme (PDF)", duration: "", free: false },
    ],
  },
  {
    id: "m7",
    title: "Module 7: Grammar & Vocabulary for Band 7+",
    lessons: 10,
    duration: "5h 10m",
    items: [
      { type: "video", title: "Complex Sentences & Subordinate Clauses", duration: "15:40", free: false },
      { type: "video", title: "Academic Word List — Top 300 Words by Frequency", duration: "20:00", free: true },
      { type: "quiz", title: "Vocabulary Drills: Fill-in-the-Blank (50 questions)", duration: "30 min", free: false },
      { type: "pdf", title: "IELTS Grammar Reference Handbook (PDF)", duration: "", free: false },
    ],
  },
  {
    id: "m8",
    title: "Module 8: Full Mock Exams (4 Complete Tests)",
    lessons: 4,
    duration: "16h 00m",
    items: [
      { type: "mock", title: "Full Mock Test 1 — Timed (Listening + Reading + Writing)", duration: "3h", free: false },
      { type: "mock", title: "Full Mock Test 2 — Timed with Speaking Simulation", duration: "4h", free: false },
      { type: "mock", title: "Full Mock Test 3 — Band Score Prediction Report", duration: "4h", free: false },
      { type: "mock", title: "Full Mock Test 4 — Final Practice Before Exam Day", duration: "4h", free: false },
    ],
  },
];

const AI_FEATURES = [
  {
    icon: PenTool,
    title: "AI Writing Evaluation",
    color: "bg-indigo-50 text-indigo-600",
    badge: "Powered by GPT-4",
    badgeColor: "bg-indigo-100 text-indigo-700",
    desc: "Submit any Task 1 or Task 2 essay and receive a full IELTS-style band score within seconds. Our AI evaluates all four official criteria:",
    points: [
      "Task Achievement / Task Response",
      "Coherence & Cohesion",
      "Lexical Resource (Vocabulary)",
      "Grammatical Range & Accuracy",
    ],
    extra: "Each score comes with line-by-line feedback, error highlighting, vocabulary suggestions, and a model answer rewrite — just like a real examiner.",
  },
  {
    icon: Mic,
    title: "AI Speaking Feedback",
    color: "bg-violet-50 text-violet-600",
    badge: "Real-time Analysis",
    badgeColor: "bg-violet-100 text-violet-700",
    desc: "Record your cue card response or Part 3 answer and get instant feedback on:",
    points: [
      "Fluency & natural pacing",
      "Lexical Resource & vocabulary range",
      "Pronunciation & clarity score",
      "Coherence & structured response length",
    ],
    extra: "Practise unlimited times. Compare your band score trend across sessions and see exactly which Speaking criteria you need to improve.",
  },
];

const REVIEWS = [
  {
    name: "Priya Sharma",
    country: "India",
    flag: "🇮🇳",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
    rating: 5,
    date: "March 2026",
    prevBand: "6.5",
    band: "8.0",
    text: "I was stuck at 6.5 for two attempts. After 6 weeks on this course, I scored 8.0 and got my Canadian PR. The AI writing feedback was the biggest game-changer — it told me exactly why I was losing marks in every essay. Dr. Mitchell's explanations are incredibly clear and the mock tests are very close to the real exam.",
    helpful: 142,
    course: "Full Course",
  },
  {
    name: "Ahmad Al-Rashidi",
    country: "UAE",
    flag: "🇦🇪",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    rating: 5,
    date: "April 2026",
    prevBand: "6.0",
    band: "7.5",
    text: "The speaking mock tests and cue card library are phenomenal. I went from 6.0 to 7.5 in Speaking. The Part 3 extended discussion strategies completely changed how I answer follow-up questions. Worth every dollar — I got my Australian skilled migration visa approved last month.",
    helpful: 89,
    course: "Full Course",
  },
  {
    name: "Maria Santos",
    country: "Philippines",
    flag: "🇵🇭",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    rating: 5,
    date: "February 2026",
    prevBand: "5.5",
    band: "7.0",
    text: "From 5.5 to 7.0 in my first attempt after this course. As a nurse applying for UK registration, I needed exactly Band 7 in every skill. The daily practice structure and progress tracker kept me disciplined. The PDF vocabulary banks and grammar handbook are resources I still use every day.",
    helpful: 76,
    course: "Full Course",
  },
  {
    name: "David Kim",
    country: "South Korea",
    flag: "🇰🇷",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80",
    rating: 4,
    date: "January 2026",
    prevBand: "6.5",
    band: "7.5",
    text: "Excellent course overall. The listening and reading sections are the best I've seen in any IELTS course. The mock exams are incredibly realistic. I only wish there were even more Speaking mock interviews. Still gave 4 stars because everything else is 5-star quality — and I hit my Band 7.5 target.",
    helpful: 54,
    course: "Full Course",
  },
];

const FAQS = [
  { q: "Is this course suitable for complete beginners?", a: "Yes. While a B1 English level (equivalent to IELTS Band 4.5) is recommended as a starting point, the course begins with the fundamentals of the IELTS exam and builds progressively. We've had students with no prior IELTS experience achieve Band 7+ after completing the course." },
  { q: "How is the Band 7 guarantee enforced?", a: "If you complete all 94 lessons, submit all AI-graded essays, and attempt all 4 mock exams within 90 days — and still don't achieve Band 7 in your official IELTS exam — you're entitled to a full refund or free Mentorship coaching sessions until you do. Terms and conditions apply." },
  { q: "How long do I have access to the course?", a: "Lifetime access. Once enrolled, you own the course permanently. All future updates, new mock tests, and additional content are included at no extra charge." },
  { q: "Can I download lessons for offline studying?", a: "Yes — all PDF study packs, vocabulary lists, and essay banks are downloadable. Video lessons can be accessed offline via our mobile app." },
  { q: "How does the AI writing feedback work?", a: "After submitting your essay, our AI (powered by GPT-4 fine-tuned on real IELTS examiner marking) evaluates it against the four official IELTS Writing band descriptors and returns a band score estimate, criterion-by-criterion breakdown, error annotations, and a suggested model rewrite — typically within 30 seconds." },
  { q: "Does this course cover IELTS General Training as well?", a: "The core Listening, Speaking, Grammar, and Vocabulary modules apply to both Academic and General Training. Writing Task 1 focuses on Academic graphs/charts, but we include a bonus General Training Letter Writing module covering formal, semi-formal, and informal letters." },
];

const RELATED_COURSES = [
  {
    title: "IELTS Writing Masterclass — Task 1 & Task 2",
    instructor: "Prof. James Chen",
    rating: 4.8,
    reviews: 1632,
    price: 79,
    originalPrice: 179,
    badge: "Top Rated",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80",
    duration: "22h",
    lessons: 48,
  },
  {
    title: "Speaking Band 7+ — 30-Day Intensive",
    instructor: "Emma Watson",
    rating: 4.9,
    reviews: 984,
    price: 69,
    originalPrice: 149,
    badge: "New",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80",
    duration: "18h",
    lessons: 36,
  },
  {
    title: "IELTS Listening — Strategies for Band 8",
    instructor: "Dr. Aisha Patel",
    rating: 4.8,
    reviews: 531,
    price: 59,
    originalPrice: 129,
    badge: "",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80",
    duration: "14h",
    lessons: 28,
  },
  {
    title: "IELTS Grammar Intensive — Band 5 to Band 7",
    instructor: "Dr. Thomas Berg",
    rating: 4.5,
    reviews: 392,
    price: 49,
    originalPrice: 99,
    badge: "New",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    duration: "12h",
    lessons: 20,
  },
];

/* ─── HELPERS ────────────────────────────────────────────────────── */

function StarRow({ rating, size = "sm" }: { rating: number; size?: "xs" | "sm" | "lg" }) {
  const dim = size === "lg" ? "w-5 h-5" : size === "sm" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(dim, n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
      ))}
    </div>
  );
}

function ItemIcon({ type }: { type: string }) {
  const base = "w-4 h-4 flex-shrink-0";
  switch (type) {
    case "video": return <Play className={cn(base, "text-indigo-500")} />;
    case "audio": return <Volume2 className={cn(base, "text-blue-500")} />;
    case "pdf": return <Download className={cn(base, "text-emerald-500")} />;
    case "quiz": return <ClipboardList className={cn(base, "text-amber-500")} />;
    case "assignment": return <PenTool className={cn(base, "text-violet-500")} />;
    case "mock": return <FileText className={cn(base, "text-rose-500")} />;
    default: return <BookOpen className={cn(base, "text-slate-400")} />;
  }
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-8 text-right">{label}★</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8">{pct}%</span>
    </div>
  );
}

/* ─── PAGE ───────────────────────────────────────────────────────── */

export default function CourseDetail() {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [mobilePriceVisible, setMobilePriceVisible] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const effectivePrice = couponApplied ? Math.round(COURSE.price * 0.85) : COURSE.price;

  // Show sticky mobile CTA after hero scrolls past
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setMobilePriceVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const totalLessons = CURRICULUM.reduce((s, m) => s + m.items.length, 0);
  const freeLessons = CURRICULUM.reduce((s, m) => s + m.items.filter((i) => i.free).length, 0);

  const ratingDist = { 5: 2204, 4: 469, 3: 118, 2: 38, 1: 18 };
  const totalRev = Object.values(ratingDist).reduce((a, b) => a + b, 0);

  /* ── PRICING CARD ── */
  const PricingCard = ({ mobile }: { mobile?: boolean }) => (
    <div className={cn("bg-white rounded-2xl overflow-hidden", mobile ? "border-t border-slate-100 shadow-xl" : "border border-slate-100 shadow-xl")}>
      {/* Preview thumbnail */}
      {!mobile && (
        <div className="relative aspect-video overflow-hidden">
          <img src={COURSE.previewVideo} alt="Course preview" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center cursor-pointer group"
            onClick={() => setVideoPlaying(true)}
          >
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
              <Play className="w-6 h-6 text-indigo-600 fill-indigo-600 ml-0.5" />
            </div>
            <span className="text-white text-sm font-semibold">Preview this course</span>
          </div>
        </div>
      )}

      <div className={cn("p-5", mobile && "flex items-center justify-between gap-4")}>
        {mobile ? (
          <>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">${effectivePrice}</span>
                <span className="text-sm text-slate-400 line-through">${COURSE.originalPrice}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{COURSE.discount}% OFF</span>
              </div>
              <p className="text-xs text-rose-500 font-semibold mt-0.5">⏰ Offer ends in 2 days</p>
            </div>
            <a href={`/checkout?course=${COURSE.id}`} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm whitespace-nowrap transition-colors shadow-lg shadow-indigo-200">
              Enroll Now
            </a>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-extrabold text-slate-900">${effectivePrice}</span>
              <span className="text-base text-slate-400 line-through">${COURSE.originalPrice}</span>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{COURSE.discount}% OFF</span>
            </div>
            <p className="text-xs text-rose-500 font-semibold mb-4">⏰ This price ends in <span className="font-bold">2 days</span></p>

            <a href={`/checkout?course=${COURSE.id}`} className="block w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center text-base transition-all hover:scale-[1.02] shadow-md shadow-indigo-200 mb-3">
              Enroll Now — ${effectivePrice}
            </a>
            <a href="/lms/" className="block w-full py-3 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 font-bold text-center text-sm transition-colors mb-4">
              Try Free Preview Lessons
            </a>

            {/* Coupon */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono"
              />
              <button
                onClick={() => { if (coupon.length > 3) setCouponApplied(true); }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors whitespace-nowrap"
              >
                Apply
              </button>
            </div>
            {couponApplied && (
              <p className="text-xs text-emerald-600 font-semibold mb-3 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Coupon applied! 15% extra off
              </p>
            )}

            {/* Guarantees */}
            <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> 30-day money-back guarantee
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Globe className="w-3.5 h-3.5 text-blue-500" /> Full lifetime access
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Access on mobile & desktop
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Certificate of completion
              </div>
            </div>

            {/* Payment icons */}
            <p className="text-[10px] text-slate-400 text-center mb-2">Secure payment via</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {["VISA", "MC", "AMEX", "PayPal", "Stripe"].map((p) => (
                <div key={p} className="px-2 py-1 rounded border border-slate-200 text-[9px] font-bold text-slate-500 bg-slate-50">{p}</div>
              ))}
            </div>

            {/* Share & wishlist */}
            <div className="flex gap-2">
              <button
                onClick={() => setWishlisted((v) => !v)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-colors",
                  wishlisted ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-600 hover:border-slate-300")}
              >
                <Heart className={cn("w-3.5 h-3.5", wishlisted && "fill-rose-500 text-rose-500")} />
                {wishlisted ? "Saved" : "Wishlist"}
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:border-slate-300 transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO BANNER ── */}
      <div ref={heroRef} style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }} className="pt-16">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300 truncate max-w-[200px]">IELTS Academic Complete</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left: course info */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
                {COURSE.category}
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
                {COURSE.title}
              </h1>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-5 max-w-2xl">
                {COURSE.subtitle}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-1.5">
                  <StarRow rating={COURSE.rating} size="sm" />
                  <span className="text-amber-400 font-bold text-sm">{COURSE.rating}</span>
                  <span className="text-slate-400 text-sm">({COURSE.reviews.toLocaleString()} reviews)</span>
                </div>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300 text-sm flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {COURSE.students.toLocaleString()} students</span>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-2.5 mb-5">
                <img src={COURSE.instructor.avatar} alt={COURSE.instructor.name} className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500/40" />
                <div>
                  <span className="text-slate-300 text-sm">Created by </span>
                  <span className="text-indigo-300 font-semibold text-sm hover:underline cursor-pointer">{COURSE.instructor.name}</span>
                </div>
              </div>

              {/* Details strip */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Last updated {COURSE.updatedAt}</span>
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {COURSE.language}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {COURSE.duration} total</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {COURSE.lessons} lessons</span>
                <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> {COURSE.level}</span>
              </div>
            </div>

            {/* Right: pricing card — desktop only */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-20">
                <PricingCard />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: all content */}
          <div className="flex-1 min-w-0 space-y-12">

            {/* ── PREVIEW VIDEO (mobile/tablet only) ── */}
            <div className="lg:hidden rounded-2xl overflow-hidden shadow-lg border border-slate-100 relative aspect-video">
              <img src={COURSE.previewVideo} alt="Preview" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setVideoPlaying(true)}
              >
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center mb-2 shadow-lg">
                  <Play className="w-6 h-6 text-indigo-600 fill-indigo-600 ml-0.5" />
                </div>
                <span className="text-white text-sm font-semibold">Preview this course</span>
              </div>
            </div>

            {/* ── WHAT YOU'LL LEARN ── */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> What You'll Learn
              </h2>
              <div className="rounded-2xl border border-slate-100 bg-indigo-50/30 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {OUTCOMES.map((o) => (
                    <div key={o} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 leading-relaxed">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── REQUIREMENTS ── */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-4">Requirements</h2>
              <ul className="space-y-2.5">
                {REQUIREMENTS.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </section>

            {/* ── CURRICULUM ── */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Course Curriculum
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                {CURRICULUM.length} modules · {totalLessons} lessons · {COURSE.duration} total · <span className="text-indigo-600 font-semibold">{freeLessons} free preview lessons</span>
              </p>

              <Accordion type="multiple" defaultValue={["m1"]} className="space-y-3">
                {CURRICULUM.map((mod) => (
                  <AccordionItem key={mod.id} value={mod.id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 transition-colors [&>svg]:hidden">
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="flex items-start gap-3 text-left">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {mod.id.replace("m", "")}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{mod.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{mod.lessons} lessons · {mod.duration}</p>
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform accordion-chevron" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="space-y-2 pt-2">
                        {mod.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors group">
                            <ItemIcon type={item.type as string} />
                            <span className="flex-1 text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{item.title}</span>
                            {item.free ? (
                              <>
                                <LockOpen className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex-shrink-0">Preview</span>
                              </>
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            )}
                            {item.duration && (
                              <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{item.duration}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* ── AI FEATURES ── */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-500" /> AI-Powered Practice
              </h2>
              <p className="text-slate-500 text-sm mb-6">Unlimited AI feedback — practise as many times as you need, any time of day.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {AI_FEATURES.map((f) => (
                  <div key={f.title} className="rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", f.color)}>
                        <f.icon className="w-5 h-5" />
                      </div>
                      <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", f.badgeColor)}>{f.badge}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-3">{f.desc}</p>
                    <ul className="space-y-1.5 mb-3">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {p}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-400 leading-relaxed italic">{f.extra}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── INSTRUCTOR ── */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" /> Your Instructor
              </h2>
              <div className="rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-5 mb-5">
                  <img src={COURSE.instructor.avatar} alt={COURSE.instructor.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 flex-shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{COURSE.instructor.name}</h3>
                    <p className="text-indigo-600 text-sm font-semibold mb-2">{COURSE.instructor.role}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {COURSE.instructor.rating} Rating</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" /> {COURSE.instructor.students.toLocaleString()} Students</span>
                      <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-violet-400" /> {COURSE.instructor.courses} Courses</span>
                    </div>
                  </div>
                </div>

                <p className={cn("text-sm text-slate-600 leading-relaxed mb-4", !showFullDesc && "line-clamp-4")}>
                  {COURSE.instructor.bio}
                </p>
                <button
                  onClick={() => setShowFullDesc((v) => !v)}
                  className="text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1 mb-4"
                >
                  {showFullDesc ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show more</>}
                </button>

                <div className="flex flex-wrap gap-2 mb-5">
                  {COURSE.instructor.achievements.map((a) => (
                    <span key={a} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                      {a}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  {[
                    { icon: Youtube, label: "YouTube" },
                    { icon: Linkedin, label: "LinkedIn" },
                    { icon: Twitter, label: "Twitter" },
                  ].map(({ icon: Icon, label }) => (
                    <a key={label} href="#" aria-label={label} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* ── REVIEWS ── */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> Student Reviews
              </h2>

              {/* Rating overview */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 p-6 rounded-2xl bg-amber-50/40 border border-amber-100">
                <div className="text-center sm:text-left flex-shrink-0">
                  <p className="text-6xl font-black text-amber-500 leading-none">{COURSE.rating}</p>
                  <StarRow rating={COURSE.rating} size="lg" />
                  <p className="text-xs text-slate-400 mt-1">Course Rating</p>
                </div>
                <div className="flex-1 space-y-2">
                  {([5, 4, 3, 2, 1] as const).map((n) => (
                    <RatingBar key={n} label={String(n)} count={ratingDist[n]} total={totalRev} />
                  ))}
                </div>
              </div>

              {/* Review cards */}
              <div className="space-y-5 mb-6">
                {REVIEWS.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover border border-slate-100 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{r.name} {r.flag}</p>
                          <p className="text-xs text-slate-400">{r.country} · {r.date}</p>
                        </div>
                      </div>
                      <button className="text-slate-300 hover:text-slate-500 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Band change badge */}
                    <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 w-fit">
                      <span className="text-xs text-slate-500 font-medium">Band {r.prevBand}</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-extrabold text-emerald-700">Band {r.band}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <StarRow rating={r.rating} size="sm" />
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-3">"{r.text}"</p>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <button className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({r.helpful})
                      </button>
                      <button className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        <Flag className="w-3.5 h-3.5" /> Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                Load More Reviews
              </button>
            </section>

            {/* ── FAQ ── */}
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" /> Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {FAQS.map((faq, i) => (
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
            </section>

            {/* ── RELATED COURSES ── */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" /> Related Courses
                </h2>
                <Link href="/courses" className="text-sm text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {RELATED_COURSES.map((c) => (
                  <Link href="/courses" key={c.title}>
                    <div className="group flex gap-3 rounded-2xl border border-slate-100 p-3 hover:shadow-md transition-all cursor-pointer">
                      <div className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-700 transition-colors mb-1">{c.title}</p>
                        <p className="text-[10px] text-slate-400 mb-1">{c.instructor}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-bold text-amber-600">{c.rating}</span>
                          <span className="text-[10px] text-slate-400">({c.reviews.toLocaleString()})</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-sm font-extrabold text-slate-900">${c.price}</span>
                          {c.originalPrice > c.price && (
                            <span className="text-[10px] text-slate-400 line-through">${c.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

          </div>

          {/* Right: sticky pricing card — desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-20">
              <PricingCard />
            </div>
          </div>
        </div>
      </div>

      {/* ── VIDEO LIGHTBOX ── */}
      {videoPlaying && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setVideoPlaying(false)}
        >
          <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl aspect-video">
            <img src={COURSE.previewVideo} alt="Course preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <Play className="w-16 h-16 mx-auto mb-3 opacity-70" />
                <p className="text-lg font-semibold">Preview Video</p>
                <p className="text-sm text-white/60">Click anywhere to close</p>
              </div>
            </div>
            <button
              onClick={() => setVideoPlaying(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── STICKY MOBILE ENROLL BAR ── */}
      <div className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300",
        mobilePriceVisible ? "translate-y-0" : "translate-y-full"
      )}>
        <PricingCard mobile />
      </div>

      <div className="pb-24 lg:pb-0">
        <Footer />
      </div>
    </div>
  );
}

