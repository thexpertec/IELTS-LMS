import { useState } from "react";
import { useGetStudentAssignments, useSubmitAssignment } from "@workspace/api-client-react";
import { useStudent } from "@/context/student-context";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, CheckCircle, Clock, AlertCircle, Send, ChevronDown, ChevronUp, Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow, isPast } from "date-fns";

function getQueryKey(params: { email: string }) {
  return ["getStudentAssignments", params];
}

export default function Assignments() {
  const { student } = useStudent();
  const email = student?.email ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [expanded, setExpanded] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  const { data: assignments, isLoading } = useGetStudentAssignments(
    { email },
    { query: { enabled: !!email } }
  );
  const submitMutation = useSubmitAssignment();

  const pending = assignments?.filter((a) => !a.submission) ?? [];
  const submitted = assignments?.filter((a) => !!a.submission) ?? [];
  const overdue = pending.filter((a) => isPast(new Date(a.dueDate)));

  const handleSubmit = async (assignmentId: number, enrollmentId: number) => {
    const content = answers[assignmentId]?.trim();
    if (!content || !student) return;
    setSubmitting(assignmentId);
    try {
      await submitMutation.mutateAsync({
        id: assignmentId,
        data: { email: student.email, enrollmentId, content },
      });
      await queryClient.invalidateQueries({ queryKey: ["getStudentAssignments"] });
      setExpanded(null);
      toast({ title: "Submitted!", description: "Your answer has been recorded." });
    } catch {
      toast({ title: "Error", description: "Could not submit. Try again.", variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  const AssignmentCard = ({ assignment, showSubmission = false }: { assignment: NonNullable<typeof assignments>[0]; showSubmission?: boolean }) => {
    const due = new Date(assignment.dueDate);
    const isOverdue = isPast(due);
    const isExpanded = expanded === assignment.id;
    const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <Card className={isOverdue && !assignment.submission ? "border-destructive/50" : ""}>
        <CardContent className="p-0">
          <div
            className="flex items-start gap-3 p-4 cursor-pointer select-none"
            onClick={() => setExpanded(isExpanded ? null : assignment.id)}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              assignment.submission ? "bg-green-500/10" : isOverdue ? "bg-destructive/10" : "bg-primary/10"
            }`}>
              {assignment.submission ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : isOverdue ? (
                <AlertCircle className="w-4 h-4 text-destructive" />
              ) : (
                <FileText className="w-4 h-4 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <Badge variant="outline" className="text-xs">{assignment.type}</Badge>
                <Badge variant="secondary" className="text-xs">{assignment.courseTitle}</Badge>
              </div>
              <h3 className="font-semibold text-sm">{assignment.title}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isPast(due) ? "Was due" : "Due"} {formatDistanceToNow(due, { addSuffix: true })}
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {assignment.maxScore} pts
                </div>
              </div>
            </div>

            {assignment.submission?.score !== undefined ? (
              <Badge className="bg-green-500 text-white flex-shrink-0">
                {assignment.submission.score}/{assignment.maxScore}
              </Badge>
            ) : !assignment.submission && !isOverdue ? (
              <Badge variant="secondary" className="flex-shrink-0 text-xs">
                {daysLeft}d left
              </Badge>
            ) : isOverdue && !assignment.submission ? (
              <Badge variant="destructive" className="flex-shrink-0 text-xs">Overdue</Badge>
            ) : null}

            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
          </div>

          {isExpanded && (
            <div className="px-4 pb-4 border-t">
              <div className="pt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Due: {format(due, "PPP p")}
                </div>

                {assignment.submission ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm font-semibold text-green-600 mb-1">Your Submission</p>
                      <p className="text-sm text-muted-foreground">{assignment.submission.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted {format(new Date(assignment.submission.submittedAt), "PPP")}
                      </p>
                    </div>
                    {assignment.submission.feedback && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm font-semibold mb-1">Instructor Feedback</p>
                        <p className="text-sm text-muted-foreground">{assignment.submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Your Answer</h4>
                    <Textarea
                      placeholder={`Write your ${assignment.type === "quiz" ? "answers" : "submission"} here...`}
                      rows={4}
                      className="text-sm resize-none"
                      value={answers[assignment.id] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => handleSubmit(assignment.id, (assignment as any).enrollmentId ?? 0)}
                      disabled={!answers[assignment.id]?.trim() || submitting === assignment.id}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting === assignment.id ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments & Quizzes</h1>
        <p className="text-muted-foreground mt-1">Complete your pending work and review past submissions.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{pending.length}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{submitted.length}</p>
            <p className="text-sm text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{overdue.length}</p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="submitted" className="gap-2">
            Submitted ({submitted.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-lg">All done!</p>
                <p className="text-muted-foreground text-sm">No pending assignments or quizzes.</p>
              </CardContent>
            </Card>
          ) : (
            pending.map((a) => <AssignmentCard key={a.id} assignment={a} />)
          )}
        </TabsContent>

        <TabsContent value="submitted" className="mt-4 space-y-3">
          {submitted.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No submissions yet.</p>
              </CardContent>
            </Card>
          ) : (
            submitted.map((a) => <AssignmentCard key={a.id} assignment={a} showSubmission />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
