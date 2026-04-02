import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users, ClipboardList, ArrowUpDown, Check, X, Pencil,
} from "lucide-react";

type Enrollment = {
  id: number;
  studentEmail: string;
  studentName: string;
  status: string;
};

type Assignment = {
  id: number;
  title: string;
  dueDate: string;
  maxScore: number;
  createdAt: string;
};

type Submission = {
  id: number;
  assignmentId: number;
  enrollmentId: number;
  studentEmail: string;
  content: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
};

type GradebookData = {
  enrollments: Enrollment[];
  assignments: Assignment[];
  submissions: Submission[];
};

type EditingCell = {
  enrollmentId: number;
  assignmentId: number;
  studentEmail: string;
  currentScore: string;
  currentFeedback: string;
};

async function fetchGradebook(courseId: number): Promise<GradebookData> {
  const res = await fetch(`/api/courses/${courseId}/gradebook`);
  if (!res.ok) throw new Error("Failed to fetch gradebook");
  return res.json();
}

async function saveGrade(
  assignmentId: number,
  enrollmentId: number,
  studentEmail: string,
  score: number | null,
  feedback: string
): Promise<Submission> {
  const res = await fetch(`/api/assignments/${assignmentId}/grade`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enrollmentId, studentEmail, score, feedback }),
  });
  if (!res.ok) throw new Error("Failed to save grade");
  return res.json();
}

function classAverage(
  assignment: Assignment,
  submissions: Submission[]
): string {
  const graded = submissions.filter(
    (s) => s.assignmentId === assignment.id && s.score !== null
  );
  if (graded.length === 0) return "—";
  const avg = graded.reduce((sum, s) => sum + (s.score ?? 0), 0) / graded.length;
  return avg % 1 === 0 ? String(avg) : avg.toFixed(1);
}

