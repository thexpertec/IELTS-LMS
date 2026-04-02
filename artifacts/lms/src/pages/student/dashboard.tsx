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
  LayoutGrid, Headphones, Mic, PenTool, Type, GraduationCap, Play,
  Users, ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  reading: BookOpen,
  writing: PenTool,
  listening: Headphones,
  speaking: Mic,
  grammar: FileText,
  vocabulary: Type,
  general: LayoutGrid,
};

function categoryIcon(category: string): React.ElementType {
  if (!category) return GraduationCap;
  const key = category.toLowerCase().replace(/\s+/g, "");
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return GraduationCap;
}

export default function StudentDashboard() {
  const { student } = useStudent();
  const email = student?.email ?? "";

  const { data: enrollments, isLoading: enrollLoading } = useGetStudentEnrollments(
    { email },
    { query: { enabled: !!email } }
  );
  const { data: notifications } = useGetStudentNotifications(
    { email },
    { query: { enabled: !!email } }
  );
  const { data: assignments } = useGetStudentAssignments(
    { email },
    { query: { enabled: !!email } }
  );

  const activeEnrollments = enrollments?.filter((e) => e.status === "active") ?? [];
  const unreadNotifs = notifications?.filter((n) => !n.isRead).slice(0, 3) ?? [];
  const upcomingDeadlines = assignments
    ?.filter((a) => !a.submission && new Date(a.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4) ?? [];

  const totalProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((s, e) => s + e.progressPercent, 0) / activeEnrollments.length)
    : 0;

  const totalItems = enrollments?.length ?? 0;
  const completedItems = enrollments?.filter((e) => e.status === "completed").length ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {student?.displayName?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* Overall Progress */}
      {totalItems > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {completedItems} of {totalItems} course{totalItems !== 1 ? "s" : ""} completed
              </span>
              <span className="text-sm font-semibold">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-3" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-12">

        {/* Left: Courses list — full width cards */}
        <div className="md:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Courses</h2>
            <Link href="/student/courses">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {enrollLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeEnrollments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">No active courses yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse available courses and start learning
                </p>
                <Link href="/student/courses">
                  <Button size="sm">Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeEnrollments.map((enrollment) => {
                const Icon = categoryIcon(enrollment.courseCategory ?? "");
                const started = enrollment.progressPercent > 0;
                const e = enrollment as any;
                return (
                  <Card key={enrollment.id} className="flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base leading-snug">
                            {enrollment.courseTitle}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {enrollment.courseCategory && (
                              <Badge variant="outline" className="text-xs">
                                {enrollment.courseCategory}
                              </Badge>
                            )}
                            {enrollment.instructor && (
                              <span className="text-xs text-muted-foreground">
                                by {enrollment.instructor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-3 space-y-4">
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>
                            {enrollment.completedLessons}/{enrollment.totalLessons} lessons completed
                          </span>
                          <span className="font-semibold text-foreground">{enrollment.progressPercent}%</span>
                        </div>
                        <Progress value={enrollment.progressPercent} className="h-2" />
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-2">
                        <StatChip
                          icon={<BookOpen className="w-3.5 h-3.5" />}
                          label="Lessons"
                          value={enrollment.totalLessons}
                          color="text-blue-600 dark:text-blue-400"
                          bg="bg-blue-50 dark:bg-blue-950/40"
                        />
                        <StatChip
                          icon={<FileText className="w-3.5 h-3.5" />}
                          label="Quizzes"
                          value={e.totalQuizzes ?? 0}
                          color="text-violet-600 dark:text-violet-400"
                          bg="bg-violet-50 dark:bg-violet-950/40"
                        />
                        <StatChip
                          icon={<ClipboardList className="w-3.5 h-3.5" />}
                          label="Assignments"
                          value={e.totalAssignments ?? 0}
                          color="text-amber-600 dark:text-amber-400"
                          bg="bg-amber-50 dark:bg-amber-950/40"
                        />
                        <StatChip
                          icon={<Users className="w-3.5 h-3.5" />}
                          label="Enrolled"
                          value={e.totalEnrolled ?? 0}
                          color="text-green-600 dark:text-green-400"
                          bg="bg-green-50 dark:bg-green-950/40"
                        />
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 border-t">
                      <Link href={`/student/courses/${enrollment.courseId}`} className="w-full">
                        <Button
                          className="w-full gap-2"
                          variant={started ? "secondary" : "default"}
                          size="sm"
                        >
                          {started ? (
                            <><Play className="w-3.5 h-3.5" />Continue Learning</>
                          ) : (
                            <>Start Course<ArrowRight className="w-3.5 h-3.5" /></>
                          )}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Unified Activity Feed */}
        <div className="md:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Activity & Notifications
                </span>
                <Link href="/student/notifications">
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-2">
                    All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
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
                        key={`deadline-${assignment.id}`}
                        className={`flex gap-3 items-start rounded-lg p-2.5 ${isUrgent ? "bg-destructive/5" : "hover:bg-muted/50"} transition-colors`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isUrgent ? "bg-destructive/10" : "bg-muted"}`}>
                          <Clock className={`w-4 h-4 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm leading-tight truncate">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{assignment.courseTitle}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${isUrgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                              {daysLeft <= 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(due, { addSuffix: true })}
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
                      key={`notif-${n.id}`}
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

// ── Stat chip ──────────────────────────────────────────────────────────────────

function StatChip({
  icon, label, value, color, bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-lg p-2.5 flex flex-col items-center gap-1 ${bg}`}>
      <span className={color}>{icon}</span>
      <span className="text-sm font-bold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
    </div>
  );
}
