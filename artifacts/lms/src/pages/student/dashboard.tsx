import React from "react";
import { useStudent } from "@/context/student-context";
import {
  useGetStudentEnrollments,
  useGetStudentNotifications,
  useGetStudentAssignments,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  BookOpen, Bell, FileText, ArrowRight, Clock, CheckCircle,
  TrendingUp, Target, Award, Zap, Sparkles, Users, GraduationCap,
  ClipboardList, BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, Legend,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ── Colour palette for bars ───────────────────────────────────────────────────
const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

export default function StudentDashboard() {
  const { student } = useStudent();
  const email = student?.email ?? "";

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
  const unreadNotifs = notifications?.filter((n) => !n.isRead).slice(0, 5) ?? [];
  const pendingAssignments = assignments?.filter((a) => !a.submission && new Date(a.dueDate) > new Date()) ?? [];
  const upcomingDeadlines = pendingAssignments
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const avgProgress = activeEnrollments.length
    ? Math.round(activeEnrollments.reduce((s, e) => s + e.progressPercent, 0) / activeEnrollments.length)
    : 0;

  // Chart data: per-course progress
  const progressChartData = (enrollments ?? [])
    .filter((e) => e.status !== "dropped")
    .map((e) => ({
      name: e.courseTitle.length > 14 ? e.courseTitle.slice(0, 14) + "…" : e.courseTitle,
      progress: e.progressPercent,
      completed: e.completedLessons,
      total: e.totalLessons,
    }));

  // Radial chart data for overall stats
  const radialData = [
    { name: "Progress", value: avgProgress, fill: "#6366f1" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">

      {/* ── Hero welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-indigo-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10">
          <p className="text-primary-foreground/80 text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            {student?.displayName?.split(" ")[0] ?? "Learner"} 👋
          </h1>
          <p className="text-primary-foreground/80 mt-1.5 text-sm sm:text-base max-w-md">
            {activeEnrollments.length > 0
              ? `You have ${activeEnrollments.length} active course${activeEnrollments.length !== 1 ? "s" : ""} — keep the momentum going!`
              : "Start your learning journey today. Enroll in your first course!"}
          </p>
          <Link href="/student/courses">
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 gap-2 bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              Go to My Courses <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-10 w-52 h-52 rounded-full bg-white/5" />
        <div className="absolute right-16 top-4 w-8 h-8 rounded-full bg-white/10" />
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Active Courses"
          value={activeEnrollments.length}
          sub={`${completedEnrollments.length} completed`}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Progress"
          value={`${avgProgress}%`}
          sub="across active courses"
          color="text-violet-600"
          bg="bg-violet-50 dark:bg-violet-950/40"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="Assignments Due"
          value={pendingAssignments.length}
          sub="pending submission"
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-950/40"
          urgent={pendingAssignments.length > 0}
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Completed"
          value={completedEnrollments.length}
          sub={`${enrollments?.length ?? 0} total courses`}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-950/40"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2/3: chart + promo cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* Progress chart */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Course Progress
              </CardTitle>
              <Link href="/student/courses">
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-2">
                  View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {enrollLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : progressChartData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <BarChart2 className="w-10 h-10 opacity-30" />
                  <p className="text-sm">No courses enrolled yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={progressChartData} barCategoryGap="35%">
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                      width={36}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-popover border rounded-lg shadow-md px-3 py-2 text-sm">
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-muted-foreground">{d.completed}/{d.total} lessons · {d.progress}%</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={52}>
                      {progressChartData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Promo / marketing cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PromoCard
              icon={<Sparkles className="w-5 h-5" />}
              iconBg="bg-yellow-400/10 text-yellow-500"
              title="Explore New Courses"
              body="Discover IELTS modules tailored to your goals — Reading, Writing, Listening, and Speaking."
              action="Browse Courses"
              href="/student/courses"
              gradient="from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
            />
            <PromoCard
              icon={<Target className="w-5 h-5" />}
              iconBg="bg-green-400/10 text-green-500"
              title="Track Your Score"
              body="Review your quiz results and assignment grades to identify where to improve your band score."
              action="View Grades"
              href="/student/assignments"
              gradient="from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
            />
            <PromoCard
              icon={<Zap className="w-5 h-5" />}
              iconBg="bg-violet-400/10 text-violet-500"
              title="Practice Makes Perfect"
              body="Take timed quizzes to simulate real IELTS exam conditions and boost your confidence."
              action="Take a Quiz"
              href="/student/quizzes"
              gradient="from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20"
            />
            <PromoCard
              icon={<GraduationCap className="w-5 h-5" />}
              iconBg="bg-blue-400/10 text-blue-500"
              title="Complete Your Profile"
              body="Add your city, qualification and goals so instructors can better tailor your learning path."
              action="Update Profile"
              href="/student/profile"
              gradient="from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20"
            />
          </div>
        </div>

        {/* Right 1/3: Activity feed */}
        <div className="space-y-5">

          {/* Overall progress radial */}
          {activeEnrollments.length > 0 && (
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle
                        cx="40" cy="40" r="32" fill="none"
                        stroke="hsl(var(--primary))" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - avgProgress / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                      {avgProgress}%
                    </span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Active</span>
                      <span className="font-semibold text-blue-600">{activeEnrollments.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-semibold text-green-600">{completedEnrollments.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Pending tasks</span>
                      <span className={cn("font-semibold", pendingAssignments.length > 0 ? "text-amber-600" : "text-muted-foreground")}>
                        {pendingAssignments.length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity & Notifications */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Activity & Notifications
                </span>
                <Link href="/student/notifications">
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-2">All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0 flex-1">
              {upcomingDeadlines.length === 0 && unreadNotifs.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground">No pending deadlines or notifications</p>
                </div>
              ) : (
                <>
                  {upcomingDeadlines.map((assignment) => {
                    const due = new Date(assignment.dueDate);
                    const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
                    const isUrgent = daysLeft <= 3;
                    return (
                      <div
                        key={`dl-${assignment.id}`}
                        className={cn(
                          "flex gap-3 items-start rounded-lg p-2.5 transition-colors",
                          isUrgent ? "bg-destructive/5" : "hover:bg-muted/50"
                        )}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isUrgent ? "bg-destructive/10" : "bg-muted"}`}>
                          <Clock className={`w-4 h-4 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm leading-tight truncate">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{assignment.courseTitle}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                              isUrgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                            )}>
                              {daysLeft <= 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {upcomingDeadlines.length > 0 && unreadNotifs.length > 0 && (
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center px-2.5">
                        <div className="w-full border-t border-dashed" />
                      </div>
                    </div>
                  )}

                  {unreadNotifs.map((n) => (
                    <div
                      key={`n-${n.id}`}
                      className="flex gap-3 items-start rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm leading-tight">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
          {urgent && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Due</Badge>
          )}
        </div>
        <p className="text-2xl font-bold mt-3 leading-none">{value}</p>
        <p className="text-sm font-medium mt-0.5">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function PromoCard({
  icon, iconBg, title, body, action, href, gradient,
}: {
  icon: React.ReactNode; iconBg: string; title: string; body: string;
  action: string; href: string; gradient: string;
}) {
  return (
    <Card className={cn("border-0 bg-gradient-to-br hover:shadow-md transition-shadow", gradient)}>
      <CardContent className="p-4 flex flex-col h-full gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
        </div>
        <Link href={href}>
          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 gap-1 -ml-2 hover:bg-black/5">
            {action} <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
