import { useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Lock, Mail, Eye, EyeOff, GraduationCap, User, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";

export default function AdminLogin() {
  const { login, user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regOrg, setRegOrg] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);

  if (user?.role === "admin") {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      setLocation("/");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const resp = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          orgName: regOrg.trim(),
        }),
      });
      const data = await resp.json() as { message?: string; id?: number; role?: string; tenantId?: number | null };
      if (!resp.ok) {
        setRegError(data.message ?? "Registration failed");
        return;
      }
      await refreshUser();
      setLocation("/");
    } catch {
      setRegError("Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1b60]">

      {/* ── Top red utility bar ── */}
      <div className="bg-[#CC0000] shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-9 flex items-center justify-end gap-0">
          <a
            href="/lms/"
            className="px-4 h-9 flex items-center text-white text-sm font-medium bg-white/20"
          >
            Admin Login
          </a>
          <a
            href="/lms/student/login"
            className="px-4 h-9 flex items-center text-white text-sm font-medium hover:bg-white/15 transition-colors"
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
          backgroundImage: "url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#0d1b60]/55" />

        <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 md:px-8 py-12 gap-8 items-start lg:items-center">

          {/* ── White card (left) ── */}
          <div className="bg-white w-full lg:w-[460px] shrink-0 shadow-xl">
            <Tabs defaultValue="login">
              <div className="px-8 pt-8 pb-0">
                <h1 className="text-2xl font-bold text-[#0d1b60] mb-1">Admin Portal</h1>
                <p className="text-gray-500 text-sm mb-5">Manage your academy — courses, students, and content.</p>
                <TabsList className="w-full rounded-none border-b border-gray-200 bg-transparent h-auto p-0 gap-0">
                  <TabsTrigger
                    value="login"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#CC0000] data-[state=active]:text-[#CC0000] data-[state=active]:bg-transparent text-gray-500 font-semibold text-sm pb-3 pt-1"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#CC0000] data-[state=active]:text-[#CC0000] data-[state=active]:bg-transparent text-gray-500 font-semibold text-sm pb-3 pt-1"
                  >
                    Create Academy
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="px-8 py-6">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={(e) => { void handleLogin(e); }} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-sm font-semibold text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-9 rounded-none border-gray-300 focus-visible:ring-[#CC0000] focus-visible:border-[#CC0000]"
                          placeholder="admin@lms.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="login-password" className="text-sm font-semibold text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type={showLoginPw ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-9 pr-10 rounded-none border-gray-300 focus-visible:ring-[#CC0000] focus-visible:border-[#CC0000]"
                          placeholder="••••••••"
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          tabIndex={-1}
                          aria-label={showLoginPw ? "Hide password" : "Show password"}
                        >
                          {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                        {loginError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11 rounded-none bg-[#CC0000] hover:bg-[#aa0000] text-white font-semibold gap-2"
                      disabled={loginLoading}
                    >
                      {loginLoading ? "Signing in…" : "Sign In"}
                      {!loginLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>

                    <div className="relative my-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-gray-400">or</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 rounded-none border-[#0d1b60] text-[#0d1b60] hover:bg-[#0d1b60] hover:text-white font-semibold gap-2"
                      onClick={() => setLocation("/student/login")}
                    >
                      <GraduationCap className="h-4 w-4" />
                      Login as Student
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <form onSubmit={(e) => { void handleRegister(e); }} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="reg-name"
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="pl-9 rounded-none border-gray-300 focus-visible:ring-[#CC0000]"
                          placeholder="Your full name"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-org" className="text-sm font-semibold text-gray-700">Academy Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="reg-org"
                          type="text"
                          value={regOrg}
                          onChange={(e) => setRegOrg(e.target.value)}
                          className="pl-9 rounded-none border-gray-300 focus-visible:ring-[#CC0000]"
                          placeholder="e.g. Sunrise IELTS Academy"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email" className="text-sm font-semibold text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="reg-email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="pl-9 rounded-none border-gray-300 focus-visible:ring-[#CC0000]"
                          placeholder="you@school.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password" className="text-sm font-semibold text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="reg-password"
                          type={showRegPw ? "text" : "password"}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="pl-9 pr-10 rounded-none border-gray-300 focus-visible:ring-[#CC0000]"
                          placeholder="Min 6 characters"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          tabIndex={-1}
                        >
                          {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {regError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                        {regError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11 rounded-none bg-[#CC0000] hover:bg-[#aa0000] text-white font-semibold gap-2"
                      disabled={regLoading}
                    >
                      {regLoading ? "Creating account…" : "Create Academy & Get Started"}
                      {!regLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>

                    <p className="text-xs text-center text-gray-400">
                      Your academy starts with a free 14-day trial. No credit card required.
                    </p>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* ── Right text block ── */}
          <div className="lg:pl-12 text-white max-w-lg">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-5">
              Manage your<br />
              IELTS academy<br />
              <span className="text-[#3DB7E4]">with confidence.</span>
            </h2>
            <p className="text-white/75 text-lg leading-relaxed mb-8">
              Full curriculum control, student enrolment, quiz management, gradebook, and analytics — everything your academy needs in one institutional platform.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: "40+", label: "Academies Onboarded" },
                { val: "12K+", label: "Active Students" },
                { val: "8", label: "Lesson Types" },
                { val: "48h", label: "Setup Time" },
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
