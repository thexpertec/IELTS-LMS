import { Link } from "wouter";

export function Footer() {
  const cols = [
    {
      title: "Platform",
      links: ["IELTS Band Training", "Question Types", "Precision Scoring", "Multimedia Engine"],
    },
    {
      title: "Solutions",
      links: ["For Students", "For Tutors", "For Institutions", "Enterprise"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Contact"],
    },
  ];

  return (
    <footer className="bg-gray-950 text-white">
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">O</div>
              <span className="font-bold text-[1.05rem] tracking-tight">OneSoft LMS</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              The advanced Learning Management System purpose-built for serious IELTS exam preparation and professional language mastery.
            </p>
            <div className="flex gap-3">
              {["Twitter", "LinkedIn", "YouTube"].map((s) => (
                <div key={s} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors cursor-pointer text-[10px] font-bold">
                  {s[0]}
                </div>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-5 text-white">{col.title}</h4>
              <ul className="space-y-3.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} OneSoft LMS. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
