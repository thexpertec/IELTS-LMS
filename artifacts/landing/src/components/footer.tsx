import { Link } from "wouter";
import { GraduationCap, Mail, Phone, MapPin, Youtube, Twitter, Instagram, Facebook, Linkedin, ArrowRight } from "lucide-react";

export function Footer() {
  const cols = [
    {
      title: "Courses",
      links: [
        { label: "IELTS Academic", href: "/courses" },
        { label: "IELTS General", href: "/courses" },
        { label: "Band 7+ Prep", href: "/courses" },
        { label: "Mock Tests", href: "#resources" },
        { label: "Speaking Practice", href: "/courses" },
      ],
    },
    {
      title: "IELTS Modules",
      links: [
        { label: "Listening", href: "#modules" },
        { label: "Reading", href: "#modules" },
        { label: "Writing Task 1 & 2", href: "#modules" },
        { label: "Speaking", href: "#modules" },
        { label: "Grammar & Vocabulary", href: "#modules" },
      ],
    },
    {
      title: "Free Resources",
      links: [
        { label: "Practice Tests", href: "#resources" },
        { label: "Band Score Calculator", href: "#resources" },
        { label: "Essay Templates", href: "#resources" },
        { label: "Cue Card Topics", href: "#resources" },
        { label: "Vocabulary Lists", href: "#resources" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "#" },
        { label: "Affiliate Program", href: "#" },
        { label: "Contact Us", href: "#" },
      ],
    },
  ];

  const socials = [
    { icon: Youtube, label: "YouTube" },
    { icon: Instagram, label: "Instagram" },
    { icon: Facebook, label: "Facebook" },
    { icon: Twitter, label: "Twitter" },
    { icon: Linkedin, label: "LinkedIn" },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold mb-1">Get free IELTS tips every week</h3>
              <p className="text-slate-400 text-sm">Band score strategies, practice tests, and insider tips — straight to your inbox.</p>
            </div>
            <form className="flex w-full md:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5">
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[1.05rem] tracking-tight">OneSoft IELTS</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              The most trusted IELTS preparation platform for students targeting Band 7+. AI-powered feedback, certified trainers, and proven results.
            </p>
            <div className="flex gap-2.5 mb-6">
              {socials.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
            <div className="space-y-2.5 text-sm text-slate-400">
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> <span>support@onesoftlms.com</span></div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> <span>+1 (800) 123-4567</span></div>
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4 text-white">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"href" in l && l.href.startsWith("/") ? (
                      <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
                    ) : (
                      <a href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 mb-10 flex flex-wrap gap-4">
          {["SSL Secured", "GDPR Compliant", "ISO 27001", "4.9★ Rated"].map((badge) => (
            <div key={badge} className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-400 font-medium">{badge}</div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} OneSoft IELTS. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Refund Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
