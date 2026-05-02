import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Button } from "@/components/ui/button";
import {
  BookOpen, PenTool, Headphones, Mic, Target, Layers, BarChart3, ArrowRight,
  CheckCircle2, Quote, PlayCircle, Award, Clock, Zap, Shield, Users, Star,
  TrendingUp, ChevronRight,
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

const stats = [
  { value: "+1.5", label: "Average band improvement", suffix: "" },
  { value: "12K", label: "Active students", suffix: "+" },
  { value: "98", label: "Tutor satisfaction rate", suffix: "%" },
  { value: "40", label: "Language institutions", suffix: "+" },
];

const features = [
  { icon: BookOpen, title: "Reading", color: "bg-blue-50 text-blue-600", desc: "Side-by-side text and question panels, highlighting tools, and 12+ authentic question types." },
  { icon: PenTool, title: "Writing", color: "bg-violet-50 text-violet-600", desc: "Real-time word counts, precise formatting, and detailed tutor annotation capabilities." },
  { icon: Headphones, title: "Listening", color: "bg-emerald-50 text-emerald-600", desc: "Integrated audio controls, synchronized questioning, and exact timing replication." },
  { icon: Mic, title: "Speaking", color: "bg-orange-50 text-orange-600", desc: "High-fidelity audio recording, prompt timing, and nuanced pronunciation feedback." },
];

const steps = [
  { icon: Target, num: "01", title: "Diagnostic Assessment", desc: "Begin with a full-length mock test to pinpoint exact weak areas down to the sub-question type." },
  { icon: PlayCircle, num: "02", title: "Targeted Practice", desc: "Engage 8+ structured lesson formats designed to close your specific gaps in grammar and strategy." },
  { icon: Award, num: "03", title: "Performance Review", desc: "Get microscopic feedback from tutors and automated systems on every essay and recording." },
];

const testimonials = [
  { quote: "The reading interface is the closest to the actual computer-delivered IELTS I've seen. My students no longer struggle with format on test day.", author: "Dr. Sarah Jenkins", role: "Head of ESL, Oxford Prep", rating: 5 },
  { quote: "Being able to leave pinpoint audio feedback on student recordings has cut my grading time in half while doubling its effectiveness.", author: "Michael Chang", role: "Independent IELTS Tutor", rating: 5 },
  { quote: "We moved our entire curriculum to OneSoft. The variety of question types means we never compromise pedagogy to fit the software.", author: "Elena Rodriguez", role: "Director, Global English", rating: 5 },
];

const plans = [
  {
    name: "Student", price: "29", period: "/ month", desc: "Perfect for self-study learners preparing for the exam.", features: ["All 4 IELTS bands", "Practice tests & mock exams", "Progress analytics", "AI writing feedback", "Email support"], cta: "Start Free Trial", highlight: false,
  },
  {
    name: "Tutor", price: "79", period: "/ month", desc: "Built for professional tutors managing multiple students.", features: ["Everything in Student", "Cohort management (up to 30)", "Assignment & grading tools", "Audio feedback on recordings", "Priority support"], cta: "Start Free Trial", highlight: true,
  },
  {
    name: "Institution", price: "Custom", period: "", desc: "For language schools and universities at scale.", features: ["Unlimited students", "Custom branding", "API & LTI integrations", "SLA & dedicated CSM", "On-boarding & training"], cta: "Contact Sales", highlight: false,
  },
];

const faqs = [
  { q: "Does OneSoft LMS support computer-delivered IELTS formatting?", a: "Yes. Our platform replicates the computer-delivered IELTS experience including split-screen reading panels, inline highlighting, and exact timer mechanisms." },
  { q: "Can I import my existing lesson materials?", a: "Absolutely. Our lesson builder supports rich text, PDFs, audio, and video. We also provide bulk-import tools for vocabulary lists and reading passages." },
  { q: "Is it suitable for independent tutors or just large institutions?", a: "Both. Independent tutors use OneSoft for a premium student experience, while institutions use our cohort management and analytics tools." },
  { q: "How does the speaking feedback system work?", a: "Students record responses directly in the browser. Tutors then place pinpoint audio or text comments at specific timestamps, offering exact pronunciation corrections." },
  { q: "Is there a free trial?", a: "Yes — all plans include a 14-day free trial, no credit card required. You can explore the full platform before committing." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-24 md:pt-40 md:pb-36">
        {/* gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
        {/* orbs */}
        <div className="orb w-[600px] h-[600px] bg-primary/30 top-[-200px] right-[-100px]" />
        <div className="orb w-[400px] h-[400px] bg-emerald-500/15 bottom-[-100px] left-[-50px]" />
        <div className="orb w-[300px] h-[300px] bg-violet-500/20 top-[100px] left-[40%]" />

        <div className="relative container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <RevealSection>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium mb-8 backdrop-blur-sm">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  Purpose-built for IELTS Mastery
                </div>
              </RevealSection>

              <RevealSection className="stagger-1">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] text-white mb-6 tracking-tight">
                  Turn preparation<br />
                  into{" "}
                  <span className="gradient-text">performance.</span>
                </h1>
              </RevealSection>

              <RevealSection className="stagger-2">
                <p className="text-lg text-white/70 mb-10 leading-relaxed max-w-xl">
                  OneSoft LMS is the definitive platform for serious IELTS students and professional tutors — engineered for the exact demands of the exam.
                </p>
              </RevealSection>

              <RevealSection className="stagger-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="h-12 px-7 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/40" asChild>
                    <a href="/lms/">Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></a>
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 px-7 text-sm font-semibold rounded-xl border-white/25 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm" asChild>
                    <a href="#platform">See How It Works</a>
                  </Button>
                </div>
                <p className="text-xs text-white/45 mt-4">Free 14-day trial · No credit card required</p>
              </RevealSection>
            </div>

            <RevealSection className="stagger-4 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] border border-white/10">
                <img
                  src="/hero-student.png"
                  alt="Student focused on IELTS preparation"
                  className="object-cover w-full h-full"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
              {/* floating card */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-xl px-5 py-4 shadow-xl border border-gray-100 hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Average Improvement</p>
                  <p className="text-xl font-bold text-gray-900">+1.5 Bands</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl px-4 py-3 shadow-xl border border-gray-100 hidden md:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">12K</div>
                <p className="text-xs font-semibold text-gray-700">Active Students</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <RevealSection key={i} className={`stagger-${i + 1} text-center`}>
                <p className="text-4xl font-bold text-foreground mb-1">
                  {s.value}<span className="text-primary">{s.suffix}</span>
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOGOS ─────────────────────────────────────────── */}
      <section className="py-10 bg-gray-50/70 border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <p className="text-center text-xs font-semibold text-gray-400 mb-7 uppercase tracking-[0.15em]">
            Trusted by leading language institutions
          </p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-16 opacity-50 hover:opacity-80 transition-opacity duration-500">
            {["Cambridge", "Oxford Prep", "Global English", "IELTS Masters", "Linguistics Inst."].map((logo, i) => (
              <div key={i} className="text-base font-bold text-gray-600 tracking-tight">{logo}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="platform" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">
                Methodology
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5">A Proven Path to Band 7+</h2>
              <p className="text-lg text-muted-foreground">
                Our platform enforces the rigorous study habits that consistently lead to high band scores.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            {steps.map((step, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm mb-5 group-hover:scale-105 transition-transform shadow-md shadow-primary/25">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUR BANDS ────────────────────────────────────── */}
      <section id="bands" className="py-24 md:py-32 bg-gray-50/60">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">
                IELTS Bands
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5">Engineered for all four bands.</h2>
              <p className="text-lg text-muted-foreground">
                Specialised interfaces for Reading, Writing, Listening, and Speaking — replicating the actual exam environment.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className="group bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2.5">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE ─────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-primary/95 via-primary to-[#302b63]">
        <div className="orb w-[500px] h-[500px] bg-white/5 top-[-150px] right-[-100px]" />
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] border border-white/15">
                <img
                  src="/platform-mockup.png"
                  alt="OneSoft LMS Platform Interface"
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              </div>
            </RevealSection>

            <div className="space-y-7">
              <RevealSection>
                <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Question Types
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">12+ Distinct Question Types</h2>
                <p className="text-white/75 mt-4 text-base leading-relaxed">
                  Multiple choice isn't enough. We support matching headings, true/false/not given, diagram labelling, sentence completion, and every format you'll encounter on test day.
                </p>
              </RevealSection>

              <div className="space-y-3.5">
                {["Drag and drop matching", "Inline text completion", "Interactive diagram labelling", "Rich multimedia integration"].map((item, i) => (
                  <RevealSection key={i} className={`stagger-${i + 1}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-white/85 text-sm">{item}</span>
                    </div>
                  </RevealSection>
                ))}
              </div>

              <RevealSection>
                <Button variant="secondary" size="lg" className="rounded-xl h-11 px-6 text-sm font-semibold bg-white text-primary hover:bg-white/90 shadow-lg" asChild>
                  <a href="/lms/">View Platform Demo <ArrowRight className="w-4 h-4 ml-2" /></a>
                </Button>
              </RevealSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR TUTORS ────────────────────────────────────── */}
      <section id="tutors" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 space-y-8">
              <RevealSection>
                <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-2 uppercase tracking-wide">
                  For Tutors
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">The tutor's unfair advantage.</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Stop managing spreadsheets and generic documents. OneSoft LMS gives professional tutors the tools to track cohorts, assign targeted practice, and grade essays with microscopic precision.
                </p>
              </RevealSection>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { icon: Layers, title: "Structured Lessons", desc: "8+ lesson formats ready to deploy instantly.", color: "bg-blue-50 text-blue-600" },
                  { icon: BarChart3, title: "Precision Analytics", desc: "Pinpoint exactly where each student struggles.", color: "bg-violet-50 text-violet-600" },
                  { icon: Users, title: "Cohort Management", desc: "Manage up to 30+ students from one dashboard.", color: "bg-emerald-50 text-emerald-600" },
                  { icon: Shield, title: "Academic Integrity", desc: "Timestamps and session tracking built in.", color: "bg-orange-50 text-orange-600" },
                ].map((item, i) => (
                  <RevealSection key={i} className={`stagger-${i + 1}`}>
                    <div className="p-5 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                        <item.icon className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </div>

            <div className="order-1 md:order-2">
              <RevealSection>
                <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                  <img
                    src="/tutor-session.png"
                    alt="Tutor working with student"
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </RevealSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-gray-50/60">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">Testimonials</span>
              <h2 className="text-3xl md:text-5xl font-bold">Trusted by professionals.</h2>
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

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">Pricing</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-5">Simple, transparent pricing.</h2>
              <p className="text-muted-foreground text-lg">Start free. Scale when you're ready.</p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <RevealSection key={i} className={`stagger-${i + 1}`}>
                <div className={`relative rounded-2xl p-7 h-full flex flex-col ${
                  plan.highlight
                    ? "bg-primary text-white shadow-2xl shadow-primary/25 scale-[1.02]"
                    : "bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                }`}>
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-400 text-white text-xs font-bold shadow-md">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <p className={`text-sm font-semibold mb-2 ${plan.highlight ? "text-white/75" : "text-muted-foreground"}`}>{plan.name}</p>
                    <div className="flex items-end gap-1 mb-3">
                      {plan.price !== "Custom" && <span className={`text-lg font-medium ${plan.highlight ? "text-white/75" : "text-muted-foreground"}`}>$</span>}
                      <span className="text-5xl font-bold leading-none">{plan.price}</span>
                      {plan.period && <span className={`text-sm mb-1.5 ${plan.highlight ? "text-white/65" : "text-muted-foreground"}`}>{plan.period}</span>}
                    </div>
                    <p className={`text-sm leading-relaxed ${plan.highlight ? "text-white/75" : "text-muted-foreground"}`}>{plan.desc}</p>
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
                    <a href={plan.cta === "Contact Sales" ? "mailto:contact@onesoftlms.com" : "/lms/"}>
                      {plan.cta}
                    </a>
                  </Button>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50/60">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-4 uppercase tracking-wide">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
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

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#1a1a3e]" />
        <div className="orb w-[500px] h-[500px] bg-primary/40 top-[-150px] left-[-100px]" />
        <div className="orb w-[400px] h-[400px] bg-violet-500/20 bottom-[-100px] right-[-50px]" />

        <div className="relative container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <RevealSection>
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-6 uppercase tracking-wide">
              Get Started Today
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to elevate<br />your standards?
            </h2>
            <p className="text-lg text-white/65 mb-10 max-w-xl mx-auto leading-relaxed">
              Join the platform that treats language acquisition with the seriousness it deserves. Start your free 14-day trial — no credit card needed.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="h-13 px-10 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/40" asChild>
                <a href="/lms/">Start for Free <ArrowRight className="w-4 h-4 ml-2" /></a>
              </Button>
              <Button size="lg" className="h-13 px-10 text-base font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20" asChild>
                <a href="mailto:contact@onesoftlms.com">Talk to Sales</a>
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
