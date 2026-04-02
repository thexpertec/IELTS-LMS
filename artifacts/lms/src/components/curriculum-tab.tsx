import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListLessons,
  useDeleteLesson,
  useListChapters,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  useListQuizzes,
  useListAssignments,
  useDeleteQuiz,
  useDeleteAssignment,
  getListLessonsQueryKey,
  getListChaptersQueryKey,
  getListQuizzesQueryKey,
  getListAssignmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Plus, Video, Clock, GripVertical, Trash2, Edit,
  ChevronDown, ChevronRight, FolderOpen, LayoutList, Pencil, Check, X,
  ClipboardList, Timer, FileText, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Lesson = {
  id: number;
  title: string;
  videoUrl?: string | null;
  durationMinutes?: number | null;
  chapterId?: number | null;
  order: number;
};

type Chapter = {
  id: number;
  title: string;
  order: number;
};

function LessonCard({
  lesson, index, courseId, onEdit, onDelete,
}: {
  lesson: Lesson; index: number; courseId: number;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <Card className="flex flex-row items-center p-4 hover:border-primary/50 transition-colors">
      <div className="text-muted-foreground cursor-grab mr-4">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mr-4 font-semibold text-primary text-sm flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{lesson.title}</h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {lesson.videoUrl && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>}
          {lesson.durationMinutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.durationMinutes} min</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
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
              <AlertDialogDescription>Delete "{lesson.title}"? This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

function ChapterSection({
  chapter, lessons, courseId, onEditLesson, onDeleteLesson, onRenameChapter, onDeleteChapter,
}: {
  chapter: Chapter; lessons: Lesson[]; courseId: number;
  onEditLesson: (id: number) => void; onDeleteLesson: (id: number) => void;
  onRenameChapter: (c: Chapter) => void; onDeleteChapter: (c: Chapter) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b">
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <FolderOpen className="w-4 h-4 text-primary/70" />
        <span className="font-semibold text-sm flex-1">{chapter.title}</span>
        <span className="text-xs text-muted-foreground mr-2">{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRenameChapter(chapter)}>
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
              <AlertDialogDescription>Delete "{chapter.title}"? Lessons will become unassigned.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteChapter(chapter)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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

export function CurriculumTab({ courseId }: { courseId: number }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [renamingChapter, setRenamingChapter] = useState<Chapter | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const { data: lessons = [], isLoading: lessonsLoading } = useListLessons(courseId, {
    query: { enabled: !!courseId, queryKey: getListLessonsQueryKey(courseId) }
  });
  const { data: chapters = [] } = useListChapters(courseId, {
    query: { enabled: !!courseId, queryKey: getListChaptersQueryKey(courseId) }
  });
  const { data: quizzes = [], isLoading: quizzesLoading } = useListQuizzes(
    { courseId },
    { query: { enabled: !!courseId, queryKey: getListQuizzesQueryKey({ courseId }) } }
  );
  const { data: assignments = [], isLoading: assignmentsLoading } = useListAssignments(
    { courseId } as Parameters<typeof useListAssignments>[0],
    { query: { enabled: !!courseId } }
  );

  const deleteLesson = useDeleteLesson({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(courseId) }),
      onError: () => toast({ title: "Failed to delete lesson", variant: "destructive" }),
    }
  });
  const deleteQuiz = useDeleteQuiz({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListQuizzesQueryKey({ courseId }) }),
      onError: () => toast({ title: "Failed to delete quiz", variant: "destructive" }),
    }
  });
  const deleteAssignment = useDeleteAssignment({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() }),
      onError: () => toast({ title: "Failed to delete assignment", variant: "destructive" }),
    }
  });
  const createChapter = useCreateChapter({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey(courseId) });
        toast({ title: "Chapter created" });
        setAddingChapter(false);
        setNewChapterTitle("");
      },
    }
  });
  const updateChapter = useUpdateChapter({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey(courseId) });
        toast({ title: "Chapter renamed" });
        setRenamingChapter(null);
        setRenameTitle("");
      },
    }
  });
  const deleteChapter = useDeleteChapter({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey(courseId) });
        queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(courseId) });
        toast({ title: "Chapter deleted" });
      },
    }
  });

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const chapterIds = new Set(chapters.map((c) => c.id));
  const unassignedLessons = lessons.filter((l: Lesson) => !l.chapterId || !chapterIds.has(l.chapterId!));

  const subTab = new URLSearchParams(window.location.search).get("sub") ?? "lessons";

  function setSubTab(v: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("sub", v);
    setLocation(`/courses/${courseId}?tab=curriculum&sub=${v}`);
  }

  return (
    <Tabs value={subTab} onValueChange={setSubTab} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="lessons">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Lessons
            {lessons.length > 0 && <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">{lessons.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
            Quizzes
            {quizzes.length > 0 && <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">{quizzes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Assignments
            {assignments.length > 0 && <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">{assignments.length}</span>}
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-2">
          {subTab === "lessons" && (
            <>
              <Button size="sm" variant="outline" onClick={() => { setAddingChapter(true); setNewChapterTitle(""); }}>
                <FolderOpen className="w-4 h-4 mr-2" />Add Chapter
              </Button>
              <Link href={`/courses/${courseId}/lessons/new`}>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Lesson</Button>
              </Link>
            </>
          )}
          {subTab === "quizzes" && (
            <Link href={`/quizzes/new?courseId=${courseId}`}>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Quiz</Button>
            </Link>
          )}
          {subTab === "assignments" && (
            <Link href={`/assignments?courseId=${courseId}`}>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Assignment</Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── LESSONS ── */}
      <TabsContent value="lessons" className="space-y-4 mt-0">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {chapters.length > 0
              ? `${chapters.length} chapter${chapters.length !== 1 ? "s" : ""} · ${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`
              : `${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`}
          </h3>
        </div>

        {addingChapter && (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
            <FolderOpen className="w-4 h-4 text-primary/70 flex-shrink-0" />
            <Input
              autoFocus placeholder="Chapter title…" value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { if (newChapterTitle.trim()) createChapter.mutate({ courseId, data: { title: newChapterTitle.trim(), order: chapters.length + 1 } }); }
                if (e.key === "Escape") setAddingChapter(false);
              }}
              className="h-8 text-sm"
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => { if (newChapterTitle.trim()) createChapter.mutate({ courseId, data: { title: newChapterTitle.trim(), order: chapters.length + 1 } }); }} disabled={createChapter.isPending}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setAddingChapter(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {renamingChapter && (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
            <Pencil className="w-4 h-4 text-primary/70 flex-shrink-0" />
            <span className="text-xs text-muted-foreground mr-1">Renaming:</span>
            <Input
              autoFocus value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { if (renameTitle.trim()) updateChapter.mutate({ courseId, chapterId: renamingChapter.id, data: { title: renameTitle.trim(), order: renamingChapter.order } }); }
                if (e.key === "Escape") setRenamingChapter(null);
              }}
              className="h-8 text-sm"
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => { if (renameTitle.trim()) updateChapter.mutate({ courseId, chapterId: renamingChapter.id, data: { title: renameTitle.trim(), order: renamingChapter.order } }); }} disabled={updateChapter.isPending}>
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
          </div>
        ) : (
          <div className="space-y-3">
            {sortedChapters.map((chapter) => {
              const chapterLessons = lessons
                .filter((l: Lesson) => l.chapterId === chapter.id)
                .sort((a: Lesson, b: Lesson) => a.order - b.order);
              return (
                <ChapterSection
                  key={chapter.id}
                  chapter={chapter}
                  lessons={chapterLessons}
                  courseId={courseId}
                  onEditLesson={(lessonId) => setLocation(`/courses/${courseId}/lessons/${lessonId}/edit`)}
                  onDeleteLesson={(lessonId) => deleteLesson.mutate({ courseId, id: lessonId })}
                  onRenameChapter={(c) => { setRenamingChapter(c); setRenameTitle(c.title); }}
                  onDeleteChapter={(c) => deleteChapter.mutate({ courseId, chapterId: c.id })}
                />
              );
            })}
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
                    .sort((a: Lesson, b: Lesson) => a.order - b.order)
                    .map((lesson: Lesson, index: number) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        courseId={courseId}
                        onEdit={() => setLocation(`/courses/${courseId}/lessons/${lesson.id}/edit`)}
                        onDelete={() => deleteLesson.mutate({ courseId, id: lesson.id })}
                      />
                    ))}
                </div>
              </div>
            )}
            {lessons.length === 0 && (
              <div className="border-2 border-dashed rounded-xl p-12 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No lessons yet. Add your first lesson to get started.</p>
              </div>
            )}
          </div>
        )}
      </TabsContent>

      {/* ── QUIZZES ── */}
      <TabsContent value="quizzes" className="space-y-3 mt-0">
        {quizzesLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : quizzes.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No quizzes yet.</p>
            <Link href={`/quizzes/new?courseId=${courseId}`}>
              <Button size="sm" className="mt-4"><Plus className="w-4 h-4 mr-2" />Create Quiz</Button>
            </Link>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="p-4 flex items-center justify-between gap-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">{quiz.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{quiz.questionCount} question{quiz.questionCount !== 1 ? "s" : ""}</span>
                    {quiz.timeLimitMinutes && (
                      <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{quiz.timeLimitMinutes} min</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {quiz.isPublished ? (
                  <Badge variant="outline" className="text-green-600 border-green-500/50 text-xs">Published</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">Draft</Badge>
                )}
                <Link href={`/quizzes/${quiz.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                      <AlertDialogDescription>Delete "{quiz.title}"? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteQuiz.mutate({ id: quiz.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))
        )}
      </TabsContent>

      {/* ── ASSIGNMENTS ── */}
      <TabsContent value="assignments" className="space-y-3 mt-0">
        {assignmentsLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : assignments.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No assignments yet.</p>
            <Link href={`/assignments?courseId=${courseId}`}>
              <Button size="sm" className="mt-4"><Plus className="w-4 h-4 mr-2" />Create Assignment</Button>
            </Link>
          </div>
        ) : (
          assignments.map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between gap-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">{a.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>Due: {format(new Date(a.dueDate), "MMM d, yyyy")}</span>
                    <span>Max score: {a.maxScore}</span>
                    {a.submissionCount > 0 && <span className="text-blue-600 font-medium">{a.submissionCount} submission{a.submissionCount !== 1 ? "s" : ""}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/assignments/${a.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                      <AlertDialogDescription>Delete "{a.title}"? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteAssignment.mutate({ id: a.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
