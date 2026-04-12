import { useState, type ReactNode } from "react";
import { useRoute, Link, useLocation, useSearch } from "wouter";
import {
  useGetStudentCourseDetail,
  useStudentCompleteLesson,
  useListQuizzes,
  useGetStudentAssignments,
  useSubmitAssignment,
  useListChapters,
  getGetStudentCourseDetailQueryKey,
} from "@workspace/api-client-react";
import { useStudent } from "@/context/student-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, CheckCircle, Circle, Play, FileText, BookOpen,
  Clock, ClipboardList, Timer, ChevronDown, ChevronUp, Send,
  CheckCheck, GraduationCap, Megaphone, MessageSquare,
  Calendar, Award, Zap, Pencil, AlertCircle,
  Layers, BookText, PenLine, Headphones, Mic, AlignLeft,
  BookMarked, Volume2, Languages,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isPast } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentLesson = {
  id: number;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  imageUrls?: string[] | null;
  audioUrls?: string[] | null;
  duration: number;
  type: string;
  chapterId?: number | null;
  chapterTitle?: string | null;
  isCompleted: boolean;
};

type Announcement = {
  id: number;
  courseId: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
};

type Discussion = {
  id: number;
  courseId: number;
  studentEmail: string;
  studentName: string;
  content: string;
  createdAt: string;
};

type UpcomingItem = {
  id: number;
  title: string;
  type: "quiz" | "assignment";
  date: string;
  maxScore?: number | null;
};

type QuizAttemptRow = {
  quizId: number;
  quizTitle: string;
  timeLimitMinutes: number | null;
  attempt: {
    id: number;
    score: number | null;
    maxScore: number;
    feedback: string | null;
    submittedAt: string | null;
  } | null;
};

type Tab = "stream" | "curriculum" | "grades" | "instructors";

// ── Fetch helpers ─────────────────────────────────────────────────────────────

const fetchAnnouncements = (id: number): Promise<Announcement[]> =>
  fetch(`/api/courses/${id}/announcements`, { credentials: "include" }).then((r) => r.json());
const fetchDiscussions = (id: number): Promise<Discussion[]> =>
  fetch(`/api/courses/${id}/discussions`, { credentials: "include" }).then((r) => r.json());
const fetchUpcoming = (id: number): Promise<UpcomingItem[]> =>
  fetch(`/api/courses/${id}/upcoming`, { credentials: "include" }).then((r) => r.json());
const fetchQuizAttempts = (courseId: number, email: string): Promise<QuizAttemptRow[]> =>
  fetch(`/api/student/quiz-attempts?courseId=${courseId}&email=${encodeURIComponent(email)}`, { credentials: "include" }).then((r) => r.json());

// ── Main component ────────────────────────────────────────────────────────────

