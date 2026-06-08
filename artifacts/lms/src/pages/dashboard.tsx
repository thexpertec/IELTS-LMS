import {
  useGetDashboardStats,
  useGetRecentActivity,
  useGetCourseStats,
  useGetDashboardEnrollmentTrend,
  useGetDashboardQuizAnalytics,
  useGetDashboardTopCourses,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, BookOpen, GraduationCap, CheckCircle, UserPlus,
  TrendingUp, ClipboardList, Award, BarChart2, Plus, Users,
  FileQuestion, BookCheck, ArrowRight, Layers, Target, Zap,
  Bell, PenLine, ClipboardCheck, UserCheck, BookMarked, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface ActionItems {
  ungradedAssignments: number;
  ungradedQuizzes: number;
  newEnrollmentsThisWeek: number;
  draftCourses: number;
  overdueAssignments: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 8 });
  const { data: actionItems, isLoading: actionLoading } = useQuery({
    queryKey: ["dashboard-action-items"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/action-items", { credentials: "include" });
      if (!res.ok) return null;
      return res.json() as Promise<ActionItems>;
    },
    refetchInterval: 60_000,
  });
  const { data: courseStats, isLoading: courseStatsLoading } = useGetCourseStats();
  const { data: trend, isLoading: trendLoading } = useGetDashboardEnrollmentTrend();
  const { data: quizAnalytics, isLoading: quizLoading } = useGetDashboardQuizAnalytics();
  const { data: topCourses, isLoading: topCoursesLoading } = useGetDashboardTopCourses();

  const categoryData = courseStats
    ? Object.entries(
        courseStats.reduce((acc, c) => {
          acc[c.category] = (acc[c.category] ?? 0) + c.enrollmentCount;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name, value }))
    : [];

  const quickActions = [
    { label: "New Course", icon: Plus, color: "bg-primary text-primary-foreground", path: "/courses/new" },
    { label: "Students", icon: Users, color: "bg-violet-500 text-white", path: "/students" },
    { label: "IELTS Practice", icon: FileQuestion, color: "bg-amber-500 text-white", path: "/quizzes" },
    { label: "Assignments", icon: BookCheck, color: "bg-emerald-500 text-white", path: "/assignments" },
    { label: "Enrollments", icon: Layers, color: "bg-rose-500 text-white", path: "/enrollments" },
    { label: "Analytics", icon: BarChart2, color: "bg-indigo-500 text-white", path: "/?section=analytics" },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-[1400px]">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-indigo-600 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-primary-foreground/70 text-sm font-medium mb-1">Admin Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Learning Platform</h1>
            <p className="text-primary-foreground/75 mt-2 text-sm sm:text-base">
              {statsLoading
                ? "Loading overview…"
                : `${stats?.totalStudents ?? 0} students across ${stats?.totalCourses ?? 0} courses — ${stats?.completionRate ?? 0}% completion rate`}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
              onClick={() => setLocation("/courses/new")}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Course
            </Button>
            <Button
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
              onClick={() => setLocation("/students")}
            >
              <Users className="w-4 h-4 mr-2" />
              Students
            </Button>
          </div>
        </div>
      </div>

      {/* ── Notifications / Action Items ── */}
      <ActionItemsBanner items={actionItems ?? null} loading={actionLoading} onNavigate={setLocation} />

      {/* ── KPI Row 1 ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Courses"
          value={stats?.totalCourses}
          sub={`${stats?.publishedCourses ?? 0} published`}
          icon={BookOpen}
          iconColor="bg-blue-500/10 text-blue-600"
          loading={statsLoading}
          testId="stat-total-courses"
        />
        <KpiCard
          title="Total Students"
          value={stats?.totalStudents}
          sub="Unique learners"
          icon={GraduationCap}
          iconColor="bg-violet-500/10 text-violet-600"
          loading={statsLoading}
          testId="stat-total-students"
        />
        <KpiCard
          title="Active Enrollments"
          value={stats?.activeEnrollments}
          sub={`of ${stats?.totalEnrollments ?? 0} total`}
          icon={Activity}
          iconColor="bg-emerald-500/10 text-emerald-600"
          loading={statsLoading}
          testId="stat-active-enrollments"
        />
        <KpiCard
          title="Completion Rate"
          value={stats?.completionRate != null ? `${Math.round(stats.completionRate)}%` : undefined}
          sub={`${stats?.completedEnrollments ?? 0} completed`}
          icon={CheckCircle}
          iconColor="bg-amber-500/10 text-amber-600"
          loading={statsLoading}
          testId="stat-completion-rate"
        />
      </div>

      {/* ── KPI Row 2 — Quiz Analytics ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total IELTS Practice"
          value={quizAnalytics?.totalQuizzes}
          sub="Created on platform"
          icon={FileQuestion}
          iconColor="bg-rose-500/10 text-rose-600"
          loading={quizLoading}
        />
        <KpiCard
          title="Quiz Attempts"
          value={quizAnalytics?.totalAttempts}
          sub="All submissions"
          icon={ClipboardList}
          iconColor="bg-indigo-500/10 text-indigo-600"
          loading={quizLoading}
        />
        <KpiCard
          title="Avg Quiz Score"
          value={quizAnalytics?.avgScore != null ? `${quizAnalytics.avgScore}` : undefined}
          sub="Points average"
          icon={Target}
          iconColor="bg-orange-500/10 text-orange-600"
          loading={quizLoading}
        />
        <KpiCard
          title="Pass Rate"
          value={quizAnalytics?.passRate != null ? `${quizAnalytics.passRate}%` : undefined}
          sub="Score ≥ 60 pts"
          icon={Award}
          iconColor="bg-teal-500/10 text-teal-600"
          loading={quizLoading}
        />
      </div>

      {/* ── Enrollment Trend + Quick Actions ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Enrollment Trend
            </CardTitle>
            <CardDescription>Daily new enrollments over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : trend && trend.length > 0 ? (
              <div className="h-[220px]" data-testid="chart-enrollment-trend">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(v) => {
                        try { return format(parseISO(v), "MMM d"); } catch { return v; }
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                      labelFormatter={(v) => { try { return format(parseISO(String(v)), "MMMM d, yyyy"); } catch { return v; } }}
                    />
                    <Area type="monotone" dataKey="count" name="Enrollments" stroke="hsl(var(--primary))" fill="url(#trendGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No enrollment data in the last 30 days
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Jump to key sections instantly</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, icon: Icon, color, path }) => (
              <button
                key={label}
                onClick={() => setLocation(path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border ring-1 ring-border hover:ring-primary/40 hover:shadow-md transition-all group text-center"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Courses + Category Breakdown ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Top Courses
              </CardTitle>
              <CardDescription>Ranked by enrollment — with completion & progress</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/courses")} className="shrink-0">
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {topCoursesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : topCourses && topCourses.length > 0 ? (
              <div className="space-y-3" data-testid="list-top-courses">
                {topCourses.map((course, idx) => (
                  <div
                    key={course.courseId}
                    className="flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/courses/${course.courseId}`)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      idx === 0 ? "bg-amber-100 text-amber-700" :
                      idx === 1 ? "bg-slate-100 text-slate-600" :
                      idx === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">{course.title}</p>
                        <Badge variant={course.isPublished ? "default" : "secondary"} className="text-xs shrink-0">
                          {course.isPublished ? "Live" : "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={course.avgProgress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground shrink-0">{course.avgProgress}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{course.enrollmentCount}</p>
                      <p className="text-xs text-muted-foreground">{course.completionRate}% done</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">No course data yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-500" />
              By Category
            </CardTitle>
            <CardDescription>Enrollments per category</CardDescription>
          </CardHeader>
          <CardContent>
            {courseStatsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : categoryData.length > 0 ? (
              <div className="h-[220px]" data-testid="chart-category-breakdown">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Course Performance Bar Chart + Activity Feed ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="col-span-4 ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              Course Performance
            </CardTitle>
            <CardDescription>Enrollments vs completions per course</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {courseStatsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]" data-testid="chart-course-stats">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseStats ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis
                      dataKey="title"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(v: string) => v.length > 12 ? `${v.slice(0, 12)}…` : v}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    />
                    <Bar dataKey="enrollmentCount" name="Enrollments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completionCount" name="Completions" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3 ring-1 ring-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest enrollments</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/enrollments")} className="shrink-0">
              All <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4" data-testid="list-recent-activity">
                {activity?.map((item, i) => (
                  <div key={item.id ?? i} className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      item.type === "enrollment" ? "bg-primary/10" :
                      item.type === "completion" ? "bg-emerald-500/10" : "bg-amber-500/10"
                    )}>
                      {item.type === "enrollment" ? (
                        <UserPlus className="w-4 h-4 text-primary" />
                      ) : item.type === "completion" ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Activity className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">
                        <span className="font-semibold">{item.studentName}</span>{" "}
                        <span className="text-muted-foreground font-normal">{item.description}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{item.courseName}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {format(new Date(item.occurredAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activity || activity.length === 0) && (
                  <div className="text-center text-sm text-muted-foreground py-6">No recent activity.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionItemsBanner({
  items,
  loading,
  onNavigate,
}: {
  items: ActionItems | null;
  loading: boolean;
  onNavigate: (path: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[88px] min-w-[200px] rounded-xl shrink-0" />
        ))}
      </div>
    );
  }

  if (!items) return null;

  const total = items.ungradedAssignments + items.ungradedQuizzes + items.overdueAssignments;
  const hasActivity = total > 0 || items.newEnrollmentsThisWeek > 0 || items.draftCourses > 0;

  const notifications: {
    key: string;
    count: number;
    label: string;
    description: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    bgColor: string;
    path: string;
    urgent?: boolean;
  }[] = [
    items.overdueAssignments > 0 && {
      key: "overdue",
      count: items.overdueAssignments,
      label: items.overdueAssignments === 1 ? "overdue submission" : "overdue submissions",
      description: "Past due date, not yet graded",
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/40",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      path: "/assignments",
      urgent: true,
    },
    items.ungradedAssignments > 0 && {
      key: "assignments",
      count: items.ungradedAssignments,
      label: items.ungradedAssignments === 1 ? "assignment to mark" : "assignments to mark",
      description: "Submitted and awaiting your grade",
      icon: PenLine,
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-200 dark:border-amber-800",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      path: "/assignments",
    },
    items.ungradedQuizzes > 0 && {
      key: "quizzes",
      count: items.ungradedQuizzes,
      label: items.ungradedQuizzes === 1 ? "IELTS Practice needs review" : "IELTS Practices need review",
      description: "Student submissions awaiting score",
      icon: ClipboardCheck,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      path: "/quizzes",
    },
    items.newEnrollmentsThisWeek > 0 && {
      key: "enrollments",
      count: items.newEnrollmentsThisWeek,
      label: items.newEnrollmentsThisWeek === 1 ? "new enrollment" : "new enrollments",
      description: "Students joined in the last 7 days",
      icon: UserCheck,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      path: "/enrollments",
    },
    items.draftCourses > 0 && {
      key: "drafts",
      count: items.draftCourses,
      label: items.draftCourses === 1 ? "draft course" : "draft courses",
      description: "Unpublished and not visible to students",
      icon: BookMarked,
      iconBg: "bg-slate-100 dark:bg-slate-800",
      iconColor: "text-slate-600 dark:text-slate-400",
      borderColor: "border-slate-200 dark:border-slate-700",
      bgColor: "bg-slate-50 dark:bg-slate-900/40",
      path: "/courses",
    },
  ].filter(Boolean) as NonNullable<typeof notifications[number]>[];

  if (!hasActivity) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span className="font-medium">All caught up!</span>
        <span className="text-emerald-600/80 dark:text-emerald-500/80">No pending actions at the moment.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Bell className="w-4 h-4" />
        <span>
          {total > 0
            ? `${total} item${total !== 1 ? "s" : ""} need${total === 1 ? "s" : ""} your attention`
            : "Activity this week"}
        </span>
        {total > 0 && (
          <span className="ml-auto text-xs bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 font-semibold">
            {total}
          </span>
        )}
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {notifications.map((n) => (
          <button
            key={n.key}
            onClick={() => onNavigate(n.path)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] group",
              n.borderColor,
              n.bgColor
            )}
          >
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", n.iconBg)}>
              <n.icon className={cn("w-5 h-5", n.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className={cn("text-2xl font-bold tabular-nums leading-none", n.urgent ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                  {n.count}
                </span>
                <span className="text-xs font-semibold text-foreground/80 leading-none">{n.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-tight truncate">{n.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  title, value, sub, icon: Icon, iconColor, loading, testId,
}: {
  title: string;
  value?: string | number;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
  loading: boolean;
  testId?: string;
}) {
  return (
    <Card data-testid={testId} className="ring-1 ring-border hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4 px-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              <p className="text-3xl font-bold mt-1.5 leading-none">{value ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
