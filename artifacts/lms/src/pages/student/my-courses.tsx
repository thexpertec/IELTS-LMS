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
  BookOpen, Play, Search, Plus, Clock, Users, CheckCircle, Lock, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function statusColor(status: string) {
  if (status === "completed") return "bg-green-500/10 text-green-500 border-green-500/30";
  if (status === "dropped") return "bg-muted text-muted-foreground";
  return "bg-blue-500/10 text-blue-500 border-blue-500/30";
}

export default function MyCourses() {
  const { student } = useStudent();
  const email = student?.email ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
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

  const filteredEnrollments = (enrollments ?? []).filter(
    (e) =>
      e.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      e.instructor.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAvailable = (available ?? []).filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructor ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-1">Manage your enrolled courses and discover new ones.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
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
            Browse Courses ({available?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-6">
          {enrollLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-lg">No courses yet</p>
                <p className="text-muted-foreground text-sm mb-4">Browse available courses to start learning</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEnrollments.map((enrollment) => (
                <Card key={enrollment.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className={`text-xs ${statusColor(enrollment.status)}`}>
                        {enrollment.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{enrollment.courseCategory}</Badge>
                    </div>
                    <CardTitle className="text-base mt-2 leading-snug">{enrollment.courseTitle}</CardTitle>
                    <CardDescription>{enrollment.instructor}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{enrollment.completedLessons} of {enrollment.totalLessons} lessons</span>
                        <span className="font-medium">{enrollment.progressPercent}%</span>
                      </div>
                      <Progress value={enrollment.progressPercent} className="h-2" />
                    </div>
                    {enrollment.status === "completed" ? (
                      <Button variant="outline" size="sm" className="w-full gap-2 text-green-600 border-green-500/50">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </Button>
                    ) : (
                      <Link href={`/student/courses/${enrollment.courseId}`}>
                        <Button size="sm" className="w-full gap-2">
                          <Play className="w-4 h-4" />
                          Continue Learning
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

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
              {filteredAvailable.map((course) => (
                <Card key={course.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                      {course.durationHours && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {course.durationHours}h
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base mt-2 leading-snug">{course.title}</CardTitle>
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
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
