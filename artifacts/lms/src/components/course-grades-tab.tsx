import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, ClipboardList, ArrowUpDown, Check, X, Pencil, Zap } from "lucide-react";

// ── Standard feedback remarks ─────────────────────────────────────────────────
const REMARK_NONE = "__none__";
const FEEDBACK_REMARKS = [
  { value: REMARK_NONE,              label: "— No remark —" },
  { value: "Excellent work!",        label: "Excellent work!" },
  { value: "Great job!",             label: "Great job!" },
  { value: "Good effort.",           label: "Good effort." },
  { value: "Well done.",             label: "Well done." },
  { value: "Satisfactory.",          label: "Satisfactory." },
  { value: "Needs improvement.",     label: "Needs improvement." },
  { value: "Incomplete submission.",  label: "Incomplete submission." },
  { value: "Please resubmit.",       label: "Please resubmit." },
  { value: "Late submission.",       label: "Late submission." },
  { value: "Missing key sections.",  label: "Missing key sections." },
  { value: "Below expectations.",    label: "Below expectations." },
];
// Convert between the sentinel and actual empty string
function feedbackToSelect(f: string) { return f === "" ? REMARK_NONE : f; }
function selectToFeedback(v: string) { return v === REMARK_NONE ? "" : v; }

// ── Types ────────────────────────────────────────────────────────────────────

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

