import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetStudentCourseDetail,
  useStudentCompleteLesson,
  useListQuizzes,
  useGetStudentAssignments,
  useSubmitAssignment,
  getGetStudentCourseDetailQueryKey,
} from "@workspace/api-client-react";
import { useStudent } from "@/context/student-context";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, CheckCircle, Circle, Play, FileText, Video, BookOpen,
  Clock, ClipboardList, Timer, ChevronDown, ChevronUp, Send,
  CheckCheck, GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Tab = "all" | "lessons" | "quizzes" | "assignments";

function lessonIcon(type: string) {
  if (type === "video") return Video;
  if (type === "quiz") return FileText;
  return BookOpen;
}

export default function CourseView() {
  const [, params] = useRoute("/student/courses/:id");
  const courseId = Number(params?.id);
  const { student } = useStudent();
  const email = student?.email ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<Record<number, string>>({});

  const { data: course, isLoading: courseLoading } = useGetStudentCourseDetail(
    courseId,
    { email },
    { query: { enabled: !!email && !!courseId } }
  );
  const { data: allQuizzes } = useListQuizzes(
    { courseId },
    { query: { enabled: !!courseId } }
  );
  const { data: allAssignments } = useGetStudentAssignments(
    { email },
    { query: { enabled: !!email } }
  );
  const completeLesson = useStudentCompleteLesson();
  const submitAssignment = useSubmitAssignment();

  const quizzes = (allQuizzes ?? []).filter((q) => q.isPublished);
  const assignments = (allAssignments ?? []).filter((a) => a.courseId === courseId);

  async function handleToggleLesson(lessonId: number, isCompleted: boolean) {
    if (!course) return;
    try {
      await completeLesson.mutateAsync({
        lessonId,
        data: { enrollmentId: course.enrollmentId, completed: !isCompleted },
      });
      await queryClient.invalidateQueries({
        queryKey: getGetStudentCourseDetailQueryKey(courseId, { email }),
      });
      toast({
        title: isCompleted ? "Marked incomplete" : "Lesson complete!",
        description: isCompleted ? "Lesson marked as incomplete." : "Great work — keep going!",
      });
    } catch {
      toast({ title: "Error", description: "Could not update progress.", variant: "destructive" });
    }
  }

  async function handleSubmitAssignment(assignmentId: number) {
    if (!student || !course) return;
    const content = submitting[assignmentId];
    if (!content?.trim()) return;
    try {
      await submitAssignment.mutateAsync({
        id: assignmentId,
        data: { email: student.email, enrollmentId: course.enrollmentId, content: content.trim() },
      });
      setSubmitting((prev) => { const n = { ...prev }; delete n[assignmentId]; return n; });
      toast({ title: "Submitted!", description: "Your assignment has been submitted." });
    } catch {
      toast({ title: "Error", description: "Could not submit assignment.", variant: "destructive" });
    }
  }

  if (courseLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground">Course not found or you are not enrolled.</p>
        <Link href="/student/courses">
          <Button className="mt-4" variant="outline">Go to My Courses</Button>
        </Link>
      </div>
    );
  }

  const completedCount = course.lessons.filter((l) => l.isCompleted).length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all",         label: "All Content",  count: course.lessons.length + quizzes.length + assignments.length },
    { id: "lessons",     label: "Lessons",      count: course.lessons.length },
    { id: "quizzes",     label: "Quizzes",      count: quizzes.length },
    { id: "assignments", label: "Assignment",   count: assignments.length },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ── Header ── */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground"
            onClick={() => setLocation("/student/courses")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", course.status === "completed" ? "text-green-600 border-green-500/50" : "text-blue-600 border-blue-500/50")}
                >
                  {course.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{course.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Instructor: <span className="font-medium text-foreground">{course.instructor}</span></p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-muted/60 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">Module Progress</span>
              <span className="font-bold text-primary">{course.progressPercent}%</span>
            </div>
            <Progress value={course.progressPercent} className="h-3 rounded-full" />
            <p className="text-xs text-muted-foreground">{completedCount} of {course.lessons.length} lessons completed</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b -mb-[1px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium",
                    activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-4">

        {/* ─── LESSONS ─── */}
        {(activeTab === "all" || activeTab === "lessons") && course.lessons.length > 0 && (
          <section className="space-y-3">
            {activeTab === "all" && (
              <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">Lessons</h2>
            )}
            {course.lessons.map((lesson, idx) => {
              const Icon = lessonIcon(lesson.type);
              const isExpanded = expandedLesson === lesson.id;
              return (
                <div
                  key={lesson.id}
                  className={cn(
                    "bg-card rounded-xl border shadow-sm overflow-hidden transition-all",
                    lesson.isCompleted && "border-green-500/30 bg-green-50/40 dark:bg-green-950/10"
                  )}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lesson {idx + 1}</span>
                          {lesson.isCompleted && (
                            <Badge className="text-[10px] h-4 px-1.5 bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/10" variant="outline">
                              <CheckCheck className="w-2.5 h-2.5 mr-0.5" />Completed
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-bold">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{lesson.description}</p>
                        )}
                        {lesson.duration > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                            <span className="text-xs text-muted-foreground mx-1">·</span>
                            <Icon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground capitalize">{lesson.type}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={lesson.isCompleted ? "outline" : "default"}
                        className={cn(
                          "shrink-0 gap-1.5 text-xs h-8",
                          lesson.isCompleted && "text-green-600 border-green-500/50 hover:bg-green-50"
                        )}
                        onClick={() => handleToggleLesson(lesson.id, lesson.isCompleted)}
                      >
                        {lesson.isCompleted ? (
                          <><Circle className="w-3 h-3" />Mark as Unread</>
                        ) : (
                          <><CheckCircle className="w-3 h-3" />Mark as Read</>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                      >
                        <Play className="w-3 h-3" />
                        Start Lesson
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded lesson content */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 px-4 sm:px-5 py-4 space-y-3">
                      {lesson.content ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&_a]:text-primary [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: lesson.content }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No content available for this lesson yet.</p>
                      )}
                      {!lesson.isCompleted && (
                        <>
                          <Separator />
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => handleToggleLesson(lesson.id, false)}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark as Complete
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ─── QUIZZES ─── */}
        {(activeTab === "all" || activeTab === "quizzes") && (
          <section className="space-y-3">
            {activeTab === "all" && quizzes.length > 0 && (
              <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs pt-2">Quizzes</h2>
            )}
            {quizzes.length === 0 && activeTab === "quizzes" && (
              <div className="bg-card border rounded-xl p-8 text-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No quizzes available for this course.</p>
              </div>
            )}
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-card rounded-xl border shadow-sm p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quiz</span>
                    </div>
                    <h3 className="text-base font-bold">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ClipboardList className="w-3 h-3" />
                        {quiz.questionCount} question{quiz.questionCount !== 1 ? "s" : ""}
                      </div>
                      {quiz.timeLimitMinutes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="w-3 h-3" />
                          {quiz.timeLimitMinutes} min
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/student/quizzes/${quiz.id}`}>
                    <Button size="sm" className="shrink-0 gap-1.5 text-xs h-8">
                      <Play className="w-3 h-3" />
                      Start Quiz
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ─── ASSIGNMENTS ─── */}
        {(activeTab === "all" || activeTab === "assignments") && (
          <section className="space-y-3">
            {activeTab === "all" && assignments.length > 0 && (
              <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs pt-2">Assignments</h2>
            )}
            {assignments.length === 0 && activeTab === "assignments" && (
              <div className="bg-card border rounded-xl p-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No assignments for this course.</p>
              </div>
            )}
            {assignments.map((a) => {
              const isSubmitted = !!a.submission;
              const draftContent = submitting[a.id] ?? "";
              const isWriting = a.id in submitting;
              return (
                <div key={a.id} className={cn(
                  "bg-card rounded-xl border shadow-sm p-4 sm:p-5 space-y-3",
                  isSubmitted && "border-green-500/30 bg-green-50/40 dark:bg-green-950/10"
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assignment</span>
                        {isSubmitted && (
                          <Badge className="text-[10px] h-4 px-1.5 bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/10" variant="outline">
                            <CheckCheck className="w-2.5 h-2.5 mr-0.5" />Submitted
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-bold">{a.title}</h3>
                      {a.description && (
                        <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Due: <span className="font-medium">{format(new Date(a.dueDate), "MMM d, yyyy")}</span></span>
                        <span>Max score: <span className="font-medium">{a.maxScore}</span></span>
                      </div>
                    </div>
                    {!isSubmitted && !isWriting && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5 text-xs h-8"
                        onClick={() => setSubmitting((prev) => ({ ...prev, [a.id]: "" }))}
                      >
                        <Send className="w-3 h-3" />
                        Submit
                      </Button>
                    )}
                  </div>

                  {isSubmitted && (
                    <div className="bg-green-50/60 dark:bg-green-950/20 border border-green-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Your submission</p>
                      <p className="text-sm text-muted-foreground">{a.submission!.content}</p>
                      {a.submission!.score !== undefined && (
                        <p className="text-xs font-semibold text-green-700 mt-2">Score: {a.submission!.score} / {a.maxScore}</p>
                      )}
                      {a.submission!.feedback && (
                        <p className="text-xs text-muted-foreground mt-1">Feedback: {a.submission!.feedback}</p>
                      )}
                    </div>
                  )}

                  {isWriting && !isSubmitted && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write your answer here…"
                        rows={4}
                        className="text-sm"
                        value={draftContent}
                        onChange={(e) => setSubmitting((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs"
                          disabled={!draftContent.trim()}
                          onClick={() => handleSubmitAssignment(a.id)}
                        >
                          <Send className="w-3 h-3" />
                          Submit Answer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => setSubmitting((prev) => { const n = { ...prev }; delete n[a.id]; return n; })}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ─── Empty state for All Content ─── */}
        {activeTab === "all" && course.lessons.length === 0 && quizzes.length === 0 && assignments.length === 0 && (
          <div className="bg-card border rounded-xl p-12 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No content available for this course yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
