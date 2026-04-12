import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-serif font-bold text-lg group-hover:bg-secondary transition-colors">
            O
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-foreground">OneSoft LMS</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Platform</Link>
          <Link href="#bands" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">IELTS Bands</Link>
          <Link href="#tutors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">For Tutors</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-foreground hover:text-secondary hidden sm:block transition-colors">
            Sign In
          </Link>
          <Button asChild className="rounded-full px-6">
            <Link href="/start">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
