import React from "react";
import { useStudent } from "@/context/student-context";
import { useGamification } from "@/context/gamification-context";
import {
  useGetStudentEnrollments,
  useGetStudentNotifications,
  useGetStudentAssignments,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BookOpen, Bell, FileText, ArrowRight, Clock, CheckCircle,
  TrendingUp, Target, Award, Zap, Sparkles, GraduationCap,
  ClipboardList, BarChart2, Flame, Star, Trophy, ChevronRight,
  Headphones, BookText, PenLine, Mic, Layers, Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const BAR_COLORS = ["#4f46e5", "#7c3aed", "#9333ea", "#a855f7", "#c084fc"];

const QUICK_ACTIONS = [
  { href: "/student/listening", label: "Listening", icon: Headphones, color: "bg-sky-100 dark:bg-sky-950/40 text-sky-600", desc: "Section 1–4" },
  { href: "/student/reading", label: "Reading", icon: BookText, color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600", desc: "3 passages" },
  { href: "/student/writing", label: "Writing", icon: PenLine, color: "bg-amber-100 dark:bg-amber-950/40 text-amber-600", desc: "AI feedback" },
  { href: "/student/speaking", label: "Speaking", icon: Mic, color: "bg-rose-100 dark:bg-rose-950/40 text-rose-600", desc: "AI analysis" },
  { href: "/student/vocabulary", label: "Vocabulary", icon: Layers, color: "bg-violet-100 dark:bg-violet-950/40 text-violet-600", desc: "Flashcards" },
  { href: "/student/mock-tests", label: "Mock Test", icon: Timer, color: "bg-orange-100 dark:bg-orange-950/40 text-orange-600", desc: "Full IELTS" },
];

const RECOMMENDATIONS = [
  { icon: "✍️", title: "Practice Writing Task 2", href: "/student/writing", reason: "You scored below 6.0 last session", urgency: "high" },
  { icon: "📚", title: "Learn 10 new vocabulary words", href: "/student/vocabulary", reason: "Vocabulary is your weakest area", urgency: "medium" },
  { icon: "🎙️", title: "Complete Speaking Part 2", href: "/student/speaking", reason: "No speaking session this week", urgency: "low" },
];

export default function StudentDashboard() {
  const { student } = useStudent();
  const {
    xp, level, xpToNextLevel, streak, longestStreak,
    targetBand, currentBand, badges, leaderboard,
    dailyGoalMinutes, todayMinutes, weeklyXP,
  } = useGamification();

  const email = student?.email ?? "";

  const { data: placementResult } = useQuery({
    queryKey: ["placement-my-result", email],
    queryFn: async () => {
      if (!email) return null;
      const r = await fetch(`/api/placement/my-result?email=${encodeURIComponent(email)}`, { credentials: "include" });
      if (!r.ok) return null;
      return r.json() as Promise<{ score: number; level: string; recommendedCourseTitle: string | null; assignedCourseTitle: string | null; assignedCourseId: number | null } | null>;
    },
    enabled: !!email,
    staleTime: 1000 * 60 * 2,
  });

  const { data: enrollments, isLoading: enrollLoading } = useGetStudentEnrollments(
    { email }, { query: { enabled: !!email } }
  );
  const { data: notifications } = useGetStudentNotifications(
    { email }, { query: { enabled: !!email } }
  );
  const { data: assignments } = useGetStudentAssignments(
    { email }, { query: { enabled: !!email } }
  );

  const activeEnrollments = enrollments?.filter((e) => e.status === "active") ?? [];
  const completedEnrollments = enrollments?.filter((e) => e.status === "completed") ?? [];
  const unreadNotifs = notifications?.filter((n) => !n.isRead).slice(0, 3) ?? [];
  const pendingAssignments = assignments?.filter((a) => !a.submission && new Date(a.dueDate) > new Date()) ?? [];
  const upcomingDeadlines = pendingAssignments
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const avgProgress = activeEnrollments.length
    ? Math.round(activeEnrollments.reduce((s, e) => s + e.progressPercent, 0) / activeEnrollments.length)
    : 0;

  const progressChartData = (enrollments ?? [])
    .filter((e) => e.status !== "dropped")
    .map((e) => ({
      name: e.courseTitle.length > 14 ? e.courseTitle.slice(0, 14) + "…" : e.courseTitle,
      progress: e.progressPercent,
      completed: e.completedLessons,
      total: e.totalLessons,
    }));

  const weeklyChartData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
    day: d, xp: weeklyXP[i] ?? 0,
  }));

  const earnedBadges = badges.filter((b) => b.earned).slice(0, 6);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const xpProgress = 500 - xpToNextLevel;
  const dailyProgress = Math.min(100, (todayMinutes / dailyGoalMinutes) * 100);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">

      {/* ── Hero banner with streak + XP ── */}
      <div className="relative overflow-hidden rounded-2xl text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #0d1b60 0%, #1e1b4b 60%, #0d1b60 100%)" }}>
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm font-medium">{greeting},</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-0.5">
                {student?.displayName?.split(" ")[0] ?? "Learner"} 👋
              </h1>
              <p className="text-white/70 mt-1.5 text-sm max-w-md">
                {currentBand < targetBand
                  ? `You're at Band ${currentBand} — ${(targetBand - currentBand).toFixed(1)} more to reach your target of ${targetBand}!`
                  : `You've reached your target Band ${targetBand}! Keep it up!`}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link href="/student/mock-tests">
                  <Button size="sm" className="bg-[#CC0000] hover:bg-red-700 gap-1.5 shadow">
                    <Timer className="w-3.5 h-3.5" /> Take Mock Test
                  </Button>
                </Link>
                <Link href="/student/analytics">
                  <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" /> View Analytics
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Gamification stats */}
            <div className="flex gap-3 sm:gap-4">
              {/* Streak */}
              <div className="text-center px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Flame className="w-6 h-6 text-orange-300 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-orange-200">{streak}</p>
                <p className="text-[11px] text-white/60">Day streak</p>
              </div>
              {/* XP + Level */}
              <div className="text-center px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Zap className="w-6 h-6 text-yellow-300 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-yellow-200">{xp.toLocaleString()}</p>
                <p className="text-[11px] text-white/60">XP · Level {level}</p>
              </div>
              {/* Band */}
              <div className="text-center px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Star className="w-6 h-6 text-indigo-300 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-indigo-200">{currentBand}</p>
                <p className="text-[11px] text-white/60">Band score</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-12 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute right-20 top-6 w-10 h-10 rounded-full bg-white/8" />
      </div>

      {/* ── Placement Status Card ── */}
      {placementResult === null ? (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Take your course allocation assessment</p>
              <p className="text-sm text-slate-500 mt-0.5">20 quick questions to determine your English level and get a course recommendation</p>
            </div>
          </div>
          <Link href="/student/placement-test">
            <Button size="sm" className="shrink-0">Start Test <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button>
          </Link>
        </div>
      ) : placementResult && placementResult.assignedCourseTitle ? (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Your course has been assigned</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Assessment: <span className="font-medium text-slate-700 dark:text-slate-300">{placementResult.score}/100 · {placementResult.level}</span>
                {" · "}Course: <span className="font-medium text-emerald-700 dark:text-emerald-400">{placementResult.assignedCourseTitle}</span>
              </p>
            </div>
          </div>
          <Link href="/student/courses">
            <Button size="sm" variant="outline" className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              Go to Course <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      ) : placementResult ? (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Assessment complete — awaiting course allocation</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Your score: <span className="font-medium text-slate-700 dark:text-slate-300">{placementResult.score}/100 · Level {placementResult.level}</span>
                {placementResult.recommendedCourseTitle && <> · Recommended: <span className="font-medium text-blue-600">{placementResult.recommendedCourseTitle}</span></>}
              </p>
            </div>
          </div>
          <Link href="/student/placement-test">
            <Button size="sm" variant="outline" className="shrink-0 text-xs border-amber-300 text-amber-700 hover:bg-amber-50">View Result</Button>
          </Link>
        </div>
      ) : null}

      {/* ── Daily goal + XP level bar ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Daily goal */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Daily Goal</p>
                  <p className="text-xs text-muted-foreground">{todayMinutes} / {dailyGoalMinutes} minutes</p>
                </div>
              </div>
              <span className={cn("text-sm font-extrabold", dailyProgress >= 100 ? "text-emerald-600" : "text-orange-500")}>{Math.round(dailyProgress)}%</span>
            </div>
            <Progress value={dailyProgress} className="h-2.5" />
            {dailyProgress >= 100 && <p className="text-xs text-emerald-600 font-semibold mt-1.5">✓ Goal achieved today!</p>}
          </CardContent>
        </Card>

        {/* XP progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Level {level}</p>
                  <p className="text-xs text-muted-foreground">{xpProgress} / 500 XP to Level {level + 1}</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-yellow-600">{xp.toLocaleString()} XP</span>
            </div>
            <Progress value={(xpProgress / 500) * 100} className="h-2.5" />
          </CardContent>
        </Card>
      </div>

      {/* ── Quick action modules ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">IELTS Modules</h2>
          <Link href="/student/analytics">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
              Analytics <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, desc }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer text-center group">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold leading-tight">{label}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Active Courses" value={activeEnrollments.length}
          sub={`${completedEnrollments.length} completed`} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/40" />
        <StatCard icon={<Target className="w-5 h-5" />} label="Band Score" value={currentBand}
          sub={`Target: ${targetBand}`} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/40" />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Tasks Due" value={pendingAssignments.length}
          sub="pending submission" color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/40" urgent={pendingAssignments.length > 0} />
        <StatCard icon={<Award className="w-5 h-5" />} label="Badges Earned" value={earnedBadges.length}
          sub={`${badges.length - earnedBadges.length} to unlock`} color="text-green-600" bg="bg-green-50 dark:bg-green-950/40" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Band score progress */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Band Score Progress
                </CardTitle>
                <Link href="/student/analytics">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                    Full report <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Listening", score: 7.0, color: "bg-sky-500" },
                  { label: "Reading", score: 6.5, color: "bg-emerald-500" },
                  { label: "Writing", score: 6.0, color: "bg-amber-500" },
                  { label: "Speaking", score: 6.5, color: "bg-rose-500" },
                ].map((m) => (
                  <div key={m.label} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className="text-2xl font-extrabold">{m.score}</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div style={{ width: `${(m.score / 9) * 100}%` }} className={cn("h-full rounded-full", m.color)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#4f46e5" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - currentBand / targetBand)}`}
                      strokeLinecap="round" className="transition-all duration-700" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{currentBand}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Overall Band: {currentBand}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {(targetBand - currentBand).toFixed(1)} band points to reach your target of {targetBand}
                  </p>
                  <Progress value={(currentBand / targetBand) * 100} className="h-2 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course progress */}
          {progressChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> Course Progress
                </CardTitle>
                <Link href="/student/courses">
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2">
                    View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {enrollLoading ? <Skeleton className="h-40 w-full" /> : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={progressChartData} barCategoryGap="35%">
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={32} />
                      <Tooltip cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover border rounded-lg shadow-md px-3 py-2 text-sm">
                              <p className="font-semibold">{d.name}</p>
                              <p className="text-muted-foreground">{d.completed}/{d.total} lessons · {d.progress}%</p>
                            </div>
                          );
                        }} />
                      <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={44}>
                        {progressChartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {RECOMMENDATIONS.map((rec, i) => (
                <Link key={i} href={rec.href}>
                  <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer",
                    rec.urgency === "high" ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900"
                      : rec.urgency === "medium" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800")}>
                    <span className="text-2xl">{rec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] flex-shrink-0",
                      rec.urgency === "high" ? "border-rose-300 text-rose-600" : rec.urgency === "medium" ? "border-amber-300 text-amber-600" : "border-slate-200")}>
                      {rec.urgency}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-5">

          {/* Weekly XP chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Weekly XP Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={weeklyChartData} barCategoryGap="30%">
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Bar dataKey="xp" radius={[4, 4, 0, 0]} maxBarSize={28} fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-muted-foreground mt-1">{weeklyXP.reduce((a, b) => a + b, 0).toLocaleString()} XP this week</p>
            </CardContent>
          </Card>

          {/* Streak + badges */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-bold">{streak}-Day Streak!</p>
                    <p className="text-xs text-muted-foreground">Best: {longestStreak} days</p>
                  </div>
                </div>
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Recent Badges</p>
                <div className="grid grid-cols-3 gap-2">
                  {earnedBadges.map((badge) => (
                    <div key={badge.id} title={badge.description}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center cursor-help">
                      <span className="text-xl">{badge.icon}</span>
                      <p className="text-[10px] font-semibold leading-tight line-clamp-2">{badge.name}</p>
                    </div>
                  ))}
                </div>
                <Link href="/student/analytics">
                  <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs gap-1">
                    View all badges <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" /> Class Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {leaderboard.slice(0, 5).map((entry) => (
                <div key={entry.rank}
                  className={cn("flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors",
                    entry.isMe ? "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800" : "hover:bg-slate-50 dark:hover:bg-slate-900")}>
                  <span className={cn("w-5 text-center text-xs font-extrabold",
                    entry.rank === 1 ? "text-amber-500" : entry.rank === 2 ? "text-slate-400" : entry.rank === 3 ? "text-amber-700" : "text-muted-foreground")}>
                    {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0">
                    {entry.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold truncate", entry.isMe && "text-indigo-700 dark:text-indigo-300")}>
                      {entry.name} {entry.isMe && <span className="text-[10px] text-indigo-500">(you)</span>}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-yellow-400" />{entry.xp.toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity & Notifications */}
          {(upcomingDeadlines.length > 0 || unreadNotifs.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Bell className="w-4 h-4 text-primary" /> Upcoming</span>
                  <Link href="/student/notifications">
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-2">All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {upcomingDeadlines.map((assignment) => {
                  const due = new Date(assignment.dueDate);
                  const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
                  const isUrgent = daysLeft <= 3;
                  return (
                    <div key={`dl-${assignment.id}`}
                      className={cn("flex gap-2.5 items-start rounded-xl p-2.5 transition-colors",
                        isUrgent ? "bg-destructive/5" : "hover:bg-muted/50")}>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", isUrgent ? "bg-destructive/10" : "bg-muted")}>
                        <Clock className={cn("w-3.5 h-3.5", isUrgent ? "text-destructive" : "text-muted-foreground")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs leading-tight truncate">{assignment.title}</p>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block",
                          isUrgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                          {daysLeft <= 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {unreadNotifs.map((n) => (
                  <div key={`n-${n.id}`} className="flex gap-2.5 items-start rounded-xl p-2.5 hover:bg-muted/50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs leading-tight">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, color, bg, urgent,
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub: string; color: string; bg: string; urgent?: boolean;
}) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", urgent && "border-amber-400/50")}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
            <span className={color}>{icon}</span>
          </div>
          {urgent && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Due</Badge>}
        </div>
        <p className="text-2xl font-bold mt-3 leading-none">{value}</p>
        <p className="text-sm font-medium mt-0.5">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
