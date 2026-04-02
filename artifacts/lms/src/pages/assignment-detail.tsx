import { useState } from "react";
import {
  useGetAssignment, useUpdateAssignment, useMarkSubmission,
  useDeleteAssignment, getGetAssignmentQueryKey, getListAssignmentsQueryKey,
  useListCourses,
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";
import {
  ArrowLeft, Award, CheckCircle, Clock, Edit2, FileText, Save, Trash2, User, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AdminSubmission = {
  id: number;
  assignmentId: number;
  enrollmentId: number;
  studentEmail: string;
  studentName?: string | null;
  content: string;
  score?: number | null;
  feedback?: string | null;
  submittedAt: string;
};

function MarkingPanel({
  sub, maxScore, assignmentId, onDone,
}: { sub: AdminSubmission; maxScore: number; assignmentId: number; onDone: () => void }) {
  const [score, setScore] = useState<string>(sub.score != null ? String(sub.score) : "");
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const markMutation = useMarkSubmission({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAssignmentQueryKey(assignmentId) });
        toast({ title: "Marks saved" });
        onDone();
      },
      onError: () => toast({ title: "Failed to save marks", variant: "destructive" }),
    },
  });

  const handleSave = () => {
    markMutation.mutate({
      id: assignmentId,
      subId: sub.id,
      data: {
        score: score !== "" ? Number(score) : undefined,
        feedback: feedback || undefined,
      },
    });
  };

  return (
    <div className="border rounded-lg bg-muted/30 p-4 space-y-3 mt-3">
      <p className="text-sm font-semibold">Mark Submission</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Score (out of {maxScore})</Label>
          <Input
            type="number"
            min={0}
            max={maxScore}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder={`0–${maxScore}`}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Feedback for student</Label>
        <Textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback shown to the student after marking…"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="gap-1.5" disabled={markMutation.isPending} onClick={handleSave}>
          <Save className="w-3.5 h-3.5" />
          {markMutation.isPending ? "Saving…" : "Save Marks"}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SubmissionCard({ sub, maxScore, assignmentId }: { sub: AdminSubmission; maxScore: number; assignmentId: number }) {
  const [marking, setMarking] = useState(false);
  const isMarked = sub.score != null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{sub.studentName ?? sub.studentEmail}</p>
              {sub.studentName && (
                <span className="text-xs text-muted-foreground">{sub.studentEmail}</span>
              )}
              {isMarked ? (
                <Badge className="bg-green-500 text-white ml-auto flex-shrink-0">
                  {sub.score}/{maxScore}
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-auto flex-shrink-0 text-xs">Unmarked</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted {format(new Date(sub.submittedAt), "PPP 'at' p")}
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {sub.content}
        </div>

        {sub.feedback && (
          <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm">
            <p className="font-semibold text-primary text-xs mb-1">Feedback</p>
            <p className="text-muted-foreground">{sub.feedback}</p>
          </div>
        )}

        {!marking && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMarking(true)}>
            <Edit2 className="w-3.5 h-3.5" />
            {isMarked ? "Edit Marks" : "Mark"}
          </Button>
        )}

        {marking && (
          <MarkingPanel sub={sub} maxScore={maxScore} assignmentId={assignmentId} onDone={() => setMarking(false)} />
        )}
      </CardContent>
    </Card>
  );
}

export default function AssignmentDetail() {
  const { id: idStr } = useParams();
  const id = Number(idStr);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: courses } = useListCourses();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDueTime, setEditDueTime] = useState("23:59");
  const [editMaxScore, setEditMaxScore] = useState("");
  const [editType, setEditType] = useState<"assignment" | "quiz">("assignment");
  const [editCourseId, setEditCourseId] = useState("");

  const { data: assignment, isLoading } = useGetAssignment(id, {
    query: { enabled: !!id },
  });

  const updateAssignment = useUpdateAssignment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAssignmentQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        toast({ title: "Assignment updated" });
        setEditing(false);
      },
      onError: () => toast({ title: "Failed to update assignment", variant: "destructive" }),
    },
  });

  const deleteAssignment = useDeleteAssignment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        toast({ title: "Assignment deleted" });
        setLocation("/assignments");
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    },
  });

  const startEdit = () => {
    if (!assignment) return;
    const due = new Date(assignment.dueDate);
    setEditTitle(assignment.title);
    setEditDesc(assignment.description ?? "");
    const yyyy = due.getFullYear();
    const mm = String(due.getMonth() + 1).padStart(2, "0");
    const dd = String(due.getDate()).padStart(2, "0");
    setEditDueDate(`${yyyy}-${mm}-${dd}`);
    const hh = String(due.getHours()).padStart(2, "0");
    const min = String(due.getMinutes()).padStart(2, "0");
    setEditDueTime(`${hh}:${min}`);
    setEditMaxScore(String(assignment.maxScore));
    setEditType(assignment.type as "assignment" | "quiz");
    setEditCourseId(String(assignment.courseId));
    setEditing(true);
  };

  const handleSaveEdit = () => {
    const dueDatetime = new Date(`${editDueDate}T${editDueTime}:00`).toISOString();
    updateAssignment.mutate({
      id,
      data: {
        title: editTitle,
        description: editDesc,
        dueDate: dueDatetime,
        maxScore: Number(editMaxScore),
        type: editType,
        courseId: Number(editCourseId),
      },
    });
  };

  if (isLoading || !assignment) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  const due = new Date(assignment.dueDate);
  const overdue = isPast(due);
  const unmarked = assignment.submissions.filter((s: AdminSubmission) => s.score == null).length;
  const marked = assignment.submissions.filter((s: AdminSubmission) => s.score != null).length;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 mb-4 text-muted-foreground"
          onClick={() => setLocation("/assignments")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assignments
        </Button>

        {!editing ? (
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge variant="secondary" className="capitalize">{assignment.type}</Badge>
                {assignment.courseTitle && <Badge variant="outline">{assignment.courseTitle}</Badge>}
                {overdue && <Badge variant="destructive">Overdue</Badge>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
              {assignment.description && (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{assignment.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Due {format(due, "PPP 'at' p")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  {assignment.maxScore} points max
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {assignment.submissionCount} submission{assignment.submissionCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={startEdit}>
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure? All student submissions will also be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteAssignment.mutate({ id })}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">Course</Label>
                <Select value={editCourseId} onValueChange={setEditCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Description / Instructions</Label>
                <Textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Type</Label>
                  <Select value={editType} onValueChange={(v) => setEditType(v as "assignment" | "quiz")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Max Score</Label>
                  <Input type="number" min={1} value={editMaxScore} onChange={(e) => setEditMaxScore(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Due Date</Label>
                  <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Due Time</Label>
                  <Input type="time" value={editDueTime} onChange={(e) => setEditDueTime(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateAssignment.isPending} className="gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  {updateAssignment.isPending ? "Saving…" : "Save Changes"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Submissions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {marked} marked · {unmarked} pending
            </p>
          </div>
          {assignment.submissions.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-500" />
                {marked} marked
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Clock className="w-3 h-3 text-amber-500" />
                {unmarked} unmarked
              </Badge>
            </div>
          )}
        </div>

        {assignment.submissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No submissions yet</p>
              <p className="text-sm text-muted-foreground">Students will appear here once they submit.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignment.submissions.map((sub: AdminSubmission) => (
              <SubmissionCard
                key={sub.id}
                sub={sub}
                maxScore={assignment.maxScore}
                assignmentId={id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
