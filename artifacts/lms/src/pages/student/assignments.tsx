import { useState } from "react";
import { useGetStudentAssignments, useSubmitAssignment } from "@workspace/api-client-react";
import { useStudent } from "@/context/student-context";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, CheckCircle, Clock, AlertCircle, Send, ChevronDown, ChevronUp, Award,
  Link2, Plus, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  const [submissionLinks, setSubmissionLinks] = useState<Record<number, string[]>>({});
  const [linkInputs, setLinkInputs] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  const { data: assignments, isLoading } = useGetStudentAssignments(
    { email },
    { query: { enabled: !!email } }
  );
  const submitMutation = useSubmitAssignment();

  const pending = assignments?.filter((a) => !a.submission) ?? [];
  const submitted = assignments?.filter((a) => !!a.submission) ?? [];
  const overdue = pending.filter((a) => isPast(new Date(a.dueDate)));

  const addLink = (assignmentId: number) => {
    const url = (linkInputs[assignmentId] ?? "").trim();
    if (!url) return;
    const withProtocol = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    setSubmissionLinks((prev) => ({
      ...prev,
      [assignmentId]: [...(prev[assignmentId] ?? []).filter((l) => l !== withProtocol), withProtocol],
    }));
    setLinkInputs((prev) => ({ ...prev, [assignmentId]: "" }));
  };

  const removeLink = (assignmentId: number, idx: number) => {
    setSubmissionLinks((prev) => ({
      ...prev,
      [assignmentId]: (prev[assignmentId] ?? []).filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (assignmentId: number, enrollmentId: number) => {
    const content = answers[assignmentId]?.trim() ?? "";
    const links = submissionLinks[assignmentId] ?? [];
    if (!content && links.length === 0) {
      toast({ title: "Nothing to submit", description: "Write a response or attach at least one link.", variant: "destructive" });
      return;
    }
    if (!student) return;
    setSubmitting(assignmentId);
    try {
      await submitMutation.mutateAsync({
        id: assignmentId,
        data: { email: student.email, enrollmentId, content: content || " ", submissionLinks: links } as any,
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
    const attachedLinks: string[] = ((assignment as any).attachedLinks as string[]) ?? [];
    const links = submissionLinks[assignment.id] ?? [];

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
                {attachedLinks.length > 0 && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Link2 className="w-2.5 h-2.5" />
                    {attachedLinks.length} link{attachedLinks.length > 1 ? "s" : ""}
                  </Badge>
                )}
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

                {/* Admin reference links */}
                {attachedLinks.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold">Reference Links</h4>
                    {attachedLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20 text-sm text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{link}</span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Due: {format(due, "PPP p")}
                </div>

                {assignment.submission ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm font-semibold text-green-600 mb-1">Your Submission</p>
                      {assignment.submission.content && assignment.submission.content.trim() && (
                        <p className="text-sm text-muted-foreground">{assignment.submission.content}</p>
                      )}
                      {((assignment.submission as any).submissionLinks as string[] | undefined)?.length ? (
                        <div className="mt-2 space-y-1">
                          {((assignment.submission as any).submissionLinks as string[]).map((link: string, i: number) => (
                            <a
                              key={i}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              <Link2 className="w-3 h-3" />
                              <span className="truncate">{link}</span>
                            </a>
                          ))}
                        </div>
                      ) : null}
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
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Your Answer</h4>
                      <Textarea
                        placeholder={`Write your ${assignment.type === "quiz" ? "answers" : "submission"} here... (optional if you attach links)`}
                        rows={4}
                        className="text-sm resize-none"
                        value={answers[assignment.id] ?? ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                      />
                    </div>

                    {/* Student submission links */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Attach Links <span className="font-normal text-muted-foreground">(optional)</span></h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://docs.google.com/…"
                          value={linkInputs[assignment.id] ?? ""}
                          onChange={(e) => setLinkInputs((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(assignment.id); } }}
                          className="text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addLink(assignment.id)}
                          className="gap-1 flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </Button>
                      </div>
                      {links.length > 0 && (
                        <div className="space-y-1.5">
                          {links.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border text-sm">
                              <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="flex-1 truncate text-primary">{link}</span>
                              <button type="button" onClick={() => removeLink(assignment.id, idx)} className="text-muted-foreground hover:text-destructive">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => handleSubmit(assignment.id, (assignment as any).enrollmentId ?? 0)}
                      disabled={
                        (!answers[assignment.id]?.trim() && links.length === 0) ||
                        submitting === assignment.id
                      }
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
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
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
