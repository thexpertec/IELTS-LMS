import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Button } from "@/components/ui/button";
import { BookOpen, PenTool, Headphones, Mic, Target, Layers, BarChart, ArrowRight, CheckCircle2, Quote, PlayCircle, Award, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function RevealSection({ children, className, stagger = false }: { children: React.ReactNode, className?: string, stagger?: boolean }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={cn("reveal-on-scroll", isVisible && "is-visible", className)}>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 md:px-6 container mx-auto overflow-hidden">
          <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-center">
            <div className="max-w-2xl">
              <RevealSection>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6">
                  <Target className="w-4 h-4" />
                  <span>Purpose-built for IELTS Mastery</span>
                </div>
              </RevealSection>
              
              <RevealSection className="stagger-1">
                <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-foreground">
                  Turn preparation into <span className="text-primary italic">performance.</span>
                </h1>
              </RevealSection>
              
              <RevealSection className="stagger-2">
                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                  OneSoft LMS is the definitive platform for serious IELTS students and professional tutors. Move beyond generic e-learning to a system engineered for the exact demands of the exam.
                </p>
              </RevealSection>
              
              <RevealSection className="stagger-3">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="rounded-full text-base h-14 px-8" asChild>
                    <Link href="/start">Start Your Journey <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full text-base h-14 px-8" asChild>
                    <Link href="#platform">Explore the Platform</Link>
                  </Button>
                </div>
              </RevealSection>
            </div>
            
            <RevealSection className="stagger-4 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-muted">
                <img 
                  src="/hero-student.png" 
                  alt="Student focused on IELTS preparation" 
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              </div>
              
              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-6 shadow-xl border border-border animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                    <BarChart className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Average Improvement</p>
                    <p className="text-2xl font-bold font-serif">+1.5 Bands</p>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* LOGOS / SOCIAL PROOF */}
        <section className="py-12 border-y border-border/50 bg-white/50">
          <div className="container mx-auto px-4 md:px-6">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">
              Trusted by leading language institutions
            </p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
              {['Cambridge', 'Oxford Prep', 'Global English', 'IELTS Masters', 'Linguistics Inst.'].map((logo, i) => (
                <div key={i} className="text-xl font-serif font-bold text-primary">{logo}</div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <RevealSection>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 font-serif">A Proven Methodology</h2>
                <p className="text-lg text-muted-foreground">
                  Our platform enforces the rigorous study habits that lead to high band scores.
                </p>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Target, title: "Diagnostic Assessment", desc: "Begin with a full-length mock test to identify exact weak points down to the question sub-type." },
                { icon: PlayCircle, title: "Targeted Practice", desc: "Engage with 8+ structured lesson formats targeting your specific gaps in grammar, vocabulary, and exam strategy." },
                { icon: Award, title: "Performance Review", desc: "Receive microscopic feedback from tutors and automated systems on every essay and speaking recording." }
              ].map((step, i) => (
                <RevealSection key={i} className={`stagger-${i+1}`}>
                  <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-6 text-xl font-bold">
                      {i + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID - THE 4 BANDS */}
        <section id="bands" className="py-24 md:py-32 container mx-auto px-4 md:px-6">
          <RevealSection>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Engineered for all four bands.</h2>
              <p className="text-lg text-muted-foreground">
                Generic LMS platforms treat all content the same. OneSoft LMS provides specialized interfaces for Reading, Writing, Listening, and Speaking, replicating the actual exam environment.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: "Reading", desc: "Side-by-side text and question panels, highlighting tools, and 12+ authentic question types." },
              { icon: PenTool, title: "Writing", desc: "Real-time word counts, precise essay formatting, and detailed tutor annotation capabilities." },
              { icon: Headphones, title: "Listening", desc: "Integrated audio controls with synchronized questioning and exact timing replication." },
              { icon: Mic, title: "Speaking", desc: "High-fidelity audio recording, prompt timing, and nuanced pronunciation feedback." }
            ].map((feature, i) => (
              <RevealSection key={i} className={`stagger-${i+1}`}>
                <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-secondary hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-serif">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </section>

        {/* DEEP DIVE WITH IMAGE */}
        <section className="py-24 bg-primary text-primary-foreground overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <RevealSection>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] border border-white/10">
                  <img 
                    src="/platform-mockup.png" 
                    alt="OneSoft LMS Platform Interface" 
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
              </RevealSection>
              
              <div className="space-y-8">
                <RevealSection>
                  <h2 className="text-3xl md:text-5xl font-bold font-serif">12+ Distinct Question Types</h2>
                  <p className="text-white/90 mt-4 text-lg leading-relaxed">
                    Multiple choice is not enough. We support matching headings, true/false/not given, diagram labeling, sentence completion, and every other format you will encounter on test day.
                  </p>
                </RevealSection>
                
                <div className="space-y-4">
                  {['Drag and drop matching', 'Inline text completion', 'Interactive diagram labeling', 'Rich multimedia integration'].map((item, i) => (
                    <RevealSection key={i} className={`stagger-${i+1}`}>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-secondary" />
                        <span className="text-lg">{item}</span>
                      </div>
                    </RevealSection>
                  ))}
                </div>
                
                <RevealSection className="pt-4">
                  <Button variant="secondary" size="lg" className="rounded-full">
                    View Platform Demo
                  </Button>
                </RevealSection>
              </div>
            </div>
          </div>
        </section>

        {/* FOR TUTORS */}
        <section id="tutors" className="py-24 md:py-32 container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 space-y-8">
              <RevealSection>
                <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6">The tutor's unfair advantage.</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stop managing spreadsheets and generic shared documents. OneSoft LMS gives professional tutors the tools to track cohorts, assign targeted practice, and grade essays with microscopic precision.
                </p>
              </RevealSection>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <RevealSection className="stagger-1">
                  <div className="p-6 bg-muted/50 rounded-xl border border-border/50">
                    <Layers className="w-8 h-8 text-primary mb-4" />
                    <h4 className="font-bold mb-2">Structured Lessons</h4>
                    <p className="text-sm text-muted-foreground">8+ lesson formats ready to deploy.</p>
                  </div>
                </RevealSection>
                <RevealSection className="stagger-2">
                  <div className="p-6 bg-muted/50 rounded-xl border border-border/50">
                    <BarChart className="w-8 h-8 text-primary mb-4" />
                    <h4 className="font-bold mb-2">Precision Analytics</h4>
                    <p className="text-sm text-muted-foreground">Pinpoint exactly where students struggle.</p>
                  </div>
                </RevealSection>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <RevealSection>
                <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-square md:aspect-[4/3]">
                  <img 
                    src="/tutor-session.png" 
                    alt="Tutor working with student" 
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <RevealSection>
              <h2 className="text-3xl md:text-5xl font-bold text-center font-serif mb-16">Trusted by professionals.</h2>
            </RevealSection>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { quote: "The reading interface is the closest thing to the actual computer-delivered IELTS I've seen. My students no longer struggle with the format on test day.", author: "Dr. Sarah Jenkins", role: "Head of ESL, Oxford Prep" },
                { quote: "Being able to leave pinpoint audio feedback on student speaking recordings has cut my grading time in half while doubling its effectiveness.", author: "Michael Chang", role: "Independent IELTS Tutor" },
                { quote: "We moved our entire curriculum to OneSoft. The variety of question types means we never have to compromise our pedagogy to fit the software.", author: "Elena Rodriguez", role: "Director, Global English" }
              ].map((testimonial, i) => (
                <RevealSection key={i} className={`stagger-${i+1}`}>
                  <div className="bg-card p-8 rounded-2xl shadow-sm border border-border/50 h-full flex flex-col">
                    <Quote className="w-10 h-10 text-secondary/55 mb-6" />
                    <p className="text-foreground leading-relaxed italic mb-8 flex-1">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-bold font-serif">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-24 container mx-auto px-4 md:px-6 max-w-4xl">
          <RevealSection>
            <h2 className="text-3xl md:text-5xl font-bold text-center font-serif mb-12">Frequently Asked Questions</h2>
          </RevealSection>
          
          <RevealSection className="stagger-1">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b border-border/50 py-2">
                <AccordionTrigger className="text-lg font-medium hover:text-secondary hover:no-underline">Does OneSoft LMS support computer-delivered IELTS formatting?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Yes, our platform is meticulously designed to replicate the computer-delivered IELTS experience, including split-screen reading panels, inline highlighting, and exact timer mechanisms.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b border-border/50 py-2">
                <AccordionTrigger className="text-lg font-medium hover:text-secondary hover:no-underline">Can I import my existing lesson materials?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Absolutely. Our lesson builder supports rich text, PDFs, audio, and video formats. We also provide bulk-import tools for vocabulary lists and reading passages.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-b border-border/50 py-2">
                <AccordionTrigger className="text-lg font-medium hover:text-secondary hover:no-underline">Is it suitable for independent tutors or just large institutions?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Both. We offer flexible plans. Independent tutors use OneSoft to provide a premium, professional experience to their private students, while institutions use our cohort management tools.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-b border-border/50 py-2">
                <AccordionTrigger className="text-lg font-medium hover:text-secondary hover:no-underline">How does the speaking feedback system work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Students record their responses directly in the browser. Tutors can then listen and place pinpoint audio or text comments at specific timestamps on the recording, offering exact pronunciation corrections.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </RevealSection>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 md:py-32 bg-secondary text-white text-center px-4">
          <div className="container mx-auto max-w-4xl">
            <RevealSection>
              <h2 className="text-4xl md:text-6xl font-bold font-serif mb-8 text-white">Ready to elevate your standards?</h2>
              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                Join the platform that treats language acquisition with the seriousness it deserves. Start your journey with OneSoft LMS today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="bg-white text-secondary hover:bg-white/90 rounded-full h-14 px-10 text-lg">
                  Start for Free
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-full h-14 px-10 text-lg">
                  Contact Sales
                </Button>
              </div>
            </RevealSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
