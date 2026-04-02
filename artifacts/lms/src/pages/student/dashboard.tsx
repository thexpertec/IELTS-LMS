import React from "react";
import { useStudent } from "@/context/student-context";
import {
  useGetStudentEnrollments,
  useGetStudentNotifications,
  useGetStudentAssignments,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  BookOpen, Bell, FileText, ArrowRight, Clock, AlertCircle, CheckCircle,
  LayoutGrid, Headphones, Mic, PenTool, Type, GraduationCap, Play,
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
    <div className="space-y-8 p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

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

        {/* Left: Courses grid */}
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
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="flex flex-col">
                  <CardContent className="p-5 flex-1">
                    <Skeleton className="h-16 w-full" />
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
            <div className="grid sm:grid-cols-2 gap-4">
              {activeEnrollments.map((enrollment) => {
                const Icon = categoryIcon(enrollment.courseCategory ?? "");
                const started = enrollment.progressPercent > 0;
                return (
                  <Card key={enrollment.id} className="flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm leading-snug line-clamp-2">
                            {enrollment.courseTitle}
                          </CardTitle>
                          {enrollment.courseCategory && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {enrollment.courseCategory}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>
                          {enrollment.completedLessons}/{enrollment.totalLessons} lessons
                        </span>
                        <span className="font-medium">{enrollment.progressPercent}%</span>
                      </div>
                      <Progress value={enrollment.progressPercent} className="h-2" />
                    </CardContent>
                    <CardFooter className="pt-3">
                      <Link href={`/student/courses/${enrollment.courseId}`} className="w-full">
                        <Button
                          className="w-full gap-2"
                          variant={started ? "secondary" : "default"}
                          size="sm"
                        >
                          {started ? (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              Continue
                            </>
                          ) : (
                            <>
                              Start Course
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
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

        {/* Right: Deadlines + Notifications */}
        <div className="md:col-span-4 space-y-5">

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Upcoming Deadlines
                </span>
                <Link href="/student/assignments">
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-2">
                    All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-7 h-7 text-green-500 mx-auto mb-1.5" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground">No pending deadlines</p>
                </div>
              ) : (
                upcomingDeadlines.map((assignment) => {
                  const due = new Date(assignment.dueDate);
                  const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
                  const isUrgent = daysLeft <= 3;
                  return (
                    <div key={assignment.id} className="flex gap-3 items-start">
                      <div className={`flex flex-col items-center justify-center rounded-md p-2 min-w-[46px] text-center ${isUrgent ? "bg-destructive/10" : "bg-muted"}`}>
                        <span className={`text-xs font-bold uppercase leading-none ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                          {daysLeft <= 0 ? "TODAY" : daysLeft === 1 ? "TMRW" : `${daysLeft}d`}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight truncate">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{assignment.courseTitle}</p>
                        <p className={`text-xs mt-0.5 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                          {formatDistanceToNow(due, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          {unreadNotifs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Notifications
                  </span>
                  <Link href="/student/notifications">
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-2">
                      All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {unreadNotifs.map((n) => (
                  <div key={n.id} className="space-y-0.5">
                    <p className="font-medium text-sm leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/student/quizzes">
                <Button variant="outline" className="w-full justify-start gap-3 h-9" size="sm">
                  <FileText className="w-4 h-4 text-primary" />
                  My Quizzes
                </Button>
              </Link>
              <Link href="/student/assignments">
                <Button variant="outline" className="w-full justify-start gap-3 h-9" size="sm">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  Assignments
                </Button>
              </Link>
              <Link href="/student/courses">
                <Button variant="outline" className="w-full justify-start gap-3 h-9" size="sm">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Browse Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
