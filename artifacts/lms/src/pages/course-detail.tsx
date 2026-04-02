import { 
  useGetCourse, 
  useUpdateCourse, 
  useDeleteCourse, 
  useListLessons,
  useDeleteLesson,
  getGetCourseQueryKey,
  getListLessonsQueryKey,
  getListCoursesQueryKey
} from "@workspace/api-client-react";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, BookOpen, Plus, Settings, Video, Clock, GripVertical, Trash2, Edit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export default function CourseDetail() {
  const { id: idStr } = useParams();
  const id = Number(idStr);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useGetCourse(id, { 
    query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) } 
  });
  
  const { data: lessons, isLoading: lessonsLoading } = useListLessons(id, {
    query: { enabled: !!id, queryKey: getListLessonsQueryKey(id) }
  });

  const updateCourse = useUpdateCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course updated successfully" });
      }
    }
  });

  const deleteCourse = useDeleteCourse({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course deleted successfully" });
        setLocation("/courses");
      },
      onError: () => {
        toast({ title: "Failed to delete course", variant: "destructive" });
      }
    }
  });

  const deleteLesson = useDeleteLesson({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(id) });
        toast({ title: "Lesson deleted successfully" });
      }
    }
  });

  if (courseLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
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
                  This action cannot be undone. This will permanently delete the course, all its lessons, and remove all enrollments.
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

      <Tabs defaultValue="curriculum" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="curriculum" data-testid="tab-curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="curriculum" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Course Content</h2>
              <p className="text-sm text-muted-foreground">Manage the lessons and modules for this course.</p>
            </div>
            <Link href={`/courses/${id}/lessons/new`}>
              <Button size="sm" data-testid="btn-add-lesson">
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson
              </Button>
            </Link>
          </div>

          {lessonsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !lessons || lessons.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card/50 border-dashed">
              <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No lessons yet</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Start building your course by adding the first lesson.
              </p>
              <Link href={`/courses/${id}/lessons/new`}>
                <Button variant="outline">Add First Lesson</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3" data-testid="list-lessons">
              {lessons.map((lesson, index) => (
                <Card key={lesson.id} className="flex flex-row items-center p-4 hover:border-primary/50 transition-colors" data-testid={`lesson-item-${lesson.id}`}>
                  <div className="text-muted-foreground cursor-grab mr-4">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mr-4 font-semibold text-primary text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{lesson.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {lesson.videoUrl && (
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" /> Video
                        </span>
                      )}
                      {lesson.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {lesson.durationMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setLocation(`/courses/${id}/lessons/${lesson.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteLesson.mutate({ courseId: id, id: lesson.id })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>
                Created on {format(new Date(course.createdAt), "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  Note: Editing details functionality will be added in a future update.
                </p>
                {/* Real edit form would go here, omitting for brevity of task */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}