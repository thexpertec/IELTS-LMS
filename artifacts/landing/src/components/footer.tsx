import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-primary text-white py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-primary font-serif font-bold text-lg">
                O
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-white">OneSoft LMS</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed max-w-xs">
              The advanced Learning Management System built specifically for serious IELTS exam preparation and professional language mastery.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 font-serif text-white">Platform</h4>
            <ul className="space-y-4 text-sm text-white/75">
              <li><Link href="#bands" className="hover:text-white transition-colors">IELTS Band Training</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Question Types</Link></li>
              <li><Link href="#scoring" className="hover:text-white transition-colors">Precision Scoring</Link></li>
              <li><Link href="#multimedia" className="hover:text-white transition-colors">Multimedia Engine</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 font-serif text-white">Solutions</h4>
            <ul className="space-y-4 text-sm text-white/75">
              <li><Link href="#students" className="hover:text-white transition-colors">For Ambitious Students</Link></li>
              <li><Link href="#tutors" className="hover:text-white transition-colors">For Professional Tutors</Link></li>
              <li><Link href="#institutions" className="hover:text-white transition-colors">For Institutions</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 font-serif text-white">Contact</h4>
            <ul className="space-y-4 text-sm text-white/75">
              <li>contact@onesoftlms.com</li>
              <li>+1 (555) 123-4567</li>
              <li>San Francisco, CA</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/65">
          <p>&copy; {new Date().getFullYear()} OneSoft LMS. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