export function GradesTab({ courseId }: { courseId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sortAsc, setSortAsc] = useState(true);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const scoreInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<GradebookData>({
    queryKey: ["gradebook", courseId],
    queryFn: () => fetchGradebook(courseId),
  });

  const mutation = useMutation({
    mutationFn: ({
      assignmentId,
      enrollmentId,
      studentEmail,
      score,
      feedback,
    }: {
      assignmentId: number;
      enrollmentId: number;
      studentEmail: string;
      score: number | null;
      feedback: string;
    }) => saveGrade(assignmentId, enrollmentId, studentEmail, score, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradebook", courseId] });
      setEditing(null);
      toast({ title: "Grade saved" });
    },
    onError: () => {
      toast({ title: "Failed to save grade", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (editing) scoreInputRef.current?.focus();
  }, [editing]);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { assignments, submissions } = data;
  const enrollments = sortAsc
    ? [...data.enrollments].sort((a, b) => a.studentName.localeCompare(b.studentName))
    : [...data.enrollments].sort((a, b) => b.studentName.localeCompare(a.studentName));

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card">
        <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-base font-semibold">No assignments yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create assignments for this course to start grading.
        </p>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card">
        <Users className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-base font-semibold">No students enrolled</p>
        <p className="text-sm text-muted-foreground mt-1">
          Enroll students in this course to grade them.
        </p>
      </div>
    );
  }

  function getSubmission(enrollmentId: number, assignmentId: number) {
    return submissions.find(
      (s) => s.enrollmentId === enrollmentId && s.assignmentId === assignmentId
    ) ?? null;
  }

  function cellStatus(
    sub: Submission | null,
    assignment: Assignment
  ): "graded" | "submitted" | "missing" | "empty" {
    if (sub && sub.score !== null) return "graded";
    if (sub) return "submitted";
    if (isPast(new Date(assignment.dueDate))) return "missing";
    return "empty";
  }

  function startEdit(enrollment: Enrollment, assignment: Assignment) {
    const sub = getSubmission(enrollment.id, assignment.id);
    setEditing({
      enrollmentId: enrollment.id,
      assignmentId: assignment.id,
      studentEmail: enrollment.studentEmail,
      currentScore: sub?.score !== null && sub?.score !== undefined ? String(sub.score) : "",
      currentFeedback: sub?.feedback ?? "",
    });
  }

  function saveEdit() {
    if (!editing) return;
    const scoreVal = editing.currentScore.trim();
    const score = scoreVal === "" ? null : Number(scoreVal);
    mutation.mutate({
      assignmentId: editing.assignmentId,
      enrollmentId: editing.enrollmentId,
      studentEmail: editing.studentEmail,
      score,
      feedback: editing.currentFeedback,
    });
  }

  const COL_W = 160;
  const NAME_COL_W = 220;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} &middot;{" "}
          {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-auto rounded-xl border shadow-sm bg-card">
        <table className="text-sm border-collapse" style={{ minWidth: NAME_COL_W + assignments.length * COL_W }}>
          <thead>
            {/* ── Assignment header row ── */}
            <tr className="border-b bg-muted/40">
              {/* Sort by name column */}
              <th
                className="sticky left-0 z-20 bg-muted/40 text-left px-4 py-3 border-r font-medium whitespace-nowrap"
                style={{ width: NAME_COL_W, minWidth: NAME_COL_W }}
              >
                <button
                  className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  onClick={() => setSortAsc((p) => !p)}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort by name
                </button>
              </th>

              {/* One column per assignment */}
              {assignments.map((a) => (
                <th
                  key={a.id}
                  className="px-3 py-2 border-r text-left font-normal align-top"
                  style={{ width: COL_W, minWidth: COL_W }}
                >
                  <div className="text-[11px] text-muted-foreground">
                    {format(new Date(a.dueDate), "MMM d, yyyy")}
                  </div>
                  <div className="text-[13px] font-semibold text-primary line-clamp-2 leading-tight mt-0.5">
                    {a.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    out of {a.maxScore}
                  </div>
                </th>
              ))}
            </tr>

            {/* ── Class average row ── */}
            <tr className="border-b bg-muted/20">
              <td
                className="sticky left-0 z-20 bg-muted/20 px-4 py-2.5 border-r"
                style={{ width: NAME_COL_W, minWidth: NAME_COL_W }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted border flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold">Class average</span>
                </div>
              </td>
              {assignments.map((a) => (
                <td key={a.id} className="px-3 py-2.5 border-r text-sm font-semibold text-foreground">
                  {classAverage(a, submissions)}
                </td>
              ))}
            </tr>
          </thead>

          <tbody>
            {enrollments.map((enrollment, rowIdx) => {
              const initials = enrollment.studentName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <tr
                  key={enrollment.id}
                  className={cn(
                    "border-b hover:bg-muted/20 transition-colors",
                    rowIdx % 2 === 0 ? "bg-card" : "bg-muted/5"
                  )}
                >
                  {/* Student name column */}
                  <td
                    className={cn(
                      "sticky left-0 z-10 px-4 py-2.5 border-r",
                      rowIdx % 2 === 0 ? "bg-card" : "bg-muted/5"
                    )}
                    style={{ width: NAME_COL_W, minWidth: NAME_COL_W }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-primary">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{enrollment.studentName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{enrollment.studentEmail}</div>
                      </div>
                    </div>
                  </td>

                  {/* Score cells */}
                  {assignments.map((assignment) => {
                    const sub = getSubmission(enrollment.id, assignment.id);
                    const status = cellStatus(sub, assignment);
                    const isEditing =
                      editing?.enrollmentId === enrollment.id &&
                      editing?.assignmentId === assignment.id;

                    return (
                      <td
                        key={assignment.id}
                        className={cn(
                          "px-2 py-1.5 border-r align-top relative",
                          !isEditing && "cursor-pointer hover:bg-primary/5"
                        )}
                        style={{ width: COL_W, minWidth: COL_W }}
                        onClick={() => {
                          if (!isEditing) startEdit(enrollment, assignment);
                        }}
                      >
                        {isEditing ? (
                          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Input
                                ref={scoreInputRef}
                                type="number"
                                min={0}
                                max={assignment.maxScore}
                                className="h-7 w-20 text-xs px-2"
                                placeholder={`/${assignment.maxScore}`}
                                value={editing.currentScore}
                                onChange={(e) =>
                                  setEditing((prev) =>
                                    prev ? { ...prev, currentScore: e.target.value } : null
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit();
                                  if (e.key === "Escape") setEditing(null);
                                }}
                              />
                              <Button
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={saveEdit}
                                disabled={mutation.isPending}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0"
                                onClick={() => setEditing(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <Input
                              type="text"
                              className="h-6 text-xs px-2"
                              placeholder="Feedback (optional)"
                              value={editing.currentFeedback}
                              onChange={(e) =>
                                setEditing((prev) =>
                                  prev ? { ...prev, currentFeedback: e.target.value } : null
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div className="group flex items-start justify-between gap-1">
                            <div>
                              {status === "graded" && (
                                <>
                                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    {sub!.score}/{assignment.maxScore}
                                  </div>
                                  {sub!.feedback && (
                                    <div className="text-[10px] text-muted-foreground line-clamp-1">
                                      {sub!.feedback}
                                    </div>
                                  )}
                                </>
                              )}
                              {status === "submitted" && (
                                <>
                                  <div className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-blue-500">—</span>
                                    <span className="text-muted-foreground">/{assignment.maxScore}</span>
                                  </div>
                                  <div className="text-[10px] text-blue-500">Submitted</div>
                                </>
                              )}
                              {status === "missing" && (
                                <>
                                  <div className="text-sm font-semibold text-muted-foreground">0</div>
                                  <div className="text-[10px] text-red-500 font-medium">Missing</div>
                                </>
                              )}
                              {status === "empty" && (
                                <div className="text-sm text-muted-foreground">
                                  <span className="text-muted-foreground/40">—</span>
                                  <span className="text-muted-foreground/40">/{assignment.maxScore}</span>
                                </div>
                              )}
                            </div>
                            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0 mt-0.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Click any cell to enter or edit a score. Press Enter to save or Esc to cancel.
      </p>
    </div>
  );
}
