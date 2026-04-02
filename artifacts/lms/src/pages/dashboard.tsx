import { useGetDashboardStats, useGetRecentActivity, useGetCourseStats } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, GraduationCap, CheckCircle, UserPlus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 10 });
  const { data: courseStats, isLoading: courseStatsLoading } = useGetCourseStats();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your learning platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses}
          description={`${stats?.publishedCourses || 0} published`}
          icon={BookOpen}
          loading={statsLoading}
          testId="stat-total-courses"
        />
        <StatCard
          title="Total Students"
          value={stats?.totalStudents}
          description="Unique learners"
          icon={GraduationCap}
          loading={statsLoading}
          testId="stat-total-students"
        />
        <StatCard
          title="Active Enrollments"
          value={stats?.activeEnrollments}
          description={`Out of ${stats?.totalEnrollments || 0} total`}
          icon={Activity}
          loading={statsLoading}
          testId="stat-active-enrollments"
        />
        <StatCard
          title="Completion Rate"
          value={stats?.completionRate != null ? `${Math.round(stats.completionRate)}%` : undefined}
          description={`${stats?.completedEnrollments || 0} completed`}
          icon={CheckCircle}
          loading={statsLoading}
          testId="stat-completion-rate"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Enrollments and completions per course</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {courseStatsLoading ? (
              <div className="h-[350px] w-full flex items-center justify-center">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : (
              <div className="h-[350px] w-full" data-testid="chart-course-stats">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis 
                      dataKey="title" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    />
                    <Bar dataKey="enrollmentCount" name="Enrollments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completionCount" name="Completions" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest enrollments and progress</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6" data-testid="list-recent-activity">
                {activity?.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {item.type === 'enrollment' ? (
                        <UserPlus className="w-4 h-4 text-primary" />
                      ) : item.type === 'completion' ? (
                        <CheckCircle className="w-4 h-4 text-chart-2" />
                      ) : (
                        <Activity className="w-4 h-4 text-chart-4" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        <span className="font-semibold">{item.studentName}</span> {item.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.courseName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.occurredAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activity || activity.length === 0) && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No recent activity.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  loading,
  testId
}: { 
  title: string; 
  value?: string | number; 
  description: string; 
  icon: React.ElementType;
  loading: boolean;
  testId?: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value ?? 0}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}