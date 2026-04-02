import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type QType = "fill_blank" | "dropdown" | "choose_word" | "matching";
interface FillBlankOpts { sentence: string; blanks: string[] }
interface DropdownOpts  { stem: string; choices: string[]; correct: string }
interface ChooseWordOpts { instruction: string; wordLimit: number; passageText?: string; imageUrl?: string; correct: string }
interface MatchingOpts  { leftItems: string[]; rightItems: string[]; pairs: { left: number; right: number }[] }

// answers keyed by questionId
type AnswerMap = Record<number, string | string[] | Record<number, string>>;

function isAnswered(qId: number, qType: QType, answers: AnswerMap): boolean {
  const ans = answers[qId];
  if (ans === undefined || ans === null) return false;
  if (qType === "fill_blank") return Array.isArray(ans) && (ans as string[]).some(Boolean);
  if (qType === "matching") return Object.keys(ans as Record<number, string>).length > 0;
  return typeof ans === "string" && ans.trim() !== "";
}

// ─────────────────────────────────────────────
// Timer hook
// ─────────────────────────────────────────────
function useTimer(limitMinutes?: number | null, onExpire?: () => void) {
  const totalSecs = limitMinutes ? limitMinutes * 60 : null;
  const [remaining, setRemaining] = useState(totalSecs);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(ref.current!);
          onExpire?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [onExpire]);

  const display = remaining === null
    ? null
    : `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  const isWarning = remaining !== null && remaining < 300;

  return { display, isWarning };
}

// ─────────────────────────────────────────────
// Question renderers (student-facing)
// ─────────────────────────────────────────────
function FillBlankQuestion({
  opts, qId, answers, setAnswers,
}: { opts: FillBlankOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void }) {
  const current = (answers[qId] as string[] | undefined) ?? Array(opts.blanks.length).fill("");
  const update = (i: number, val: string) => {
    const next = [...current];
    next[i] = val;
    setAnswers({ ...answers, [qId]: next });
  };

  // Replace ___ in sentence with numbered inputs
  const parts = opts.sentence.split("___");
  return (
    <p className="text-sm leading-loose">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <input
              type="text"
              className="inline-block border-b-2 border-primary mx-1 px-1 text-sm w-28 bg-transparent focus:outline-none focus:border-primary"
              value={current[i] ?? ""}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`(${i + 1})`}
            />
          )}
        </span>
      ))}
    </p>
  );
}

function DropdownQuestion({
  opts, qId, answers, setAnswers,
}: { opts: DropdownOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void }) {
  return (
    <div className="space-y-3">
      {opts.stem && <p className="text-sm">{opts.stem}</p>}
      <Select
        value={(answers[qId] as string) ?? ""}
        onValueChange={(val) => setAnswers({ ...answers, [qId]: val })}
      >
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select your answer..." />
        </SelectTrigger>
        <SelectContent>
          {opts.choices.filter(Boolean).map((c, i) => (
            <SelectItem key={i} value={c}>{String.fromCharCode(65 + i)}. {c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ChooseWordQuestion({
  opts, qId, answers, setAnswers,
}: { opts: ChooseWordOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{opts.instruction}</p>
      {opts.imageUrl && (
        <img src={opts.imageUrl} alt="Question visual" className="max-h-48 rounded-lg border object-contain" />
      )}
      <Input
        className="max-w-xs"
        placeholder={`Enter up to ${opts.wordLimit} word${opts.wordLimit !== 1 ? "s" : ""}...`}
        value={(answers[qId] as string) ?? ""}
        onChange={(e) => setAnswers({ ...answers, [qId]: e.target.value })}
      />
    </div>
  );
}

function MatchingQuestion({
  opts, qId, answers, setAnswers,
}: { opts: MatchingOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void }) {
  const current = (answers[qId] as Record<number, string>) ?? {};
  const update = (leftIdx: number, rightVal: string) => {
    setAnswers({ ...answers, [qId]: { ...current, [leftIdx]: rightVal } });
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground px-1 mb-2">
        <span>Column A</span>
        <span>Column B</span>
      </div>
      {opts.leftItems.filter(Boolean).map((item, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 items-center">
          <p className="text-sm px-3 py-2 bg-muted rounded-md">{item}</p>
          <Select value={current[i] ?? ""} onValueChange={(val) => update(i, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Match..." />
            </SelectTrigger>
            <SelectContent>
              {opts.rightItems.filter(Boolean).map((r, j) => (
                <SelectItem key={j} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function StudentQuizTake() {
  const [, params] = useRoute("/student/quizzes/:id");
  const quizId = Number(params?.id);
  const [, setLocation] = useLocation();

  const { data: quiz, isLoading } = useGetQuiz(quizId);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [score, setScore] = useState<{ answered: number; total: number } | null>(null);

  const questions = ((quiz as { questions?: unknown[] })?.questions ?? []) as Array<{
    id: number; type: string; order: number; questionText: string; options: unknown;
  }>;
  const sortedQs = [...questions].sort((a, b) => a.order - b.order);
  const quizParts = ((quiz as { parts?: Array<{ name: string; from: number; to: number; instructions?: string[] }> | null })?.parts ?? []) as Array<{ name: string; from: number; to: number; instructions?: string[] }>;
  // Only show parts that have at least one actual question within their range
  const activeParts = quizParts.filter((p) => sortedQs.some((_, i) => i + 1 >= p.from && i + 1 <= p.to));

  const handleExpire = useCallback(() => setSubmitOpen(true), []);
  const { display: timerDisplay, isWarning } = useTimer(quiz?.timeLimitMinutes, handleExpire);

  function handleSubmit() {
    const answered = sortedQs.filter((q) => isAnswered(q.id, q.type as QType, answers)).length;
    setScore({ answered, total: sortedQs.length });
    setSubmitted(true);
    setSubmitOpen(false);
    setReviewOpen(false);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-14 border-b bg-card flex items-center px-6 gap-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-24 ml-auto" />
        </div>
        <div className="flex-1 flex">
          <Skeleton className="w-1/2 h-full" />
          <Skeleton className="w-1/2 h-full" />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Quiz not found</p>
          <Button className="mt-4" onClick={() => setLocation("/student/quizzes")}>Back to Quizzes</Button>
        </div>
      </div>
    );
  }

  // ── Completion screen ──
  if (submitted && score) {
    const pct = score.total > 0 ? Math.round((score.answered / score.total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-6 px-6">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Quiz Submitted!</h1>
          <p className="text-muted-foreground mt-2">{quiz.title}</p>
        </div>
        <div className="grid grid-cols-3 gap-8 text-center mt-2">
          <div>
            <p className="text-4xl font-bold text-primary">{score.answered}</p>
            <p className="text-sm text-muted-foreground mt-1">Answered</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-muted-foreground">{score.total - score.answered}</p>
            <p className="text-sm text-muted-foreground mt-1">Skipped</p>
          </div>
          <div>
            <p className="text-4xl font-bold">{pct}%</p>
            <p className="text-sm text-muted-foreground mt-1">Completion</p>
          </div>
        </div>
        <Button className="mt-4" onClick={() => setLocation("/student/quizzes")}>
          Back to Quizzes
        </Button>
      </div>
    );
  }

  const answeredIds = new Set(sortedQs.filter((q) => isAnswered(q.id, q.type as QType, answers)).map((q) => q.id));
  const unanswered = sortedQs.length - answeredIds.size;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">

      {/* ── HEADER ── */}
      <header className="h-14 border-b bg-card flex items-center px-6 gap-4 flex-shrink-0 z-10">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{quiz.description}</p>
          )}
        </div>

        {timerDisplay && (
          <div className={cn(
            "px-4 py-1.5 rounded-full text-sm font-mono font-bold border",
            isWarning
              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
              : "bg-muted text-foreground border-border"
          )}>
            {timerDisplay}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}>
          REVIEW
        </Button>
        <Button size="sm" onClick={() => setSubmitOpen(true)}>
          SUBMIT
        </Button>
      </header>

      {/* ── BODY: passage + questions ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Passage */}
        <div className={cn(
          "border-r overflow-y-auto",
          quiz.passageText ? "w-1/2" : "w-0 hidden"
        )}>
          {quiz.passageText && (
            <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <h2 className="text-base font-bold mb-4">{quiz.title}</h2>
              <div className="text-sm leading-7 whitespace-pre-wrap text-foreground">
                {quiz.passageText}
              </div>
            </div>
          )}
        </div>

        {/* Right: Questions */}
        <div className={cn(
          "overflow-y-auto",
          quiz.passageText ? "w-1/2" : "w-full"
        )}>
          {sortedQs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No questions in this quiz yet.
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {(() => {
                // Build a flat list of React nodes: part-instruction blocks + question cards
                const nodes: React.ReactNode[] = [];
                // Track which 1-based question indices start a new part
                const partStartMap = new Map<number, typeof activeParts[number]>();
                activeParts.forEach((p) => partStartMap.set(p.from, p));

                sortedQs.forEach((q, i) => {
                  const oneBasedIdx = i + 1;
                  const part = partStartMap.get(oneBasedIdx);

                  // Insert part instruction header if this question starts a part
                  if (part && (part.instructions ?? []).some(Boolean)) {
                    nodes.push(
                      <div
                        key={`part-header-${i}`}
                        id={`part-${oneBasedIdx}`}
                        className="rounded-lg border-l-4 border-[#7F1D1D] bg-red-50 dark:bg-red-950/20 px-5 py-4"
                      >
                        <p className="text-sm font-bold text-[#7F1D1D] mb-3">
                          {part.name}: Questions {part.from}–{part.to}
                        </p>
                        <ul className="space-y-1.5">
                          {(part.instructions ?? []).filter(Boolean).map((instr, j) => (
                            <li key={j} className="flex gap-2.5 text-sm text-foreground">
                              <span className="mt-0.5 shrink-0 text-foreground">•</span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: instr.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                                }}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }

                  const opts = q.options as FillBlankOpts & DropdownOpts & ChooseWordOpts & MatchingOpts;
                  const answered = answeredIds.has(q.id);
                  nodes.push(
                    <div
                      key={q.id}
                      id={`q-${q.id}`}
                      className={cn(
                        "p-4 rounded-lg border transition-colors",
                        answered ? "border-primary/30 bg-primary/5" : "border-border"
                      )}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className={cn(
                          "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          answered
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {oneBasedIdx}
                        </span>
                        <div className="flex-1">
                          {q.questionText && (
                            <p className="text-sm font-medium text-muted-foreground mb-2">{q.questionText}</p>
                          )}
                          {q.type === "fill_blank" && (
                            <FillBlankQuestion opts={opts} qId={q.id} answers={answers} setAnswers={setAnswers} />
                          )}
                          {q.type === "dropdown" && (
                            <DropdownQuestion opts={opts} qId={q.id} answers={answers} setAnswers={setAnswers} />
                          )}
                          {q.type === "choose_word" && (
                            <ChooseWordQuestion opts={opts} qId={q.id} answers={answers} setAnswers={setAnswers} />
                          )}
                          {q.type === "matching" && (
                            <MatchingQuestion opts={opts} qId={q.id} answers={answers} setAnswers={setAnswers} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });

                return nodes;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER: parts bar + question number grid ── */}
      {sortedQs.length > 0 && (
        <footer className="border-t bg-card flex-shrink-0">
          {/* Parts bar */}
          {activeParts.length > 0 && (
            <div className="bg-[#7F1D1D] flex items-center gap-0 overflow-x-auto">
              {activeParts.map((part, pi) => {
                const isFirst = pi === 0;
                return (
                  <button
                    key={pi}
                    onClick={() => {
                      // scroll to the first question in this part
                      const firstQInPart = sortedQs[part.from - 1];
                      if (firstQInPart) {
                        document.getElementById(`q-${firstQInPart.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                    className={cn(
                      "px-5 py-2 text-white text-xs font-bold tracking-wide whitespace-nowrap transition-all",
                      "border-r border-white/20 hover:bg-white/10",
                      isFirst && "border border-white rounded-full mx-3 my-1.5 px-4 border-r border-white/80"
                    )}
                  >
                    {part.name.toUpperCase()}: {part.from} to {part.to} Questions
                  </button>
                );
              })}
              <span className="ml-auto pr-4 text-white/70 text-xs shrink-0">
                {answeredIds.size}/{sortedQs.length} answered
              </span>
            </div>
          )}

          {/* Question number buttons — grouped by part when parts exist */}
          <div className="px-4 py-3 overflow-x-auto">
            {activeParts.length > 0 ? (
              <div className="flex gap-4 flex-wrap">
                {activeParts.map((part, pi) => {
                  const partQs = sortedQs.slice(part.from - 1, part.to);
                  return (
                    <div key={pi} className="flex items-center gap-1.5">
                      {partQs.map((q, qi) => {
                        const globalIdx = part.from - 1 + qi;
                        const done = answeredIds.has(q.id);
                        return (
                          <button
                            key={q.id}
                            className={cn(
                              "w-7 h-7 rounded text-xs font-bold border transition-colors",
                              done
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                            )}
                            onClick={() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                          >
                            {globalIdx + 1}
                          </button>
                        );
                      })}
                      {pi < activeParts.length - 1 && (
                        <div className="w-px h-5 bg-border mx-1" />
                      )}
                    </div>
                  );
                })}
                {/* Ungrouped questions (beyond all parts) */}
                {(() => {
                  const maxTo = Math.max(...activeParts.map((p) => p.to));
                  const extra = sortedQs.slice(maxTo);
                  if (extra.length === 0) return null;
                  return (
                    <div className="flex items-center gap-1.5">
                      <div className="w-px h-5 bg-border mx-1" />
                      {extra.map((q, qi) => {
                        const done = answeredIds.has(q.id);
                        return (
                          <button
                            key={q.id}
                            className={cn(
                              "w-7 h-7 rounded text-xs font-bold border transition-colors",
                              done
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                            )}
                            onClick={() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                          >
                            {maxTo + qi + 1}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">Questions:</span>
                {sortedQs.map((q, i) => {
                  const done = answeredIds.has(q.id);
                  return (
                    <button
                      key={q.id}
                      className={cn(
                        "w-7 h-7 rounded text-xs font-bold border transition-colors",
                        done
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      )}
                      onClick={() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    >
                      {i + 1}
                    </button>
                  );
                })}
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {answeredIds.size}/{sortedQs.length} answered
                </span>
              </div>
            )}
          </div>
        </footer>
      )}

      {/* ── REVIEW DIALOG ── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Your Answers</DialogTitle>
            <DialogDescription>
              {unanswered > 0
                ? `You have ${unanswered} unanswered question${unanswered !== 1 ? "s" : ""}.`
                : "All questions answered. Ready to submit!"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <div className="flex flex-wrap gap-2">
              {sortedQs.map((q, i) => {
                const done = answeredIds.has(q.id);
                return (
                  <button
                    key={q.id}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-bold border transition-colors",
                      done
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                    )}
                    onClick={() => {
                      setReviewOpen(false);
                      setTimeout(() => {
                        document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 150);
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 inline-block dark:bg-red-950/30" /> Not answered
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Continue</Button>
            <Button onClick={() => { setReviewOpen(false); setSubmitOpen(true); }}>Submit Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SUBMIT CONFIRM DIALOG ── */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogDescription>
              {unanswered > 0
                ? `You still have ${unanswered} unanswered question${unanswered !== 1 ? "s" : ""}. Once submitted, you cannot make changes.`
                : "All questions are answered. Are you sure you want to submit?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Go Back</Button>
            <Button onClick={handleSubmit}>Yes, Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
