import { useState } from "react";
import { useLocation } from "wouter";
import { Mail, Lock, ArrowRight, Eye, EyeOff, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudent } from "@/context/student-context";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const { student, login } = useStudent();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (student) {
    setLocation("/student/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      setLocation("/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1b60]">

      {/* ── Top red utility bar ── */}
      <div className="bg-[#CC0000] shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-9 flex items-center justify-end gap-0">
          <a
            href="/lms/"
            className="px-4 h-9 flex items-center text-white text-sm font-medium hover:bg-white/15 transition-colors"
          >
            Admin Login
          </a>
          <a
            href="/lms/student/login"
            className="px-4 h-9 flex items-center text-white text-sm font-medium bg-white/20"
          >
            Student Login
          </a>
        </div>
      </div>

      {/* ── Navy branding bar ── */}
      <div className="bg-[#0d1b60] shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-white flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[#0d1b60]" />
            </div>
            <div className="leading-tight">
              <span className="text-white font-bold text-xl tracking-tight">IELTS</span>
              <span className="text-white/60 font-normal text-xl"> Academy LMS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div
        className="relative flex-1 flex items-stretch"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* dark overlay on the right side */}
        <div className="absolute inset-0 bg-[#0d1b60]/50" />

        <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 md:px-8 py-12 gap-8 items-start lg:items-center">

          {/* ── White card (left) ── */}
          <div className="bg-white w-full lg:w-[420px] shrink-0 p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-[#0d1b60] mb-1">Student Portal</h1>
            <p className="text-gray-500 text-sm mb-7">
              Sign in to access your courses, assignments, and progress.
            </p>

            <form onSubmit={(e) => { void handleLogin(e); }} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9 rounded-none border-gray-300 focus-visible:ring-[#CC0000] focus-visible:border-[#CC0000]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    data-testid="input-student-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-10 rounded-none border-gray-300 focus-visible:ring-[#CC0000] focus-visible:border-[#CC0000]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    data-testid="input-student-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-none bg-[#CC0000] hover:bg-[#aa0000] text-white font-semibold gap-2"
                disabled={loading}
                data-testid="btn-student-login"
              >
                {loading ? "Signing in…" : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                Are you an admin?{" "}
                <a href="/lms/" className="font-semibold text-[#0d1b60] hover:text-[#CC0000] transition-colors">
                  Sign in to Admin Portal
                </a>
              </p>
            </div>
          </div>

          {/* ── Right text block ── */}
          <div className="lg:pl-12 text-white max-w-lg">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-5">
              Start your IELTS<br />
              journey today.
            </h2>
            <p className="text-white/75 text-lg leading-relaxed mb-8">
              Access your personalised learning programme — reading, writing, listening, speaking — all in one place. Track your progress and reach your target band score.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: "12K+", label: "Active Students" },
                { val: "+1.5", label: "Avg Band Improvement" },
                { val: "40+", label: "IELTS Academies" },
                { val: "98%", label: "Satisfaction Rate" },
              ].map((s) => (
                <div key={s.label} className="border border-white/20 px-4 py-3 bg-white/8">
                  <p className="text-2xl font-bold text-white">{s.val}</p>
                  <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div className="bg-[#0a1550] py-4 shrink-0">
        <p className="text-center text-white/40 text-xs">
          © {new Date().getFullYear()} IELTS Academy LMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
