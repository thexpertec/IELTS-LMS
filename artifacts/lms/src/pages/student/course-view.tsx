import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetStudentCourseDetail,
  useStudentCompleteLesson,
  useListDiscussions,
  usePostDiscussion,
  getGetStudentCourseDetailQueryKey,
  getListDiscussionsQueryKey,
} from "@workspace/api-client-react";
import { useStudent } from "@/context/student-context";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, CheckCircle, Circle, Play, FileText, Video, BookOpen,
  Clock, MessageSquare, Send, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

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

  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: course, isLoading } = useGetStudentCourseDetail(
    courseId,
    { email },
    { query: { enabled: !!email && !!courseId } }
  );
  const { data: discussions } = useListDiscussions(
    { courseId },
    { query: { enabled: !!courseId } }
  );
  const completeLesson = useStudentCompleteLesson();
  const postDiscussion = usePostDiscussion();

  const handleToggleLesson = async (lessonId: number, isCompleted: boolean) => {
    if (!course) return;
    try {
      await completeLesson.mutateAsync({
        lessonId,
        data: { enrollmentId: course.enrollmentId, completed: !isCompleted },
      });
      await queryClient.invalidateQueries({
        queryKey: getGetStudentCourseDetailQueryKey(courseId, { email }),
      });
    } catch {
      toast({ title: "Error", description: "Could not update progress.", variant: "destructive" });
    }
  };

  const handlePostDiscussion = async () => {
    if (!student || !newMessage.trim()) return;
    setPosting(true);
    try {
      await postDiscussion.mutateAsync({
        data: {
          courseId,
          studentEmail: student.email,
          studentName: student.displayName,
          content: newMessage.trim(),
        },
      });
      setNewMessage("");
      await queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey({ courseId }) });
      toast({ title: "Posted!", description: "Your message was added to the discussion." });
    } catch {
      toast({ title: "Error", description: "Could not post message.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground">Course not found or you are not enrolled.</p>
        <Link href="/student/courses">
          <Button className="mt-4" variant="outline">Go to My Courses</Button>
        </Link>
      </div>
    );
  }

  const completedCount = course.lessons.filter((l) => l.isCompleted).length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/student/courses">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="secondary">{course.category}</Badge>
          <Badge variant="outline" className={course.status === "completed" ? "text-green-500 border-green-500/50" : "text-blue-500 border-blue-500/50"}>
            {course.status}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
        <p className="text-sm text-muted-foreground">Instructor: <span className="font-medium text-foreground">{course.instructor}</span></p>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{completedCount} of {course.lessons.length} lessons completed</span>
              <span className="font-semibold">{course.progressPercent}%</span>
            </div>
            <Progress value={course.progressPercent} className="h-2.5" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-semibold">Course Content</h2>
          {course.lessons.map((lesson, idx) => {
            const Icon = lessonIcon(lesson.type);
            const isExpanded = expandedLesson === lesson.id;

            return (
              <Card
                key={lesson.id}
                className={`transition-all ${lesson.isCompleted ? "border-green-500/30 bg-green-500/5" : ""}`}
              >
                <CardContent className="p-0">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer select-none"
                    onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                  >
                    <button
                      className="flex-shrink-0 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLesson(lesson.id, lesson.isCompleted);
                      }}
                      title={lesson.isCompleted ? "Mark incomplete" : "Mark complete"}
                    >
                      {lesson.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>

                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                        <span className="font-medium text-sm truncate">{lesson.title}</span>
                      </div>
                      {lesson.duration > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                        </div>
                      )}
                    </div>

                    <Badge variant="outline" className="text-xs capitalize flex-shrink-0">{lesson.type}</Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t">
                      <div className="pt-4 space-y-3">
                        <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        <Separator />
                        <div className="prose prose-sm max-w-none text-sm">
                          <p className="text-foreground">{lesson.content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={lesson.isCompleted ? "outline" : "default"}
                          className="gap-2"
                          onClick={() => handleToggleLesson(lesson.id, lesson.isCompleted)}
                        >
                          {lesson.isCompleted ? (
                            <><Circle className="w-3.5 h-3.5" />Mark Incomplete</>
                          ) : (
                            <><CheckCircle className="w-3.5 h-3.5" />Mark Complete</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Discussion ({discussions?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {discussions?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Be the first to start a discussion!
                  </p>
                ) : (
                  discussions?.map((d) => (
                    <div key={d.id} className="flex gap-2.5">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {d.studentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-semibold">{d.studentName}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(d.createdAt), "MMM d")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 break-words">{d.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="Join the discussion..."
                  className="text-sm resize-none"
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={handlePostDiscussion}
                  disabled={!newMessage.trim() || posting}
                >
                  <Send className="w-3.5 h-3.5" />
                  {posting ? "Posting..." : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
