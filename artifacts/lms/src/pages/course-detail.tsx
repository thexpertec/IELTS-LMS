import { useGetCourse, useUpdateCourse, useDeleteCourse, getGetCourseQueryKey, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams, useSearch } from "wouter";
import { ArrowLeft, BookOpen, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { GradesTab } from "@/components/course-grades-tab";
import { CurriculumTab } from "@/components/curriculum-tab";
import { StreamTab } from "@/components/stream-tab";

export default function CourseDetail() {
  const { id: idStr } = useParams();
  const id = Number(idStr);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useGetCourse(id, {
    query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) }
  });

  const updateCourse = useUpdateCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course updated" });
      }
    }
  });

  const deleteCourse = useDeleteCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course deleted" });
        setLocation("/courses");
      },
      onError: () => toast({ title: "Failed to delete course", variant: "destructive" }),
    }
  });

  const tab = new URLSearchParams(search).get("tab") ?? "curriculum";

  if (courseLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto text-center py-24">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Course Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The course you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => setLocation("/courses")}>Return to Courses</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-3 text-muted-foreground"
            onClick={() => setLocation("/courses")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            <Badge variant={course.isPublished ? "default" : "secondary"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{course.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={course.isPublished ? "outline" : "default"}
            onClick={() => updateCourse.mutate({ id, data: { isPublished: !course.isPublished } })}
            disabled={updateCourse.isPending}
            data-testid="btn-toggle-publish"
          >
            {course.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" data-testid="btn-delete-course">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes the course, all its lessons, and removes all enrollments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteCourse.mutate({ id })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Course
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ── Meta row ── */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-y py-4">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span className="font-medium text-foreground">Category:</span> {course.category}
        </div>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">Instructor:</span> {course.instructor}
        </div>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-1.5 capitalize">
          <span className="font-medium text-foreground">Level:</span> {course.level}
        </div>
        {course.durationHours && (
          <>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {course.durationHours} hours
            </div>
          </>
        )}
      </div>

      {/* ── Top-level Tabs ── */}
      <Tabs
        value={tab}
        onValueChange={(v) => setLocation(`/courses/${id}?tab=${v}`)}
        className="w-full"
      >
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0 mb-8">
          <TabsTrigger
            value="curriculum"
            data-testid="tab-curriculum"
            className="rounded-none border-b-2 border-transparent px-6 py-3 text-base font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Curriculum
          </TabsTrigger>
          <TabsTrigger
            value="grades"
            data-testid="tab-grades"
            className="rounded-none border-b-2 border-transparent px-6 py-3 text-base font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Grades
          </TabsTrigger>
          <TabsTrigger
            value="stream"
            data-testid="tab-stream"
            className="rounded-none border-b-2 border-transparent px-6 py-3 text-base font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Stream
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            data-testid="tab-settings"
            className="rounded-none border-b-2 border-transparent px-6 py-3 text-base font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Curriculum ── */}
        <TabsContent value="curriculum" className="space-y-6">
          <CurriculumTab courseId={id} />
        </TabsContent>

        {/* ── Grades ── */}
        <TabsContent value="grades" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Gradebook</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              View and enter grades for all students across every assignment.
            </p>
          </div>
          <GradesTab courseId={id} />
        </TabsContent>

        {/* ── Stream ── */}
        <TabsContent value="stream" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Stream</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Post announcements, manage discussions, and view upcoming items.
            </p>
          </div>
          <StreamTab courseId={id} />
        </TabsContent>

        {/* ── Settings ── */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Created on {format(new Date(course.createdAt), "MMMM d, yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">
                Note: Editing details functionality will be added in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