type Quiz = {
  id: number;
  title: string;
  timeLimitMinutes: number | null;
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

type QuizAttempt = {
  id: number;
  quizId: number;
  enrollmentId: number;
  studentEmail: string;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  submittedAt: string;
};

type GradebookData = {
  enrollments: Enrollment[];
  assignments: Assignment[];
  submissions: Submission[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
};

// A unified "column" can be either an assignment or a quiz
type Column =
  | { kind: "assignment"; data: Assignment }
  | { kind: "quiz"; data: Quiz };

type EditingCell = {
  enrollmentId: number;
  columnKind: "assignment" | "quiz";
  columnId: number;
  studentEmail: string;
  currentScore: string;
  currentFeedback: string;
  maxScore: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchGradebook(courseId: number): Promise<GradebookData> {
  const res = await fetch(`/api/courses/${courseId}/gradebook`);
  if (!res.ok) throw new Error("Failed to fetch gradebook");
  return res.json();
}

async function saveAssignmentGrade(
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

async function saveQuizGrade(
  quizId: number,
  enrollmentId: number,
  studentEmail: string,
  score: number | null,
  maxScore: number,
  feedback: string
): Promise<QuizAttempt> {
  const res = await fetch(`/api/quizzes/${quizId}/grade`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enrollmentId, studentEmail, score, maxScore, feedback }),
  });
  if (!res.ok) throw new Error("Failed to save grade");
  return res.json();
}

function colAverage(
  col: Column,
  submissions: Submission[],
  quizAttempts: QuizAttempt[]
): string {
  const graded =
    col.kind === "assignment"
      ? submissions.filter((s) => s.assignmentId === col.data.id && s.score !== null)
      : quizAttempts.filter((a) => a.quizId === col.data.id && a.score !== null);
  if (graded.length === 0) return "—";
  const avg = graded.reduce((sum, s) => sum + (s.score ?? 0), 0) / graded.length;
  return avg % 1 === 0 ? String(avg) : avg.toFixed(1);
}

// ── Component ────────────────────────────────────────────────────────────────

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
    mutationFn: (cell: EditingCell & { score: number | null }) => {
      if (cell.columnKind === "assignment") {
        return saveAssignmentGrade(
          cell.columnId, cell.enrollmentId, cell.studentEmail,
          cell.score, cell.currentFeedback
        );
      } else {
        return saveQuizGrade(
          cell.columnId, cell.enrollmentId, cell.studentEmail,
          cell.score, cell.maxScore, cell.currentFeedback
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradebook", courseId] });
      setEditing(null);
      toast({ title: "Grade saved" });
    },
    onError: () => toast({ title: "Failed to save grade", variant: "destructive" }),
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

  const { assignments, submissions, quizzes, quizAttempts } = data;
  const enrollments = sortAsc
    ? [...data.enrollments].sort((a, b) => a.studentName.localeCompare(b.studentName))
    : [...data.enrollments].sort((a, b) => b.studentName.localeCompare(a.studentName));

  // Build unified column list — quizzes first (auto-graded), then assignments
  const columns: Column[] = [
    ...quizzes.map((q): Column => ({ kind: "quiz", data: q })),
    ...assignments.map((a): Column => ({ kind: "assignment", data: a })),
  ];

  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card">
        <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-base font-semibold">No quizzes or assignments yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add quizzes or assignments to this course to start grading.
        </p>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card">
        <Users className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-base font-semibold">No students enrolled</p>
        <p className="text-sm text-muted-foreground mt-1">Enroll students first to grade them.</p>
      </div>
    );
  }

  function getAssignmentSub(enrollmentId: number, assignmentId: number) {
    return submissions.find(
      (s) => s.enrollmentId === enrollmentId && s.assignmentId === assignmentId
    ) ?? null;
  }

  function getQuizAttempt(enrollmentId: number, quizId: number) {
    return quizAttempts.find(
      (a) => a.enrollmentId === enrollmentId && a.quizId === quizId
    ) ?? null;
  }

  function assignmentCellStatus(
    sub: Submission | null,
    assignment: Assignment
  ): "graded" | "submitted" | "missing" | "empty" {
    if (sub && sub.score !== null) return "graded";
    if (sub) return "submitted";
    if (isPast(new Date(assignment.dueDate))) return "missing";
    return "empty";
  }

  function startEdit(enrollment: Enrollment, col: Column) {
    if (col.kind === "assignment") {
      const sub = getAssignmentSub(enrollment.id, col.data.id);
      setEditing({
        enrollmentId: enrollment.id,
        columnKind: "assignment",
        columnId: col.data.id,
        studentEmail: enrollment.studentEmail,
        currentScore: sub?.score !== null && sub?.score !== undefined ? String(sub.score) : "",
        currentFeedback: sub?.feedback ?? "",
        maxScore: col.data.maxScore,
      });
    } else {
      const attempt = getQuizAttempt(enrollment.id, col.data.id);
      setEditing({
        enrollmentId: enrollment.id,
        columnKind: "quiz",
        columnId: col.data.id,
        studentEmail: enrollment.studentEmail,
        currentScore: attempt?.score !== null && attempt?.score !== undefined ? String(attempt.score) : "",
        currentFeedback: attempt?.feedback ?? "",
        maxScore: attempt?.maxScore ?? 100,
      });
    }
  }

  function saveEdit() {
    if (!editing) return;
    const scoreVal = editing.currentScore.trim();
    const score = scoreVal === "" ? null : Number(scoreVal);
    mutation.mutate({ ...editing, score });
  }

  const COL_W = 165;
  const NAME_COL_W = 220;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} &middot;{" "}
          {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} &middot;{" "}
          {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-violet-500" /> Auto-graded
          </span>
          <span className="flex items-center gap-1">
            <Pencil className="w-3 h-3 text-blue-500" /> Manual
          </span>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border shadow-sm bg-card">
        <table className="text-sm border-collapse" style={{ minWidth: NAME_COL_W + columns.length * COL_W }}>
          <thead>
            {/* ── Column header row ── */}
            <tr className="border-b bg-muted/40">
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

              {columns.map((col) => (
                <th
                  key={`${col.kind}-${col.data.id}`}
                  className={cn(
                    "px-3 py-2 border-r text-left font-normal align-top",
                    col.kind === "quiz" ? "bg-violet-50/60 dark:bg-violet-950/20" : ""
                  )}
                  style={{ width: COL_W, minWidth: COL_W }}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    {col.kind === "quiz" ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0">
                        <Zap className="w-2.5 h-2.5 mr-0.5" />Quiz
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0">
                        <Pencil className="w-2.5 h-2.5 mr-0.5" />Assignment
                      </Badge>
                    )}
                  </div>
                  {col.kind === "assignment" && (
                    <div className="text-[11px] text-muted-foreground">
                      {format(new Date(col.data.dueDate), "MMM d, yyyy")}
                    </div>
                  )}
                  <div className="text-[13px] font-semibold text-primary line-clamp-2 leading-tight mt-0.5">
                    {col.data.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {col.kind === "assignment"
                      ? `out of ${col.data.maxScore}`
                      : col.data.timeLimitMinutes
                        ? `${col.data.timeLimitMinutes} min`
                        : "no time limit"}
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
              {columns.map((col) => (
                <td
                  key={`avg-${col.kind}-${col.data.id}`}
                  className={cn(
                    "px-3 py-2.5 border-r text-sm font-semibold text-foreground",
                    col.kind === "quiz" ? "bg-violet-50/40 dark:bg-violet-950/10" : ""
                  )}
                >
                  {colAverage(col, submissions, quizAttempts)}
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
                  {/* Student name */}
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
                  {columns.map((col) => {
                    const isEditing =
                      editing?.enrollmentId === enrollment.id &&
                      editing?.columnKind === col.kind &&
                      editing?.columnId === col.data.id;

                    // Get score data
                    let scoreVal: number | null = null;
                    let feedbackVal: string | null = null;
                    let hasRecord = false;
                    let maxScore = 100;
                    let cellStatus: "graded" | "submitted" | "missing" | "empty" | "not_taken" = "empty";

                    if (col.kind === "assignment") {
                      const sub = getAssignmentSub(enrollment.id, col.data.id);
                      scoreVal = sub?.score ?? null;
                      feedbackVal = sub?.feedback ?? null;
                      hasRecord = !!sub;
                      maxScore = col.data.maxScore;
                      cellStatus = assignmentCellStatus(sub, col.data);
                    } else {
                      const attempt = getQuizAttempt(enrollment.id, col.data.id);
                      scoreVal = attempt?.score ?? null;
                      feedbackVal = attempt?.feedback ?? null;
                      hasRecord = !!attempt;
                      maxScore = attempt?.maxScore ?? 100;
                      cellStatus = attempt
                        ? attempt.score !== null ? "graded" : "submitted"
                        : "not_taken";
                    }

                    return (
                      <td
                        key={`${col.kind}-${col.data.id}`}
                        className={cn(
                          "px-2 py-1.5 border-r align-top relative",
                          !isEditing && "cursor-pointer hover:bg-primary/5",
                          col.kind === "quiz" && !isEditing ? "bg-violet-50/30 dark:bg-violet-950/10 hover:bg-violet-100/50" : ""
                        )}
                        style={{ width: COL_W, minWidth: COL_W }}
                        onClick={() => { if (!isEditing) startEdit(enrollment, col); }}
                      >
                        {isEditing ? (
                          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Input
                                ref={scoreInputRef}
                                type="number"
                                min={0}
                                max={maxScore}
                                className="h-7 w-20 text-xs px-2"
                                placeholder={`/${maxScore}`}
                                value={editing!.currentScore}
                                onChange={(e) =>
                                  setEditing((prev) => prev ? { ...prev, currentScore: e.target.value } : null)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit();
                                  if (e.key === "Escape") setEditing(null);
                                }}
                              />
                              <Button size="icon" className="h-7 w-7 shrink-0" onClick={saveEdit} disabled={mutation.isPending}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditing(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <Select
                              value={feedbackToSelect(editing!.currentFeedback)}
                              onValueChange={(val) =>
                                setEditing((prev) => prev ? { ...prev, currentFeedback: selectToFeedback(val) } : null)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue placeholder="Select remark…" />
                              </SelectTrigger>
                              <SelectContent>
                                {FEEDBACK_REMARKS.map((r) => (
                                  <SelectItem key={r.value} value={r.value} className="text-xs">
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="group flex items-start justify-between gap-1">
                            <div>
                              {cellStatus === "graded" && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {scoreVal}/{maxScore}
                                    </span>
                                    {col.kind === "quiz" && (
                                      <Zap className="w-3 h-3 text-violet-500" title="Auto-graded" />
                                    )}
                                  </div>
                                  {feedbackVal && (
                                    <div className="text-[10px] text-muted-foreground line-clamp-1">{feedbackVal}</div>
                                  )}
                                </>
                              )}
                              {cellStatus === "submitted" && (
                                <>
                                  <div className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-blue-500">—</span>
                                    <span className="text-muted-foreground">/{maxScore}</span>
                                  </div>
                                  <div className="text-[10px] text-blue-500">Submitted</div>
                                </>
                              )}
                              {cellStatus === "missing" && (
                                <>
                                  <div className="text-sm font-semibold text-muted-foreground">0</div>
                                  <div className="text-[10px] text-red-500 font-medium">Missing</div>
                                </>
                              )}
                              {cellStatus === "not_taken" && (
                                <div className="text-sm text-muted-foreground/40">—</div>
                              )}
                              {cellStatus === "empty" && (
                                <div className="text-sm text-muted-foreground/40">—/{maxScore}</div>
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
        Click any cell to enter or edit a score. Quiz scores are auto-graded but can be overridden. Press Enter to save or Esc to cancel.
      </p>
    </div>
  );
}
