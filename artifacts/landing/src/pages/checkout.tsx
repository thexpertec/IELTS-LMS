import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, ChevronRight, Lock, Shield, RefreshCw, Award,
  CreditCard, Smartphone, Building2, Globe, Eye, EyeOff,
  ArrowLeft, Mail, User, AlertCircle, Loader2, Zap, Clock,
  BookOpen, Users, Star, Check, X, ArrowRight, Sparkles,
  Play,
} from "lucide-react";

/* ─── COURSE CATALOG (matches courses-listing data) ─────────────── */
const COURSES: Record<string, {
  id: string; title: string; instructor: string; instructorRole: string;
  price: number; originalPrice: number; discount: number; duration: string;
  lessons: number; students: number; rating: number; image: string;
  badge: string; hasCert: boolean; hasAI: boolean;
}> = {
  "1": {
    id: "1",
    title: "IELTS Academic Complete Course — Band 7+ Guarantee",
    instructor: "Dr. Sarah Mitchell", instructorRole: "Ex-IELTS Examiner, Cambridge",
    price: 129, originalPrice: 299, discount: 57,
    duration: "48h", lessons: 94, students: 18420, rating: 4.9,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&q=80",
    badge: "Bestseller", hasCert: true, hasAI: true,
  },
  "2": {
    id: "2",
    title: "IELTS Writing Masterclass — Task 1 & Task 2",
    instructor: "Prof. James Chen", instructorRole: "Band 9 Writing Coach",
    price: 79, originalPrice: 179, discount: 56,
    duration: "22h", lessons: 48, students: 9801, rating: 4.8,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=120&q=80",
    badge: "Top Rated", hasCert: true, hasAI: true,
  },
  "3": {
    id: "3",
    title: "Speaking Band 7+ — 30-Day Intensive Program",
    instructor: "Emma Watson", instructorRole: "IELTS Speaking Specialist",
    price: 69, originalPrice: 149, discount: 54,
    duration: "18h", lessons: 36, students: 5632, rating: 4.9,
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=120&q=80",
    badge: "New", hasCert: false, hasAI: true,
  },
  "default": {
    id: "1",
    title: "IELTS Academic Complete Course — Band 7+ Guarantee",
    instructor: "Dr. Sarah Mitchell", instructorRole: "Ex-IELTS Examiner, Cambridge",
    price: 129, originalPrice: 299, discount: 57,
    duration: "48h", lessons: 94, students: 18420, rating: 4.9,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&q=80",
    badge: "Bestseller", hasCert: true, hasAI: true,
  },
};

const COUPONS: Record<string, number> = {
  "IELTS20": 20,
  "BAND7": 15,
  "WELCOME10": 10,
  "STUDENT25": 25,
};

type Step = "auth" | "order" | "payment" | "success";
type AuthMode = "login" | "signup" | "forgot";
type PayMethod = "card" | "paypal" | "jazzcash" | "easypaisa" | "bank";

/* ─── STEP INDICATOR ─────────────────────────────────────────────── */
const STEPS = [
  { key: "auth", label: "Account" },
  { key: "order", label: "Review" },
  { key: "payment", label: "Payment" },
  { key: "success", label: "Done" },
] as const;

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all",
              done ? "bg-indigo-600 text-white" : active ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-slate-100 text-slate-400"
            )}>
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn("ml-2 text-xs font-semibold hidden sm:block", active ? "text-indigo-700" : done ? "text-indigo-500" : "text-slate-400")}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("w-10 sm:w-16 h-0.5 mx-2 transition-all", i < idx ? "bg-indigo-500" : "bg-slate-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── TRUST STRIP ────────────────────────────────────────────────── */
function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-5 border-t border-slate-100">
      {[
        { icon: Shield, label: "30-Day Money Back" },
        { icon: Lock, label: "SSL Encrypted" },
        { icon: RefreshCw, label: "Lifetime Access" },
        { icon: Award, label: "Certificate Included" },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
          <Icon className="w-3.5 h-3.5 text-emerald-500" /> {label}
        </div>
      ))}
    </div>
  );
}