export default function CourseView() {
  const [, params] = useRoute("/student/courses/:id");
  const courseId = Number(params?.id);
  const { student } = useStudent();
  const email = student?.email ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();

  const activeTab: Tab = (new URLSearchParams(search).get("tab") as Tab) ?? "stream";
  function setTab(t: Tab) {
    setLocation(`/student/courses/${courseId}?tab=${t}`, { replace: true });
  }

  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<Record<number, string>>({});
  const [discussionText, setDiscussionText] = useState("");
  const [unitTypeTabs, setUnitTypeTabs] = useState<Record<number, string>>({});

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: course, isLoading: courseLoading } = useGetStudentCourseDetail(
    courseId, { email }, { query: { enabled: !!email && !!courseId } }
  );
  const { data: chapters = [] } = useListChapters(courseId, { query: { enabled: !!courseId } });
  const { data: allQuizzes } = useListQuizzes({ courseId }, { query: { enabled: !!courseId } });
  const { data: allAssignments } = useGetStudentAssignments({ email }, { query: { enabled: !!email } });

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements", courseId],
    queryFn: () => fetchAnnouncements(courseId),
    enabled: !!courseId,
  });
  const { data: discussions = [], refetch: refetchDiscussions } = useQuery({
    queryKey: ["discussions", courseId],
    queryFn: () => fetchDiscussions(courseId),
    enabled: !!courseId,
  });
  const { data: upcoming = [] } = useQuery({
    queryKey: ["upcoming", courseId],
    queryFn: () => fetchUpcoming(courseId),
    enabled: !!courseId,
  });
  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["student-quiz-attempts", courseId, email],
    queryFn: () => fetchQuizAttempts(courseId, email),
    enabled: !!courseId && !!email,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const completeLesson = useStudentCompleteLesson();
  const submitAssignment = useSubmitAssignment();

  const postDiscussion = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/student/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          studentEmail: email,
          studentName: student?.name ?? email,
          content,
        }),
      });
      if (!res.ok) throw new Error("Failed to post");
      return res.json();
    },
    onSuccess: () => {
      setDiscussionText("");
      refetchDiscussions();
    },
    onError: () => toast({ title: "Could not post comment", variant: "destructive" }),
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const quizzes = (allQuizzes ?? []).filter((q) => q.isPublished);
  const assignments = (allAssignments ?? []).filter((a) => a.courseId === courseId);

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const chapterIds = new Set(chapters.map((c) => c.id));

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleToggleLesson(lessonId: number, isCompleted: boolean) {
    if (!course) return;
    try {
      await completeLesson.mutateAsync({
        lessonId,
        data: { enrollmentId: course.enrollmentId, completed: !isCompleted },
      });
      await queryClient.invalidateQueries({ queryKey: getGetStudentCourseDetailQueryKey(courseId, { email }) });
      toast({ title: isCompleted ? "Marked incomplete" : "Lesson complete!", description: isCompleted ? "Lesson marked as incomplete." : "Keep going!" });
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

  // ── Loading / not-found states ────────────────────────────────────────────

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

  const lessons = course.lessons as unknown as StudentLesson[];
  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const unassignedLessons = lessons.filter((l) => !l.chapterId || !chapterIds.has(l.chapterId));

  const TAB_DEFS: { id: Tab; label: string }[] = [
    { id: "stream",      label: "Stream" },
    { id: "curriculum",  label: "Curriculum" },
    { id: "grades",      label: "My Grades" },
    { id: "instructors", label: "Instructors" },
  ];

  // ── Lesson renderer (shared) ──────────────────────────────────────────────

  function renderLesson(lesson: StudentLesson, idx: number) {
    const isExpanded = expandedLesson === lesson.id;
    return (
      <div key={lesson.id} className={cn(
        "bg-card rounded-xl border shadow-sm overflow-hidden",
        lesson.isCompleted && "border-green-500/30 bg-green-50/40 dark:bg-green-950/10"
      )}>
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
              {(lesson as unknown as { description?: string }).description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{(lesson as unknown as { description?: string }).description}</p>
              )}
              {lesson.duration > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant={lesson.isCompleted ? "outline" : "default"}
              className={cn("shrink-0 gap-1.5 text-xs h-8", lesson.isCompleted && "text-green-600 border-green-500/50 hover:bg-green-50")}
              onClick={() => handleToggleLesson(lesson.id, lesson.isCompleted)}
            >
              {lesson.isCompleted ? <><Circle className="w-3 h-3" />Mark as Unread</> : <><CheckCircle className="w-3 h-3" />Mark as Read</>}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}>
              <Play className="w-3 h-3" />
              Start Lesson
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t bg-muted/30 px-4 sm:px-5 py-4 space-y-4">
            {/* Rich text content */}
            {lesson.content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              <p className="text-sm text-muted-foreground italic">No content available for this lesson yet.</p>
            )}

            {/* Single image */}
            {lesson.imageUrl && (
              <div>
                <img src={lesson.imageUrl} alt="Lesson image" className="rounded-lg max-w-full max-h-96 object-contain border shadow-sm" />
              </div>
            )}

            {/* Multiple images */}
            {lesson.imageUrls && lesson.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lesson.imageUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Lesson image ${i + 1}`} className="rounded-lg w-full max-h-72 object-contain border shadow-sm bg-black/5" />
                ))}
              </div>
            )}

            {/* Single audio */}
            {lesson.audioUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Audio</span>
                <audio controls className="w-full h-10" src={lesson.audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Multiple audio files */}
            {lesson.audioUrls && lesson.audioUrls.length > 0 && (
              <div className="space-y-2">
                {lesson.audioUrls.map((url, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Audio {i + 1}</span>
                    <audio controls className="w-full h-10" src={url}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ))}
              </div>
            )}

            {/* Video */}
            {lesson.videoUrl && (
              <div className="aspect-video w-full rounded-lg overflow-hidden border shadow-sm bg-black">
                <video controls className="w-full h-full" src={lesson.videoUrl}>
                  Your browser does not support the video element.
                </video>
              </div>
            )}

            {!lesson.isCompleted && (
              <>
                <Separator />
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleToggleLesson(lesson.id, false)}>
                  <CheckCircle className="w-3.5 h-3.5" />Mark as Complete
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Stream tab ─────────────────────────────────────────────────────────────

  function StreamPanel() {
    const futureUpcoming = upcoming.filter((u) => !isPast(new Date(u.date)));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Announcements</h2>
            </div>
            {announcements.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-bold">{a.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">— {a.authorName}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Discussion board */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Discussion</h2>
            </div>
            <div className="bg-card border rounded-xl p-4 shadow-sm mb-3">
              <Textarea
                placeholder="Share something with your classmates…"
                rows={3}
                className="text-sm mb-2 resize-none"
                value={discussionText}
                onChange={(e) => setDiscussionText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={!discussionText.trim() || postDiscussion.isPending}
                  onClick={() => postDiscussion.mutate(discussionText.trim())}
                >
                  <Send className="w-3 h-3" />
                  {postDiscussion.isPending ? "Posting…" : "Post"}
                </Button>
              </div>
            </div>

            {discussions.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground">No discussions yet. Be the first to post!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {discussions.map((d) => {
                  const initials = d.studentName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  const isMe = d.studentEmail === email;
                  return (
                    <div key={d.id} className={cn("bg-card border rounded-xl p-4 shadow-sm", isMe && "border-primary/20 bg-primary/5")}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">{initials}</span>
                        </div>
                        <span className="text-xs font-semibold">{isMe ? "You" : d.studentName}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{d.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: Upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Upcoming</h2>
          </div>
          {futureUpcoming.length === 0 ? (
            <div className="bg-card border rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground">Nothing upcoming.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {futureUpcoming.map((u) => (
                <div key={`${u.type}-${u.id}`} className="bg-card border rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    {u.type === "quiz"
                      ? <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-violet-100 text-violet-700 border-0"><Zap className="w-2.5 h-2.5 mr-0.5" />Quiz</Badge>
                      : <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-100 text-blue-700 border-0"><FileText className="w-2.5 h-2.5 mr-0.5" />Assignment</Badge>
                    }
                  </div>
                  <p className="text-sm font-semibold leading-tight">{u.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due {format(new Date(u.date), "MMM d, yyyy")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Curriculum tab ────────────────────────────────────────────────────────

  const STUDENT_LESSON_TYPES = [
    { id: "reading",       label: "Reading",       Icon: BookText,   color: "text-blue-600",   activeBg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-500" },
    { id: "writing",       label: "Writing",       Icon: PenLine,    color: "text-purple-600", activeBg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-500" },
    { id: "listening",     label: "Listening",     Icon: Headphones, color: "text-green-600",  activeBg: "bg-green-50 dark:bg-green-950/30",   border: "border-green-500" },
    { id: "speaking",      label: "Speaking",      Icon: Mic,        color: "text-orange-600", activeBg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-500" },
    { id: "grammar",       label: "Grammar",       Icon: AlignLeft,  color: "text-rose-600",   activeBg: "bg-rose-50 dark:bg-rose-950/30",     border: "border-rose-500" },
    { id: "vocabulary",    label: "Vocabulary",    Icon: BookMarked, color: "text-amber-600",  activeBg: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-500" },
    { id: "pronunciation", label: "Pronunciation", Icon: Volume2,    color: "text-sky-600",    activeBg: "bg-sky-50 dark:bg-sky-950/30",       border: "border-sky-500" },
    { id: "translation",   label: "Translation",   Icon: Languages,  color: "text-teal-600",   activeBg: "bg-teal-50 dark:bg-teal-950/30",     border: "border-teal-500" },
  ];

  function CurriculumPanel() {
    if (lessons.length === 0) {
      return <EmptyState icon={<BookOpen />} message="No lessons available yet." />;
    }

    const chapterIds = new Set(sortedChapters.map((c) => c.id));

    const unitQuizzes = (quizzes ?? []).filter((q) => !!q.chapterId);
    const unitAssignments = (assignments ?? []).filter((a) => !!(a as unknown as { chapterId?: number | null }).chapterId);

    // Units with lessons
    const units = sortedChapters
      .map((chapter) => ({
        chapter,
        lessons: lessons.filter((l) => l.chapterId === chapter.id),
        quizzes: unitQuizzes.filter((q) => q.chapterId === chapter.id),
        assignments: unitAssignments.filter((a) => (a as unknown as { chapterId?: number | null }).chapterId === chapter.id),
      }))
      .filter((u) => u.lessons.length > 0 || u.quizzes.length > 0 || u.assignments.length > 0);

    const unassigned = lessons.filter((l) => !l.chapterId || !chapterIds.has(l.chapterId!));

    return (
      <div className="space-y-4">
        {units.map(({ chapter, lessons: unitLessons, quizzes: unitChapQuizzes, assignments: unitChapAssignments }) => {
          const activeType = unitTypeTabs[chapter.id] ?? "reading";
          const setActiveType = (t: string) =>
            setUnitTypeTabs((prev) => ({ ...prev, [chapter.id]: t }));

          const completedCount = unitLessons.filter((l) => l.isCompleted).length;

          const lessonsByType = STUDENT_LESSON_TYPES.map((t) => ({
            ...t,
            lessons: unitLessons.filter((l) => (l.type ?? "reading") === t.id),
            quizzes: unitChapQuizzes.filter((q) => ((q as unknown as { lessonType?: string | null }).lessonType ?? "reading") === t.id),
            assignments: unitChapAssignments.filter((a) => ((a as unknown as { lessonType?: string | null }).lessonType ?? "reading") === t.id),
          }));

          const activeTypeData = lessonsByType.find((t) => t.id === activeType);
          const activeLessons = activeTypeData?.lessons ?? [];
          const activeUnitQuizzes = activeTypeData?.quizzes ?? [];
          const activeUnitAssignments = activeTypeData?.assignments ?? [];

          return (
            <div key={chapter.id} className="border rounded-xl overflow-hidden shadow-sm">
              {/* Unit header */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/40 border-b">
                <Layers className="w-4 h-4 text-primary/70 shrink-0" />
                <h3 className="text-sm font-bold flex-1">{chapter.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{unitLessons.length} done
                </span>
              </div>

              {/* Lesson type tab bar */}
              <div className="flex items-center gap-0 border-b overflow-x-auto bg-card">
                {lessonsByType.map((t) => {
                  const { Icon } = t;
                  const isActive = activeType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveType(t.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-[1px] transition-colors whitespace-nowrap shrink-0",
                        isActive
                          ? `${t.border} ${t.color}`
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                      {(t.lessons.length + t.quizzes.length + t.assignments.length) > 0 && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px]",
                          isActive ? cn(t.activeBg, t.color) : "bg-muted text-muted-foreground"
                        )}>
                          {t.lessons.length + t.quizzes.length + t.assignments.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active type content */}
              <div className="bg-card p-3 space-y-2 min-h-[72px]">
                {activeLessons.length === 0 && activeUnitQuizzes.length === 0 && activeUnitAssignments.length === 0 ? (
                  <div className="flex items-center justify-center h-12 text-xs text-muted-foreground/50 italic">
                    No {activeType} content in this unit.
                  </div>
                ) : (
                  <>
                    {activeLessons.map((l, i) => renderLesson(l, i))}
                    {activeUnitQuizzes.map((quiz) => {
                      const q = quiz as unknown as { id: number; title: string; description?: string | null; questionCount: number; timeLimitMinutes?: number | null };
                      return (
                        <div key={q.id} className="rounded-xl border border-violet-200/80 bg-violet-50/40 dark:bg-violet-950/10 shadow-sm p-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-violet-100 dark:bg-violet-900/40">
                            <ClipboardList className="w-4 h-4 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-violet-100 text-violet-700 border-0"><Zap className="w-2.5 h-2.5 mr-0.5" />Quiz</Badge>
                              {q.timeLimitMinutes && <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{q.timeLimitMinutes} min</span>}
                            </div>
                            <p className="text-sm font-semibold truncate">{q.title}</p>
                            {q.description && <p className="text-xs text-muted-foreground truncate">{q.description}</p>}
                            <p className="text-xs text-muted-foreground">{q.questionCount} question{q.questionCount !== 1 ? "s" : ""}</p>
                          </div>
                          <Link href={`/s/quiz/${q.id}`}>
                            <Button size="sm" className="h-8 px-3 text-xs bg-violet-600 hover:bg-violet-700">
                              Start
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                    {activeUnitAssignments.map((a) => {
                      const aTyped = a as unknown as { id: number; title: string; description?: string | null; dueDate: string; maxScore: number };
                      return (
                        <div key={aTyped.id} className="rounded-xl border border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/10 shadow-sm p-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/40">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-100 text-blue-700 border-0">Assignment</Badge>
                              <span className="text-xs text-muted-foreground">Due: {new Date(aTyped.dueDate).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm font-semibold truncate">{aTyped.title}</p>
                            {aTyped.description && <p className="text-xs text-muted-foreground truncate">{aTyped.description}</p>}
                            <p className="text-xs text-muted-foreground">Max score: {aTyped.maxScore}</p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Unassigned lessons (no unit) */}
        {unassigned.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
              Other Lessons
            </h3>
            <div className="space-y-2">
              {unassigned.map((l, i) => renderLesson(l, i))}
            </div>
          </div>
        )}

        {/* Course quizzes (all) */}
        {quizzes.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />Quizzes
            </h3>
            <div className="space-y-2">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-card rounded-xl border shadow-sm p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-violet-100 text-violet-700 border-0">
                          <Zap className="w-2.5 h-2.5 mr-0.5" />Quiz
                        </Badge>
                        {quiz.timeLimitMinutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Timer className="w-3 h-3" />{quiz.timeLimitMinutes} min
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold">{quiz.title}</p>
                      {(quiz as unknown as { description?: string }).description && (
                        <p className="text-xs text-muted-foreground truncate">{(quiz as unknown as { description?: string }).description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{quiz.questionCount} question{quiz.questionCount !== 1 ? "s" : ""}</p>
                    </div>
                    <Link href={`/student/quizzes/${quiz.id}?enrollmentId=${course.enrollmentId}&studentEmail=${encodeURIComponent(email)}&studentName=${encodeURIComponent(student?.name ?? email)}`}>
                      <Button size="sm" className="shrink-0 gap-1.5 text-xs h-8">
                        <Play className="w-3 h-3" />Start
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course assignments */}
        {assignments.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />Assignments
            </h3>
            <div className="space-y-2">
              {assignments.map((a) => {
                const isSubmitted = !!a.submission;
                const draftContent = submitting[a.id] ?? "";
                const isWriting = a.id in submitting;
                return (
                  <div key={a.id} className={cn(
                    "bg-card rounded-xl border shadow-sm p-4 space-y-3",
                    isSubmitted && "border-green-500/30 bg-green-50/40 dark:bg-green-950/10"
                  )}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-100 text-blue-700 border-0">
                            <Pencil className="w-2.5 h-2.5 mr-0.5" />Assignment
                          </Badge>
                          {isSubmitted && (
                            <Badge className="text-[10px] h-4 px-1.5 bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/10" variant="outline">
                              <CheckCheck className="w-2.5 h-2.5 mr-0.5" />Submitted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold">{a.title}</p>
                        {(a as unknown as { description?: string }).description && (
                          <p className="text-xs text-muted-foreground truncate">{(a as unknown as { description?: string }).description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Due: {format(new Date(a.dueDate), "MMM d, yyyy")} · Max: {a.maxScore}</p>
                      </div>
                      {!isSubmitted && !isWriting && (
                        <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs h-8"
                          onClick={() => setSubmitting((prev) => ({ ...prev, [a.id]: "" }))}>
                          <Send className="w-3 h-3" />Submit
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
                      </div>
                    )}

                    {isWriting && !isSubmitted && (
                      <div className="space-y-2">
                        <Textarea placeholder="Write your answer here…" rows={4} className="text-sm"
                          value={draftContent}
                          onChange={(e) => setSubmitting((prev) => ({ ...prev, [a.id]: e.target.value }))} />
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1.5 text-xs" disabled={!draftContent.trim()}
                            onClick={() => handleSubmitAssignment(a.id)}>
                            <Send className="w-3 h-3" />Submit Answer
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs"
                            onClick={() => setSubmitting((prev) => { const n = { ...prev }; delete n[a.id]; return n; })}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── My Grades tab ─────────────────────────────────────────────────────────

  function GradesPanel() {
    const hasAny = quizAttempts.length > 0 || assignments.length > 0;

    if (!hasAny) {
      return <EmptyState icon={<Award />} message="No graded items yet. Complete quizzes and assignments to see your scores here." />;
    }

    return (
      <div className="space-y-6">
        {/* Quiz scores */}
        {quizAttempts.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold">Quizzes</h2>
            </div>
            <div className="space-y-2">
              {quizAttempts.map((row) => {
                const { attempt } = row;
                const pct = attempt && attempt.score !== null
                  ? Math.round((attempt.score / attempt.maxScore) * 100)
                  : null;

                return (
                  <div key={row.quizId} className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-violet-100 text-violet-700 border-0">
                            <Zap className="w-2.5 h-2.5 mr-0.5" />Quiz
                          </Badge>
                          {row.timeLimitMinutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Timer className="w-3 h-3" />{row.timeLimitMinutes} min
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold">{row.quizTitle}</p>
                        {attempt && attempt.submittedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Submitted {formatDistanceToNow(new Date(attempt.submittedAt), { addSuffix: true })}
                          </p>
                        )}
                        {attempt?.feedback && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{attempt.feedback}"</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {!attempt ? (
                          <span className="text-sm text-muted-foreground">Not taken</span>
                        ) : attempt.score === null ? (
                          <span className="text-sm text-muted-foreground">Pending</span>
                        ) : (
                          <>
                            <span className={cn("text-lg font-bold", pct! >= 70 ? "text-green-600" : pct! >= 50 ? "text-yellow-600" : "text-red-500")}>
                              {attempt.score}/{attempt.maxScore}
                            </span>
                            <div className="text-xs text-muted-foreground">{pct}%</div>
                          </>
                        )}
                      </div>
                    </div>
                    {attempt && attempt.score !== null && (
                      <div className="mt-2">
                        <Progress value={pct ?? 0} className="h-1.5 rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Assignment scores */}
        {assignments.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold">Assignments</h2>
            </div>
            <div className="space-y-2">
              {assignments.map((a) => {
                const sub = a.submission;
                const hasScore = sub && sub.score !== undefined && sub.score !== null;
                const pct = hasScore ? Math.round((sub!.score! / a.maxScore) * 100) : null;
                const overdue = !sub && isPast(new Date(a.dueDate));

                return (
                  <div key={a.id} className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-100 text-blue-700 border-0">
                            <Pencil className="w-2.5 h-2.5 mr-0.5" />Assignment
                          </Badge>
                          {!sub && !overdue && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">Not submitted</Badge>
                          )}
                          {overdue && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-red-600 border-red-300">
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />Missing
                            </Badge>
                          )}
                          {sub && !hasScore && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-blue-600 border-blue-300">
                              <CheckCheck className="w-2.5 h-2.5 mr-0.5" />Awaiting grade
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due {format(new Date(a.dueDate), "MMM d, yyyy")}
                        </p>
                        {sub?.feedback && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{sub.feedback}"</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {hasScore ? (
                          <>
                            <span className={cn("text-lg font-bold", pct! >= 70 ? "text-green-600" : pct! >= 50 ? "text-yellow-600" : "text-red-500")}>
                              {sub!.score}/{a.maxScore}
                            </span>
                            <div className="text-xs text-muted-foreground">{pct}%</div>
                          </>
                        ) : sub ? (
                          <span className="text-sm text-muted-foreground">—/{a.maxScore}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—/{a.maxScore}</span>
                        )}
                      </div>
                    </div>
                    {hasScore && (
                      <div className="mt-2">
                        <Progress value={pct ?? 0} className="h-1.5 rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ── Instructors tab ────────────────────────────────────────────────────────

  function InstructorsPanel() {
    const name = course.instructor;
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
      <div className="max-w-lg space-y-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-base font-bold">{name}</p>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Lead Instructor</Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />Course instructor
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Teaching <span className="font-semibold">{course.title}</span> · {course.category} · {course.level} level
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground px-1">
          Contact your instructor through the discussion board or your institution's messaging system.
        </p>
      </div>
    );
  }

  // ── Shell ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-4">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground"
            onClick={() => setLocation("/student/courses")}>
            <ArrowLeft className="w-4 h-4" />Back to Courses
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                <Badge variant="outline" className={cn("text-xs",
                  course.status === "completed" ? "text-green-600 border-green-500/50" : "text-blue-600 border-blue-500/50"
                )}>{course.status}</Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{course.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-muted/60 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">Module Progress</span>
              <span className="font-bold text-primary">{course.progressPercent}%</span>
            </div>
            <Progress value={course.progressPercent} className="h-3 rounded-full" />
            <p className="text-xs text-muted-foreground">{completedCount} of {lessons.length} lessons completed</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b -mb-[1px] overflow-x-auto">
            {TAB_DEFS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  "px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
                  activeTab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
        {activeTab === "stream"      && StreamPanel()}
        {activeTab === "curriculum"  && CurriculumPanel()}
        {activeTab === "grades"      && GradesPanel()}
        {activeTab === "instructors" && InstructorsPanel()}
      </div>
    </div>
  );
}

// ── Shared empty state ─────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="bg-card border rounded-xl p-12 text-center flex flex-col items-center gap-3">
      <div className="w-10 h-10 text-muted-foreground [&>svg]:w-10 [&>svg]:h-10">{icon}</div>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
  );
}
