import { useState } from "react";
import { 
  useGetCourse, 
  useUpdateCourse, 
  useDeleteCourse, 
  useListLessons,
  useDeleteLesson,
  useListChapters,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  getGetCourseQueryKey,
  getListLessonsQueryKey,
  getListCoursesQueryKey,
  getListChaptersQueryKey,
} from "@workspace/api-client-react";
import { useLocation, useParams, Link } from "wouter";
import {
  ArrowLeft, BookOpen, Plus, Video, Clock, GripVertical, Trash2, Edit,
  AlertCircle, ChevronDown, ChevronRight, FolderOpen, LayoutList, Pencil, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { GradesTab } from "@/components/course-grades-tab";

type Lesson = {
  id: number;
  title: string;
  videoUrl?: string | null;
  durationMinutes?: number | null;
  chapterId?: number | null;
  chapterTitle?: string | null;
  order: number;
};

type Chapter = {
  id: number;
  title: string;
  order: number;
};

function LessonCard({
  lesson,
  index,
  courseId,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  index: number;
  courseId: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-row items-center p-4 hover:border-primary/50 transition-colors" data-testid={`lesson-item-${lesson.id}`}>
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
          onClick={onEdit}
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
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

function ChapterSection({
  chapter,
  lessons,
  courseId,
  onEditLesson,
  onDeleteLesson,
  onRenameChapter,
  onDeleteChapter,
}: {
  chapter: Chapter;
  lessons: Lesson[];
  courseId: number;
  onEditLesson: (lessonId: number) => void;
  onDeleteLesson: (lessonId: number) => void;
  onRenameChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapter: Chapter) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <FolderOpen className="w-4 h-4 text-primary/70 flex-shrink-0" />
        <span className="font-semibold text-sm flex-1">{chapter.title}</span>
        <span className="text-xs text-muted-foreground">
          {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onRenameChapter(chapter)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the chapter "{chapter.title}"? Lessons in this chapter will become unassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDeleteChapter(chapter)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Chapter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-2 bg-card">
          {lessons.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 italic">No lessons in this chapter yet.</p>
          ) : (
            lessons.map((lesson, idx) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                index={idx}
                courseId={courseId}
                onEdit={() => onEditLesson(lesson.id)}
                onDelete={() => onDeleteLesson(lesson.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { id: idStr } = useParams();
  const id = Number(idStr);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [renamingChapter, setRenamingChapter] = useState<Chapter | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const { data: course, isLoading: courseLoading } = useGetCourse(id, { 
    query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) } 
  });
  
  const { data: lessons = [], isLoading: lessonsLoading } = useListLessons(id, {
    query: { enabled: !!id, queryKey: getListLessonsQueryKey(id) }
  });

  const { data: chapters = [] } = useListChapters(id, {
    query: { enabled: !!id, queryKey: getListChaptersQueryKey(id) }
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

  const createChapter = useCreateChapter({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey(id) });
        toast({ title: "Chapter created" });
        setAddingChapter(false);
        setNewChapterTitle("");
      },
      onError: () => {
        toast({ title: "Failed to create chapter", variant: "destructive" });
      }
    }
  });

  const updateChapter = useUpdateChapter({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey(id) });
        toast({ title: "Chapter renamed" });
        setRenamingChapter(null);
        setRenameTitle("");
      },
      onError: () => {
        toast({ title: "Failed to rename chapter", variant: "destructive" });
      }
    }
  });

  const deleteChapter = useDeleteChapter({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(id) });
        toast({ title: "Chapter deleted" });
      },
      onError: () => {
        toast({ title: "Failed to delete chapter", variant: "destructive" });
      }
    }
  });

  function handleAddChapter() {
    if (!newChapterTitle.trim()) return;
    const nextOrder = chapters.length + 1;
    createChapter.mutate({ courseId: id, data: { title: newChapterTitle.trim(), order: nextOrder } });
  }

  function handleRenameChapter() {
    if (!renamingChapter || !renameTitle.trim()) return;
    updateChapter.mutate({ courseId: id, chapterId: renamingChapter.id, data: { title: renameTitle.trim(), order: renamingChapter.order } });
  }

  function startRename(chapter: Chapter) {
    setRenamingChapter(chapter);
    setRenameTitle(chapter.title);
  }

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

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const chapterIds = new Set(chapters.map((c) => c.id));
  const assignedLessons = lessons.filter((l) => l.chapterId != null && chapterIds.has(l.chapterId));
  const unassignedLessons = lessons.filter((l) => l.chapterId == null || !chapterIds.has(l.chapterId));

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

      <Tabs
        value={new URLSearchParams(window.location.search).get("tab") ?? "curriculum"}
        onValueChange={(v) => setLocation(`/courses/${id}?tab=${v}`)}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="curriculum" data-testid="tab-curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="grades" data-testid="tab-grades">Grades</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="curriculum" className="space-y-6">
          {/* ── Header row ── */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold">Course Content</h2>
              <p className="text-sm text-muted-foreground">
                {chapters.length > 0
                  ? `${chapters.length} chapter${chapters.length !== 1 ? "s" : ""} · ${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`
                  : `${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setAddingChapter(true); setNewChapterTitle(""); }}
                data-testid="btn-add-chapter"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Add Chapter
              </Button>
              <Link href={`/courses/${id}/lessons/new`}>
                <Button size="sm" data-testid="btn-add-lesson">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lesson
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Inline add chapter ── */}
          {addingChapter && (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
              <FolderOpen className="w-4 h-4 text-primary/70 flex-shrink-0" />
              <Input
                autoFocus
                placeholder="Chapter title…"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddChapter();
                  if (e.key === "Escape") setAddingChapter(false);
                }}
                className="h-8 text-sm"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAddChapter} disabled={createChapter.isPending}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setAddingChapter(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ── Inline rename chapter dialog ── */}
          {renamingChapter && (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
              <Pencil className="w-4 h-4 text-primary/70 flex-shrink-0" />
              <span className="text-xs text-muted-foreground mr-1">Renaming:</span>
              <Input
                autoFocus
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameChapter();
                  if (e.key === "Escape") setRenamingChapter(null);
                }}
                className="h-8 text-sm"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleRenameChapter} disabled={updateChapter.isPending}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setRenamingChapter(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {lessonsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : lessons.length === 0 && chapters.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card/50 border-dashed">
              <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No content yet</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Start by adding a chapter to organise your course, or add a lesson directly.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setAddingChapter(true)}>
                  <FolderOpen className="w-4 h-4 mr-2" />Add Chapter
                </Button>
                <Link href={`/courses/${id}/lessons/new`}>
                  <Button variant="outline">Add First Lesson</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4" data-testid="list-lessons">
              {/* ── Chapters with their lessons ── */}
              {sortedChapters.map((chapter) => {
                const chapterLessons = assignedLessons
                  .filter((l) => l.chapterId === chapter.id)
                  .sort((a, b) => a.order - b.order);
                return (
                  <ChapterSection
                    key={chapter.id}
                    chapter={chapter}
                    lessons={chapterLessons}
                    courseId={id}
                    onEditLesson={(lid) => setLocation(`/courses/${id}/lessons/${lid}/edit`)}
                    onDeleteLesson={(lid) => deleteLesson.mutate({ courseId: id, id: lid })}
                    onRenameChapter={startRename}
                    onDeleteChapter={(ch) => deleteChapter.mutate({ courseId: id, chapterId: ch.id })}
                  />
                );
              })}

              {/* ── Unassigned lessons ── */}
              {unassignedLessons.length > 0 && (
                <div className={cn("border rounded-lg overflow-hidden", chapters.length > 0 && "border-dashed")}>
                  {chapters.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted/20 border-b">
                      <LayoutList className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Unassigned Lessons</span>
                      <span className="text-xs text-muted-foreground ml-auto">{unassignedLessons.length}</span>
                    </div>
                  )}
                  <div className={cn("space-y-2", chapters.length > 0 ? "p-3 bg-card" : "space-y-3")}>
                    {unassignedLessons
                      .sort((a, b) => a.order - b.order)
                      .map((lesson, index) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          index={index}
                          courseId={id}
                          onEdit={() => setLocation(`/courses/${id}/lessons/${lesson.id}/edit`)}
                          onDelete={() => deleteLesson.mutate({ courseId: id, id: lesson.id })}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="grades" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Gradebook</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              View and enter grades for all students across every assignment.
            </p>
          </div>
          <GradesTab courseId={id} />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
