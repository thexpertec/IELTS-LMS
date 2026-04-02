import { useStudent } from "@/context/student-context";
import { useGetStudentEnrollments, useGetStudentNotifications, useGetStudentAssignments } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  BookOpen, Bell, FileText, TrendingUp, CheckCircle, Clock, AlertCircle, ChevronRight, Play,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow, isPast } from "date-fns";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const { student } = useStudent();
  const email = student?.email ?? "";

  const { data: enrollments, isLoading: enrollLoading } = useGetStudentEnrollments({ email }, { query: { enabled: !!email } });
  const { data: notifications } = useGetStudentNotifications({ email }, { query: { enabled: !!email } });
  const { data: assignments } = useGetStudentAssignments({ email }, { query: { enabled: !!email } });

  const activeEnrollments = enrollments?.filter((e) => e.status === "active") ?? [];
  const completedEnrollments = enrollments?.filter((e) => e.status === "completed") ?? [];
  const unreadNotifs = notifications?.filter((n) => !n.isRead) ?? [];
  const pendingAssignments = assignments?.filter((a) => !a.submission) ?? [];
  const upcomingDeadlines = assignments
    ?.filter((a) => !a.submission && !isPast(new Date(a.dueDate)))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4) ?? [];

  const avgProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((sum, e) => sum + e.progressPercent, 0) / activeEnrollments.length)
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {student?.displayName?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your learning today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Active Courses" value={activeEnrollments.length} color="bg-blue-500/10 text-blue-500" />
        <StatCard icon={CheckCircle} label="Completed" value={completedEnrollments.length} color="bg-green-500/10 text-green-500" />
        <StatCard icon={FileText} label="Pending Tasks" value={pendingAssignments.length} color="bg-orange-500/10 text-orange-500" />
        <StatCard icon={Bell} label="Unread Alerts" value={unreadNotifs.length} color="bg-primary/10 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Courses</h2>
            <Link href="/student/courses">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {enrollLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : activeEnrollments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No active courses yet</p>
                <p className="text-sm text-muted-foreground mb-4">Browse available courses and start learning</p>
                <Link href="/student/courses">
                  <Button size="sm">Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeEnrollments.slice(0, 4).map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{enrollment.courseCategory}</Badge>
                        </div>
                        <h3 className="font-semibold truncate">{enrollment.courseTitle}</h3>
                        <p className="text-sm text-muted-foreground">{enrollment.instructor}</p>
                        <div className="mt-3 space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{enrollment.completedLessons}/{enrollment.totalLessons} lessons</span>
                            <span>{enrollment.progressPercent}%</span>
                          </div>
                          <Progress value={enrollment.progressPercent} className="h-1.5" />
                        </div>
                      </div>
                      <Link href={`/student/courses/${enrollment.courseId}`}>
                        <Button size="sm" variant="outline" className="gap-2 flex-shrink-0">
                          <Play className="w-3.5 h-3.5" />
                          Continue
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {avgProgress > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Overall Progress</p>
                  <p className="text-sm text-muted-foreground">Average across active courses</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-primary">{avgProgress}%</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Deadlines</h2>
            <Link href="/student/assignments">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-muted-foreground">No pending deadlines</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((assignment) => {
                const due = new Date(assignment.dueDate);
                const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 3;
                return (
                  <Card key={assignment.id} className={isUrgent ? "border-orange-500/50 bg-orange-500/5" : ""}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {isUrgent ? (
                          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{assignment.courseTitle}</p>
                          <p className={`text-xs mt-1 font-medium ${isUrgent ? "text-orange-500" : "text-muted-foreground"}`}>
                            Due {formatDistanceToNow(due, { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant={isUrgent ? "destructive" : "secondary"} className="flex-shrink-0 text-xs">
                          {assignment.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <Link href="/student/notifications">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {unreadNotifs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No unread notifications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {unreadNotifs.slice(0, 3).map((notif) => (
                <Card key={notif.id} className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
