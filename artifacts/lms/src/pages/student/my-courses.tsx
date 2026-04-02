import { useState } from "react";
import { Link } from "wouter";
import {
  useGetStudentEnrollments,
  useGetAvailableCourses,
  useStudentEnroll,
  getGetStudentEnrollmentsQueryKey,
} from "@workspace/api-client-react";
import { useStudent } from "@/context/student-context";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Play, Search, Plus, Clock, CheckCircle, GraduationCap,
  Headphones, Mic, PenTool, Type, LayoutGrid, FileText, Users, ClipboardList,
  ArrowRight, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

// ── Category icons ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  reading: BookOpen, writing: PenTool, listening: Headphones,
  speaking: Mic, grammar: FileText, vocabulary: Type, general: LayoutGrid,
};

function categoryIcon(category: string): React.ElementType {
  if (!category) return GraduationCap;
  const key = category.toLowerCase().replace(/\s+/g, "");
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return GraduationCap;
}

function statusColor(status: string) {
  if (status === "completed") return "bg-green-500/10 text-green-600 border-green-500/30";
  if (status === "dropped") return "bg-muted text-muted-foreground";
  return "bg-blue-500/10 text-blue-600 border-blue-500/30";
}

// ── Stat chip ──────────────────────────────────────────────────────────────────
function StatChip({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className={`rounded-lg p-2.5 flex flex-col items-center gap-1 ${bg}`}>
      <span className={color}>{icon}</span>
      <span className="text-sm font-bold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MyCourses() {
  const { student } = useStudent();
  const email = student?.email ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const { data: enrollments, isLoading: enrollLoading } = useGetStudentEnrollments(
    { email }, { query: { enabled: !!email } }
  );
  const { data: available, isLoading: availLoading } = useGetAvailableCourses(
    { email }, { query: { enabled: !!email } }
  );
  const enrollMutation = useStudentEnroll();

  const handleEnroll = async (courseId: number) => {
    if (!student) return;
    setEnrollingId(courseId);
    try {
      await enrollMutation.mutateAsync({
        data: { email: student.email, displayName: student.displayName, courseId },
      });
      await queryClient.invalidateQueries({ queryKey: getGetStudentEnrollmentsQueryKey({ email }) });
      toast({ title: "Enrolled!", description: "You have been enrolled in the course." });
    } catch {
      toast({ title: "Error", description: "Could not enroll. Try again.", variant: "destructive" });
    } finally {
      setEnrollingId(null);
    }
  };

  const filteredEnrollments = (enrollments ?? []).filter((e) => {
    const matchSearch =
      e.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      e.instructor.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || e.status === filter;
    return matchSearch && matchFilter;
  });

  const filteredAvailable = (available ?? []).filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructor ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = enrollments?.filter((e) => e.status === "active").length ?? 0;
  const completedCount = enrollments?.filter((e) => e.status === "completed").length ?? 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-1">Your enrolled courses and everything available to explore.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses or instructors..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="enrolled">
        <TabsList>
          <TabsTrigger value="enrolled" className="gap-2">
            <BookOpen className="w-4 h-4" />
            My Enrollments ({enrollments?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="browse" className="gap-2">
            <Plus className="w-4 h-4" />
            Explore Courses ({available?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* ── My Enrollments tab ── */}
        <TabsContent value="enrolled" className="mt-6 space-y-5">
          {/* Filter row */}
          {!enrollLoading && (enrollments?.length ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(["all", "active", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f === "all" ? `All (${enrollments?.length ?? 0})` :
                   f === "active" ? `Active (${activeCount})` :
                   `Completed (${completedCount})`}
                </button>
              ))}
            </div>
          )}

          {enrollLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-lg">No courses found</p>
                <p className="text-muted-foreground text-sm mb-4">
                  {search ? "Try a different search term" : "Browse available courses to start learning"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEnrollments.map((enrollment) => {
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
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className={`text-xs ${statusColor(enrollment.status)}`}>
                              {enrollment.status}
                            </Badge>
                            {enrollment.courseCategory && (
                              <Badge variant="secondary" className="text-xs">{enrollment.courseCategory}</Badge>
                            )}
                          </div>
                          <CardTitle className="text-base leading-snug">{enrollment.courseTitle}</CardTitle>
                          {enrollment.instructor && (
                            <p className="text-xs text-muted-foreground mt-0.5">by {enrollment.instructor}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-3 space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{enrollment.completedLessons}/{enrollment.totalLessons} lessons completed</span>
                          <span className="font-semibold text-foreground">{enrollment.progressPercent}%</span>
                        </div>
                        <Progress value={enrollment.progressPercent} className="h-2" />
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2">
                        <StatChip
                          icon={<BookOpen className="w-3.5 h-3.5" />} label="Lessons"
                          value={enrollment.totalLessons}
                          color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/40"
                        />
                        <StatChip
                          icon={<FileText className="w-3.5 h-3.5" />} label="Quizzes"
                          value={e.totalQuizzes ?? 0}
                          color="text-violet-600 dark:text-violet-400" bg="bg-violet-50 dark:bg-violet-950/40"
                        />
                        <StatChip
                          icon={<ClipboardList className="w-3.5 h-3.5" />} label="Assignments"
                          value={e.totalAssignments ?? 0}
                          color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/40"
                        />
                        <StatChip
                          icon={<Users className="w-3.5 h-3.5" />} label="Enrolled"
                          value={e.totalEnrolled ?? 0}
                          color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-950/40"
                        />
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 border-t">
                      {enrollment.status === "completed" ? (
                        <Link href={`/student/courses/${enrollment.courseId}`} className="w-full">
                          <Button variant="outline" size="sm" className="w-full gap-2 text-green-600 border-green-500/50">
                            <CheckCircle className="w-4 h-4" />Review Course
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/student/courses/${enrollment.courseId}`} className="w-full">
                          <Button size="sm" className="w-full gap-2" variant={started ? "secondary" : "default"}>
                            <Play className="w-3.5 h-3.5" />
                            {started ? "Continue Learning" : "Start Course"}
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Explore tab ── */}
        <TabsContent value="browse" className="mt-6">
          {availLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : filteredAvailable.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-lg">You're enrolled in everything!</p>
                <p className="text-muted-foreground text-sm">All available courses are in your library.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailable.map((course) => {
                const Icon = categoryIcon(course.category ?? "");
                return (
                  <Card key={course.id} className="flex flex-col hover:shadow-md transition-shadow group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                          {course.durationHours && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />{course.durationHours}h
                            </div>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-base mt-3 leading-snug">{course.title}</CardTitle>
                      <CardDescription>{course.instructor}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingId === course.id}
                        data-testid={`btn-enroll-${course.id}`}
                      >
                        <Plus className="w-4 h-4" />
                        {enrollingId === course.id ? "Enrolling..." : "Enroll Now"}
                        <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