/* ─── COURSE SUMMARY CARD ────────────────────────────────────────── */
function CourseSummary({ course, price, couponPct }: {
  course: typeof COURSES["1"]; price: number; couponPct: number;
}) {
  const savings = course.originalPrice - price;
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
      <div className="flex gap-3">
        <img src={course.image} alt={course.title} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug mb-1">{course.title}</p>
          <p className="text-[11px] text-slate-500">{course.instructor}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-600">{course.rating}</span>
            <span className="text-[11px] text-slate-400">({course.students.toLocaleString()} students)</span>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>Duration</span><span className="font-semibold flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Lessons</span><span className="font-semibold flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons} lessons</span>
        </div>
        {course.hasCert && (
          <div className="flex items-center justify-between">
            <span>Certificate</span><span className="font-semibold text-emerald-600 flex items-center gap-1"><Award className="w-3 h-3" />Included</span>
          </div>
        )}
        {course.hasAI && (
          <div className="flex items-center justify-between">
            <span>AI Feedback</span><span className="font-semibold text-violet-600 flex items-center gap-1"><Zap className="w-3 h-3" />Unlimited</span>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Original price</span>
          <span className="line-through">${course.originalPrice}</span>
        </div>
        <div className="flex justify-between text-emerald-600 font-semibold">
          <span>Discount ({course.discount}% off)</span>
          <span>-${course.originalPrice - (couponPct > 0 ? course.price : course.price)}</span>
        </div>
        {couponPct > 0 && (
          <div className="flex justify-between text-indigo-600 font-semibold">
            <span>Coupon ({couponPct}% off)</span>
            <span>-${Math.round(course.price * couponPct / 100)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-slate-900 text-base pt-1 border-t border-slate-200">
          <span>Total</span>
          <span>${price}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── STEP 1: AUTH ───────────────────────────────────────────────── */
function AuthStep({ onNext }: { onNext: (email: string, name: string) => void }) {
  const [mode, setMode] = useState<AuthMode>("signup");
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
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (mode !== "forgot" && password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup" && name.trim().length < 2) { setError("Please enter your full name."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    if (mode === "forgot") { setForgotSent(true); return; }
    onNext(email, name || email.split("@")[0]);
  }

  function handleGoogle() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onNext("user@gmail.com", "Google User");
    }, 1500);
  }

  if (forgotSent) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">Check your inbox</h3>
        <p className="text-slate-500 text-sm mb-6">We sent a password reset link to <strong>{email}</strong></p>
        <button onClick={() => { setForgotSent(false); setMode("login"); }} className="text-indigo-600 font-semibold text-sm hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-extrabold text-slate-900 mb-1">
          {mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Reset your password"}
        </h2>
        <p className="text-slate-500 text-sm">
          {mode === "signup" ? "Join 50,000+ IELTS students today" : mode === "login" ? "Sign in to continue to checkout" : "We'll send you a reset link"}
        </p>
      </div>

      {/* Google SSO */}
      {mode !== "forgot" && (
        <>
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all mb-4 disabled:opacity-60"
          >
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
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your full name" required
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              {mode === "login" && (
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-indigo-600 hover:underline font-medium">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters" required minLength={6}
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === "signup" && (
              <div className="flex gap-1 mt-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={cn("flex-1 h-1 rounded-full transition-all",
                    password.length >= i * 2 ? password.length >= 8 ? "bg-emerald-400" : "bg-amber-400" : "bg-slate-200"
                  )} />
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all hover:scale-[1.01] shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</> :
            mode === "signup" ? "Create Account & Continue" :
            mode === "login" ? "Sign In & Continue" : "Send Reset Link"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-4">
        {mode === "signup" ? (
          <>Already have an account? <button onClick={() => setMode("login")} className="text-indigo-600 font-semibold hover:underline">Sign in</button></>
        ) : mode === "login" ? (
          <>New here? <button onClick={() => setMode("signup")} className="text-indigo-600 font-semibold hover:underline">Create account</button></>
        ) : (
          <>Remember your password? <button onClick={() => setMode("login")} className="text-indigo-600 font-semibold hover:underline">Sign in</button></>
        )}
      </p>

      {mode === "signup" && (
        <p className="text-center text-[10px] text-slate-400 mt-3 leading-relaxed">
          By creating an account you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>
        </p>
      )}
    </div>
  );
}

/* ─── STEP 2: ORDER REVIEW ───────────────────────────────────────── */
function OrderStep({
  course, userEmail, userName, couponPct, couponCode, finalPrice,
  onCouponApply, onNext,
}: {
  course: typeof COURSES["1"]; userEmail: string; userName: string;
  couponPct: number; couponCode: string; finalPrice: number;
  onCouponApply: (code: string, pct: number) => void;
  onNext: () => void;
}) {
  const [code, setCode] = useState(couponCode);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  async function applyCoupon() {
    if (!code.trim()) return;
    setCouponError(""); setCouponLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setCouponLoading(false);
    const pct = COUPONS[code.toUpperCase()];
    if (pct) {
      onCouponApply(code.toUpperCase(), pct);
    } else {
      setCouponError("Invalid coupon code. Try IELTS20 or BAND7.");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-1">Review your order</h2>
      <p className="text-slate-500 text-sm mb-5">Signed in as <span className="font-semibold text-indigo-600">{userEmail}</span></p>

      <CourseSummary course={course} price={finalPrice} couponPct={couponPct} />

      {/* Coupon */}
      <div className="mt-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Have a coupon code?</label>
        <div className="flex gap-2">
          <input
            type="text" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCouponError(""); }}
            placeholder="e.g. IELTS20" maxLength={20}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all uppercase"
          />
          <button
            onClick={applyCoupon} disabled={couponLoading || !code.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
          </button>
        </div>
        {couponError && (
          <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {couponError}
          </p>
        )}
        {couponPct > 0 && (
          <p className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {couponPct}% discount applied — you save ${Math.round(course.price * couponPct / 100)} extra!
          </p>
        )}
      </div>

      {/* What's included */}
      <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
        <p className="text-xs font-bold text-indigo-800 mb-2">This enrollment includes:</p>
        <div className="grid grid-cols-2 gap-y-1.5">
          {[
            "Lifetime course access", "Mobile & desktop", "All future updates",
            ...(course.hasCert ? ["Certificate of completion"] : []),
            ...(course.hasAI ? ["Unlimited AI feedback"] : []),
            "Community forum access",
          ].map((f) => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-indigo-700">
              <CheckCircle2 className="w-3 h-3 text-indigo-500 flex-shrink-0" /> {f}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full mt-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all hover:scale-[1.01] shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
      >
        Continue to Payment <ArrowRight className="w-4 h-4" />
      </button>

      <TrustStrip />
    </div>
  );
}

/* ─── STEP 3: PAYMENT ────────────────────────────────────────────── */
const PAY_METHODS: { id: PayMethod; label: string; logo: string; desc: string }[] = [
  { id: "card", label: "Credit / Debit Card", logo: "💳", desc: "Visa, Mastercard, Amex — powered by Stripe" },
  { id: "paypal", label: "PayPal", logo: "🅿", desc: "Pay with your PayPal balance or card" },
  { id: "jazzcash", label: "JazzCash", logo: "📱", desc: "Mobile wallet — Pakistan" },
  { id: "easypaisa", label: "Easypaisa", logo: "🟢", desc: "Mobile wallet — Pakistan" },
  { id: "bank", label: "Bank Transfer", logo: "🏦", desc: "Direct bank transfer — 1–3 business days" },
];

function PaymentStep({
  course, finalPrice, onSuccess, onError,
}: {
  course: typeof COURSES["1"]; finalPrice: number;
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [method, setMethod] = useState<PayMethod>("card");
  const [loading, setLoading] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");

  function formatCard(v: string) {
    return v.replace(/\D/g, "").substring(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").substring(0, 4);
    return d.length >= 3 ? d.substring(0, 2) + "/" + d.substring(2) : d;
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2200));
    setLoading(false);
    // Simulate 90% success rate for demo
    if (Math.random() > 0.1) {
      onSuccess();
    } else {
      onError("Your card was declined. Please check your card details or try a different payment method.");
    }
  }

  const cardBrand = cardNum.startsWith("4") ? "Visa" : cardNum.startsWith("5") ? "Mastercard" : cardNum.startsWith("3") ? "Amex" : "";

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-1">Secure payment</h2>
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mb-5">
        <Lock className="w-3.5 h-3.5" /> 256-bit SSL encrypted · PCI DSS compliant
      </div>

      {/* Payment method selector */}
      <div className="grid grid-cols-1 gap-2 mb-5">
        {PAY_METHODS.map((m) => (
          <label
            key={m.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
              method === m.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300 bg-white"
            )}
          >
            <input type="radio" name="payMethod" value={m.id} checked={method === m.id}
              onChange={() => setMethod(m.id)} className="sr-only" />
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all",
              method === m.id ? "bg-indigo-100" : "bg-slate-100")}>
              {m.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{m.label}</p>
              <p className="text-xs text-slate-400">{m.desc}</p>
            </div>
            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
              method === m.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300")}>
              {method === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </label>
        ))}
      </div>

      {/* Payment form by method */}
      <form onSubmit={handlePay}>
        {method === "card" && (
          <div className="space-y-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name on card</label>
              <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)}
                placeholder="As it appears on your card" required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Card number
                {cardBrand && <span className="ml-2 text-indigo-600 font-bold">{cardBrand}</span>}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={cardNum} onChange={(e) => setCardNum(formatCard(e.target.value))}
                  placeholder="1234 5678 9012 3456" maxLength={19} required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all bg-white" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expiry</label>
                <input type="text" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY" maxLength={5} required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all bg-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">CVC</label>
                <div className="relative">
                  <input type="text" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g,"").substring(0,4))}
                    placeholder="123" maxLength={4} required
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all bg-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {method === "paypal" && (
          <div className="mb-5 p-5 rounded-xl bg-blue-50 border border-blue-100 text-center">
            <div className="text-3xl mb-2">🅿️</div>
            <p className="text-sm font-semibold text-slate-700 mb-1">You'll be redirected to PayPal</p>
            <p className="text-xs text-slate-500">Complete your payment securely on PayPal's site, then return here automatically.</p>
          </div>
        )}

        {(method === "jazzcash" || method === "easypaisa") && (
          <div className="space-y-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {method === "jazzcash" ? "JazzCash" : "Easypaisa"} Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, "").substring(0, 11))}
                  placeholder="03XXXXXXXXX" maxLength={11} required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all bg-white" />
              </div>
            </div>
            <p className="text-xs text-slate-400">You'll receive a PIN confirmation on your registered mobile number.</p>
          </div>
        )}

        {method === "bank" && (
          <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Bank Transfer Details</p>
            <div className="space-y-2 text-xs">
              {[
                ["Bank", "HBL — Habib Bank Limited"],
                ["Account Title", "OneSoft IELTS Pvt. Ltd."],
                ["Account No.", "0123-4567890-103"],
                ["IBAN", "PK36HABB0000000123456789"],
                ["Reference", `ORDER-${Date.now().toString().slice(-6)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-800 text-right">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600 font-semibold mt-3 bg-amber-50 rounded-lg p-2.5 border border-amber-100">
              ⏱ Access is granted within 24h after payment confirmation. Upload your transaction slip below after transfer.
            </p>
          </div>
        )}

        {/* Order total summary */}
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-indigo-50 border border-indigo-100 mb-4 text-sm">
          <span className="text-slate-600">Total due today</span>
          <span className="text-2xl font-extrabold text-indigo-700">${finalPrice}</span>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:scale-[1.01]"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing payment…</>
          ) : (
            <><Lock className="w-4 h-4" /> Pay ${finalPrice} Securely</>
          )}
        </button>

        <TrustStrip />
      </form>
    </div>
  );
}

/* ─── PAYMENT ERROR ──────────────────────────────────────────────── */
function PaymentError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
        <X className="w-7 h-7 text-rose-600" />
      </div>
      <h3 className="font-extrabold text-slate-900 text-lg mb-2">Payment Failed</h3>
      <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">{message}</p>
      <div className="space-y-2.5">
        <button
          onClick={onRetry}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
        >
          Try Again
        </button>
        <p className="text-xs text-slate-400">
          Need help? <a href="#" className="text-indigo-600 font-semibold hover:underline">Contact support</a>
        </p>
      </div>
      <div className="mt-6 text-left bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Common reasons for payment failure:</p>
        <ul className="space-y-1.5">
          {[
            "Insufficient funds or credit limit reached",
            "Incorrect card number, expiry, or CVC",
            "Card blocked for international transactions",
            "Bank's fraud prevention temporarily blocked the charge",
          ].map((r) => (
            <li key={r} className="flex items-start gap-2 text-xs text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── STEP 4: SUCCESS ────────────────────────────────────────────── */
function SuccessStep({ course, userEmail, userName }: {
  course: typeof COURSES["1"]; userEmail: string; userName: string;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 80);
    return () => clearInterval(t);
  }, []);

  const orderId = `ONS-${Date.now().toString().slice(-8).toUpperCase()}`;

  return (
    <div className="text-center">
      {/* Animated success circle */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e0e7ff" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            stroke="#4f46e5" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${Math.min(tick * 8, 276.5)} 276.5`}
            style={{ transition: "stroke-dasharray 0.05s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center transition-all duration-500",
            tick >= 35 ? "scale-100 opacity-100" : "scale-0 opacity-0")}>
            <Check className="w-7 h-7 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      <div className={cn("transition-all duration-700", tick >= 35 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Enrollment Successful!
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          Welcome, {userName.split(" ")[0]}! 🎉
        </h2>
        <p className="text-slate-500 text-sm mb-2 max-w-xs mx-auto">
          You're now enrolled in <strong className="text-slate-700">{course.title}</strong>
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Confirmation sent to <span className="font-semibold text-indigo-600">{userEmail}</span>
        </p>

        {/* Order details */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-5 text-left">
          <div className="flex gap-3 mb-3">
            <img src={course.image} alt={course.title} className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 line-clamp-2">{course.title}</p>
              <p className="text-[11px] text-slate-400">By {course.instructor}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <p className="text-slate-400 mb-0.5">Order ID</p>
              <p className="font-mono font-bold text-slate-700 text-[11px]">{orderId}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <p className="text-slate-400 mb-0.5">Access</p>
              <p className="font-bold text-emerald-600">Lifetime</p>
            </div>
          </div>
        </div>

        {/* Email confirmation notice */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 mb-5 text-left">
          <p className="text-xs font-semibold text-indigo-800 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> What happens next
          </p>
          <ul className="space-y-1.5 text-xs text-indigo-700">
            {[
              "Purchase confirmation email sent to your inbox",
              "Welcome onboarding email with study schedule",
              "Weekly progress reminders start Day 1",
            ].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-indigo-400 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <a
          href="/lms/"
          className="block w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all hover:scale-[1.01] shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mb-3"
        >
          <Play className="w-4 h-4 fill-white" /> Start Learning Now
        </a>
        <Link href="/courses" className="block text-sm text-slate-500 hover:text-indigo-600 transition-colors">
          Browse more courses →
        </Link>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function CheckoutPage() {
  // Parse course from URL
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const courseId = params.get("course") || "default";
  const course = COURSES[courseId] || COURSES["default"];

  const [step, setStep] = useState<Step>("auth");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponPct, setCouponPct] = useState(0);
  const [payError, setPayError] = useState("");

  const finalPrice = Math.round(course.price * (1 - couponPct / 100));

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">

          {/* Back link + heading */}
          {step !== "success" && (
            <div className="flex items-center gap-3 mb-8">
              <Link href={`/courses/${courseId}`}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900">Secure Checkout</h1>
                <p className="text-xs text-slate-400">Complete your enrollment in seconds</p>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* ── LEFT: CHECKOUT FORM ── */}
            <div ref={containerRef} className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
                {step !== "success" && <StepBar current={step} />}

                {step === "auth" && (
                  <AuthStep onNext={(email, name) => {
                    setUserEmail(email); setUserName(name); setStep("order");
                  }} />
                )}

                {step === "order" && (
                  <OrderStep
                    course={course} userEmail={userEmail} userName={userName}
                    couponPct={couponPct} couponCode={couponCode} finalPrice={finalPrice}
                    onCouponApply={(code, pct) => { setCouponCode(code); setCouponPct(pct); }}
                    onNext={() => setStep("payment")}
                  />
                )}

                {step === "payment" && payError ? (
                  <PaymentError message={payError} onRetry={() => setPayError("")} />
                ) : step === "payment" ? (
                  <PaymentStep
                    course={course} finalPrice={finalPrice}
                    onSuccess={() => setStep("success")}
                    onError={(msg) => setPayError(msg)}
                  />
                ) : null}

                {step === "success" && (
                  <SuccessStep course={course} userEmail={userEmail} userName={userName} />
                )}
              </div>
            </div>

            {/* ── RIGHT: ORDER SUMMARY SIDEBAR ── */}
            {step !== "success" && (
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
                  <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Order Summary
                  </h3>
                  <CourseSummary course={course} price={finalPrice} couponPct={couponPct} />

                  {/* Guarantee */}
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800">30-Day Guarantee</p>
                        <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                          Not satisfied? Get a full refund within 30 days, no questions asked.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Social proof */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <Users className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span><strong className="text-slate-800">{course.students.toLocaleString()}</strong> students already enrolled</span>
                  </div>

                  {/* Payment logos */}
                  <div className="mt-4">
                    <p className="text-[10px] text-slate-400 text-center mb-2">Accepted payment methods</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {["VISA", "MC", "AMEX", "PayPal", "JazzCash", "Easypaisa"].map((p) => (
                        <span key={p} className="px-2 py-1 rounded border border-slate-200 text-[9px] font-bold text-slate-500 bg-slate-50">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
