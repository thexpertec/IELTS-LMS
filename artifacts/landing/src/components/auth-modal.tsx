import { useState, createContext, useContext, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  X, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle,
  CheckCircle2, ArrowRight,
} from "lucide-react";

/* ─── CONTEXT ────────────────────────────────────────────────────── */
interface AuthModalCtx {
  open: (redirect?: string) => void;
  close: () => void;
}
const AuthModalContext = createContext<AuthModalCtx>({ open: () => {}, close: () => {} });

export function useAuthModal() {
  return useContext(AuthModalContext);
}

/* ─── PROVIDER ───────────────────────────────────────────────────── */
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [redirect, setRedirect] = useState<string | undefined>();

  const open = useCallback((r?: string) => { setRedirect(r); setVisible(true); }, []);
  const close = useCallback(() => setVisible(false), []);

  return (
    <AuthModalContext.Provider value={{ open, close }}>
      {children}
      {visible && <AuthModal onClose={close} redirectUrl={redirect} />}
    </AuthModalContext.Provider>
  );
}

/* ─── MODAL ──────────────────────────────────────────────────────── */
type Mode = "signup" | "login" | "forgot";

function AuthModal({ onClose, redirectUrl }: { onClose: () => void; redirectUrl?: string }) {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (mode !== "forgot" && password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup" && name.trim().length < 2) { setError("Please enter your full name."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    if (mode === "forgot") { setForgotSent(true); return; }
    // Redirect to checkout or LMS
    window.location.href = redirectUrl || "/lms/";
  }

  function handleGoogle() {
    setLoading(true);
    setTimeout(() => { window.location.href = redirectUrl || "/lms/"; }, 1200);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

        <div className="p-6 md:p-8">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {forgotSent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Check your inbox</h3>
              <p className="text-slate-500 text-sm mb-6">Password reset link sent to <strong>{email}</strong></p>
              <button onClick={() => { setForgotSent(false); setMode("login"); }}
                className="text-indigo-600 font-semibold text-sm hover:underline">
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">
                  {mode === "signup" ? "Join OneSoft IELTS" : mode === "login" ? "Welcome back" : "Reset password"}
                </h2>
                <p className="text-slate-500 text-sm">
                  {mode === "signup" ? "Start your Band 7+ journey today" : mode === "login" ? "Sign in to your account" : "We'll send you a reset link"}
                </p>
              </div>

              {/* Google */}
              {mode !== "forgot" && (
                <>
                  <button onClick={handleGoogle} disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all mb-4 disabled:opacity-60">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    Continue with Google
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-xs text-slate-400 font-medium">or</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name" required
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" required
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                  </div>
                </div>

                {mode !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Password</label>
                      {mode === "login" && (
                        <button type="button" onClick={() => setMode("forgot")}
                          className="text-xs text-indigo-600 hover:underline font-medium">Forgot?</button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type={showPw ? "text" : "password"} value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters" required minLength={6}
                        className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                      <button type="button" onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2 mt-1">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</> :
                    mode === "signup" ? <><ArrowRight className="w-4 h-4" /> Create Account</> :
                    mode === "login" ? "Sign In" : "Send Reset Link"}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500 mt-4">
                {mode === "signup" ? (
                  <>Have an account? <button onClick={() => setMode("login")} className="text-indigo-600 font-semibold hover:underline">Sign in</button></>
                ) : mode === "login" ? (
                  <>New here? <button onClick={() => setMode("signup")} className="text-indigo-600 font-semibold hover:underline">Create account</button></>
                ) : (
                  <button onClick={() => setMode("login")} className="text-indigo-600 font-semibold hover:underline">Back to sign in</button>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
