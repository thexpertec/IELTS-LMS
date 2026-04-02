import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, List } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type QType = "fill_blank" | "dropdown" | "choose_word" | "matching";
interface FillBlankOpts { sentence: string; blanks: string[] }
interface DropdownOpts  { stem: string; choices: string[]; correct: string }
interface ChooseWordOpts { instruction: string; wordLimit: number; passageText?: string; imageUrl?: string; correct: string }
interface MatchingOpts  { leftItems: string[]; rightItems: string[]; pairs: { left: number; right: number }[] }

type AnswerMap = Record<number, string | string[] | Record<number, string>>;

function isAnswered(qId: number, qType: QType, answers: AnswerMap): boolean {
  const ans = answers[qId];
  if (ans === undefined || ans === null) return false;
  if (qType === "fill_blank") return Array.isArray(ans) && (ans as string[]).some(Boolean);
  if (qType === "matching") return Object.keys(ans as Record<number, string>).length > 0;
  return typeof ans === "string" && ans.trim() !== "";
}

function questionSlots(q: { type: string; options: unknown }): number {
  if (q.type === "matching") {
    const opts = q.options as MatchingOpts;
    return Math.max(1, (opts.leftItems ?? []).filter(Boolean).length);
  }
  return 1;
}

function matchingRowAnswered(answers: AnswerMap, qId: number, rowIdx: number): boolean {
  const current = (answers[qId] as Record<number, string> | undefined) ?? {};
  return !!current[rowIdx];
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
        if (s <= 1) { clearInterval(ref.current!); onExpire?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [onExpire]);

  const m = remaining === null ? null : Math.floor(remaining / 60);
  const s = remaining === null ? null : remaining % 60;
  const display = remaining === null ? null
    : `${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")}`;
  const isWarning = remaining !== null && remaining < 300;
  return { display, isWarning };
}

// ─────────────────────────────────────────────
// Question components — IELTS-styled
// ─────────────────────────────────────────────
function QNum({ num, answered }: { num: number | string; answered: boolean }) {
  return (
    <span className={cn(
      "text-xs font-bold shrink-0 pt-0.5",
      answered ? "text-primary" : "text-primary/60"
    )}>
      {num}
    </span>
  );
}

function FillBlankQuestion({
  opts, qId, answers, setAnswers, slotStart,
}: { opts: FillBlankOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; slotStart: number }) {
  const current = (answers[qId] as string[] | undefined) ?? Array(opts.blanks.length).fill("");
  const update = (i: number, val: string) => {
    const next = [...current];
    next[i] = val;
    setAnswers({ ...answers, [qId]: next });
  };
  const parts = opts.sentence.split("___");
  const answered = current.some(Boolean);
  return (
    <div id={`q-${qId}`} className="flex items-start gap-2">
      <QNum num={slotStart} answered={answered} />
      <p className="text-sm leading-7 flex flex-wrap items-center gap-x-1">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input
                type="text"
                className="inline-block border-0 border-b border-border mx-1 px-1 text-sm w-32 bg-transparent focus:outline-none focus:border-primary"
                placeholder="write answer"
                value={current[i] ?? ""}
                onChange={(e) => update(i, e.target.value)}
              />
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

function DropdownQuestion({
  opts, qId, answers, setAnswers, slotStart,
}: { opts: DropdownOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; slotStart: number }) {
  const answered = !!(answers[qId] as string)?.trim();
  return (
    <div id={`q-${qId}`} className="flex items-start gap-2">
      <QNum num={slotStart} answered={answered} />
      <div className="flex-1 space-y-2">
        {opts.stem && <p className="text-sm leading-relaxed">{opts.stem}</p>}
        <Select
          value={(answers[qId] as string) ?? ""}
          onValueChange={(val) => setAnswers({ ...answers, [qId]: val })}
        >
          <SelectTrigger className="w-full max-w-xs h-8 text-xs">
            <SelectValue placeholder="Select your answer..." />
          </SelectTrigger>
          <SelectContent>
            {opts.choices.filter(Boolean).map((c, i) => (
              <SelectItem key={i} value={c} className="text-sm">
                {String.fromCharCode(65 + i)}. {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ChooseWordQuestion({
  opts, qId, answers, setAnswers, slotStart,
}: { opts: ChooseWordOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; slotStart: number }) {
  const answered = !!(answers[qId] as string)?.trim();
  return (
    <div id={`q-${qId}`} className="flex items-start gap-2">
      <QNum num={slotStart} answered={answered} />
      <div className="flex-1 space-y-2">
        <p className="text-sm leading-relaxed">{opts.instruction}</p>
        {opts.imageUrl && (
          <img src={opts.imageUrl} alt="Question visual" className="max-h-40 rounded border object-contain" />
        )}
        <input
          type="text"
          className="border-0 border-b border-border px-1 text-sm w-48 bg-transparent focus:outline-none focus:border-primary"
          placeholder={`Up to ${opts.wordLimit} word${opts.wordLimit !== 1 ? "s" : ""}...`}
          value={(answers[qId] as string) ?? ""}
          onChange={(e) => setAnswers({ ...answers, [qId]: e.target.value })}
        />
      </div>
    </div>
  );
}

function MatchingQuestion({
  opts, qId, answers, setAnswers, startNum,
}: { opts: MatchingOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; startNum: number }) {
  const current = (answers[qId] as Record<number, string>) ?? {};
  const update = (leftIdx: number, rightVal: string) => {
    setAnswers({ ...answers, [qId]: { ...current, [leftIdx]: rightVal } });
  };
  return (
    <div id={`q-${qId}`} className="space-y-2">
      <div className="grid grid-cols-[24px_1fr_1fr] gap-2 text-xs font-semibold text-muted-foreground px-1 mb-1">
        <span />
        <span>Column A</span>
        <span>Column B</span>
      </div>
      {opts.leftItems.filter(Boolean).map((item, i) => {
        const rowAnswered = matchingRowAnswered(answers, qId, i);
        return (
          <div key={i} className="grid grid-cols-[24px_1fr_1fr] gap-3 items-center">
            <span className={cn(
              "text-xs font-bold shrink-0",
              rowAnswered ? "text-primary" : "text-primary/60"
            )}>
              {startNum + i}
            </span>
            <p className="text-sm px-3 py-2 bg-muted/60 rounded">{item}</p>
            <Select value={current[i] ?? ""} onValueChange={(val) => update(i, val)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Match..." />
              </SelectTrigger>
              <SelectContent>
                {opts.rightItems.filter(Boolean).map((r, j) => (
                  <SelectItem key={j} value={r} className="text-sm">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
type QuizPartFull = {
  name: string; from: number; to: number;
  instructions?: string[];
  passageText?: string; imageUrl?: string; audioUrl?: string;
};

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
  const [activePart, setActivePart] = useState(0);

  const rightRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const questions = ((quiz as { questions?: unknown[] })?.questions ?? []) as Array<{
    id: number; type: string; order: number; questionText: string; options: unknown;
  }>;
  const sortedQs = [...questions].sort((a, b) => a.order - b.order);
  const quizParts = ((quiz as { parts?: QuizPartFull[] | null })?.parts ?? []) as QuizPartFull[];
  const activeParts = quizParts.filter((p) => sortedQs.some((_, i) => i + 1 >= p.from && i + 1 <= p.to));

  const maxTo = activeParts.length > 0 ? Math.max(...activeParts.map((p) => p.to)) : 0;
  const ungroupedQs = sortedQs.slice(maxTo);

  type Tab = {
    label: string;
    from: number; to: number;
    instructions?: string[];
    passageText?: string; imageUrl?: string; audioUrl?: string;
  };

  const tabs: Tab[] = [
    ...activeParts.map((p) => ({
      label: p.name.toUpperCase(),
      from: p.from, to: p.to,
      instructions: p.instructions,
      passageText: p.passageText,
      imageUrl: p.imageUrl,
      audioUrl: p.audioUrl,
    })),
    ...(ungroupedQs.length > 0 ? [{
      label: "QUESTIONS",
      from: maxTo + 1, to: sortedQs.length,
      instructions: undefined, passageText: undefined, imageUrl: undefined, audioUrl: undefined,
    }] : []),
  ];

  const allTabs: Tab[] = tabs.length > 0 ? tabs : [{
    label: "QUESTIONS",
    from: 1, to: sortedQs.length,
  }];

  const clampedPart = Math.min(activePart, allTabs.length - 1);
  const currentTab = allTabs[clampedPart] ?? allTabs[0];

  // Left panel: current tab media OR quiz-level passageText
  const quizPassage = (quiz as { passageText?: string })?.passageText;
  const tabPassage = currentTab.passageText;
  const tabImage = currentTab.imageUrl;
  const tabAudio = currentTab.audioUrl;
  const hasLeftPanel = !!(tabPassage || tabImage || tabAudio || quizPassage);
  const leftPassage = tabPassage || quizPassage;

  // Slot-aware numbering
  const slotMap = (() => {
    const map = new Map<number, { slotStart: number; slots: number }>();
    let cursor = 0;
    for (const q of sortedQs) {
      const slots = questionSlots(q);
      map.set(q.id, { slotStart: cursor, slots });
      cursor += slots;
    }
    return map;
  })();
  const totalSlots = sortedQs.reduce((sum, q) => sum + questionSlots(q), 0);

  // Compute actual slot ranges per tab
  const tabSlotRanges = allTabs.map((tab) => {
    const qs = sortedQs.filter((_, i) => { const n = i + 1; return n >= tab.from && n <= tab.to; });
    if (qs.length === 0) return { min: 1, max: 0 };
    let min = Infinity, max = -Infinity;
    for (const q of qs) {
      const si = slotMap.get(q.id);
      if (si) { min = Math.min(min, si.slotStart + 1); max = Math.max(max, si.slotStart + si.slots); }
    }
    return { min: min === Infinity ? 1 : min, max: max === -Infinity ? 0 : max };
  });

  const answeredIds = new Set(sortedQs.filter((q) => isAnswered(q.id, q.type as QType, answers)).map((q) => q.id));
  const answeredSlots = sortedQs.reduce((sum, q) => {
    if (q.type === "matching") {
      const opts = q.options as MatchingOpts;
      const rows = (opts.leftItems ?? []).filter(Boolean).length;
      for (let i = 0; i < rows; i++) if (matchingRowAnswered(answers, q.id, i)) sum++;
      return sum;
    }
    return sum + (answeredIds.has(q.id) ? 1 : 0);
  }, 0);

  // ── Scroll-driven active part detection ──
  useEffect(() => {
    const el = rightRef.current;
    if (!el) return;
    const handleScroll = () => {
      const threshold = el.scrollTop + el.clientHeight * 0.25;
      let activeIdx = 0;
      for (let i = 0; i < sectionRefs.current.length; i++) {
        const section = sectionRefs.current[i];
        if (section && section.offsetTop <= threshold) {
          activeIdx = i;
        }
      }
      setActivePart(activeIdx);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [allTabs.length]);

  const handleExpire = useCallback(() => setSubmitOpen(true), []);
  const { display: timerDisplay, isWarning } = useTimer(quiz?.timeLimitMinutes, handleExpire);

  function handleSubmit() {
    setScore({ answered: answeredSlots, total: totalSlots });
    setSubmitted(true);
    setSubmitOpen(false);
    setReviewOpen(false);
  }

  function scrollToQ(qId: number) {
    const el = document.getElementById(`q-${qId}`);
    if (el && rightRef.current) {
      const offset = el.offsetTop - rightRef.current.offsetTop - 16;
      rightRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
  }

  function scrollToPartSection(idx: number) {
    const section = sectionRefs.current[idx];
    if (section && rightRef.current) {
      const offset = section.offsetTop - rightRef.current.offsetTop - 8;
      rightRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-12 bg-primary flex items-center px-6 gap-4">
          <Skeleton className="h-4 w-48 bg-white/20" />
          <Skeleton className="h-4 w-20 ml-auto bg-white/20" />
        </div>
        <div className="flex-1 flex">
          <Skeleton className="w-1/2 h-full rounded-none" />
          <Skeleton className="w-1/2 h-full rounded-none" />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Quiz not found</p>
          <Button className="mt-4" onClick={() => setLocation("/student/quizzes")}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  // ── Completion screen ──
  if (submitted && score) {
    const pct = score.total > 0 ? Math.round((score.answered / score.total) * 100) : 0;
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-6 px-6">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <div className="text-center">
          <h1 className="text-3xl font-bold">Quiz Submitted!</h1>
          <p className="text-muted-foreground mt-2">{quiz.title}</p>
        </div>
        <div className="grid grid-cols-3 gap-8 text-center">
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
        <Button onClick={() => setLocation("/student/quizzes")}>
          Return to Quizzes
        </Button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 h-12 bg-primary text-primary-foreground flex items-center px-4 gap-3 z-10">
        <span className="font-semibold text-sm tracking-wide truncate flex-1">{quiz.title}</span>
        {timerDisplay && (
          <div className={cn(
            "flex items-center gap-1.5 text-sm font-mono px-3 py-1 rounded shrink-0",
            isWarning ? "bg-red-500/80 text-white" : "bg-black/20"
          )}>
            <Clock className="w-3.5 h-3.5" />
            <span>{timerDisplay}</span>
          </div>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white shrink-0"
          onClick={() => setReviewOpen(true)}
        >
          <List className="w-3.5 h-3.5 mr-1" />
          REVIEW
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-white text-primary hover:bg-white/90 font-semibold shrink-0"
          onClick={() => setSubmitOpen(true)}
        >
          SUBMIT
        </Button>
      </header>

      {/* ── MAIN PANELS ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Passage / Media — updates based on scroll-driven activePart */}
        {hasLeftPanel && (
          <div className="w-1/2 overflow-y-auto border-r bg-card">
            <div className="p-6 max-w-2xl mx-auto">
              {tabImage && (
                <img src={tabImage} alt="Reading image" className="rounded-lg border mb-5 w-full object-contain max-h-72" />
              )}
              {tabAudio && (
                <audio controls src={tabAudio} className="w-full mb-5" />
              )}
              {leftPassage && (
                <>
                  {currentTab.label !== "QUESTIONS" && currentTab.label && (
                    <h2 className="text-base font-bold mb-4 text-foreground">{quiz.title}</h2>
                  )}
                  <div className="text-sm leading-7 text-foreground whitespace-pre-wrap">
                    {leftPassage}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* RIGHT: All questions, all parts, continuous scroll */}
        <div
          className={cn("overflow-y-auto bg-muted/10", hasLeftPanel ? "w-1/2" : "w-full")}
          ref={rightRef}
        >
          {sortedQs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No questions in this quiz yet.
            </div>
          ) : (
            <div className="p-6 space-y-10">
              {allTabs.map((tab, tabIdx) => {
                const tabQs = sortedQs.filter((_, i) => {
                  const n = i + 1;
                  return n >= tab.from && n <= tab.to;
                });
                if (tabQs.length === 0) return null;
                const slotRange = tabSlotRanges[tabIdx];

                return (
                  <div
                    key={tabIdx}
                    ref={(el) => { sectionRefs.current[tabIdx] = el; }}
                    className="space-y-5"
                  >
                    {/* Part section header */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground">
                        {tab.label !== "QUESTIONS"
                          ? `${tab.label}: Questions ${slotRange?.min ?? tab.from}–${slotRange?.max ?? tab.to}`
                          : `Questions ${slotRange?.min ?? tab.from}–${slotRange?.max ?? tab.to}`}
                      </h3>
                      {tab.instructions?.some(Boolean) && (
                        <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed border-l-4 border-primary pl-3">
                          {tab.instructions.filter(Boolean).join("\n")}
                        </div>
                      )}
                    </div>

                    {/* Questions */}
                    <div className="space-y-5">
                      {tabQs.map((q) => {
                        const si = slotMap.get(q.id)!;
                        const slotStart = si.slotStart + 1;
                        const opts = q.options as FillBlankOpts & DropdownOpts & ChooseWordOpts & MatchingOpts;

                        return (
                          <div key={q.id}>
                            {q.questionText && (
                              <p className="text-xs text-muted-foreground mb-1 italic">{q.questionText}</p>
                            )}
                            {q.type === "fill_blank" && (
                              <FillBlankQuestion opts={opts} qId={q.id} answers={answers} setAnswers={setAnswers} slotStart={slotStart} />
                            )}
                            {q.type === "dropdown" && (
                              <DropdownQuestion opts={opts} qId={q.id} answers={answers} setAnswers={setAnswers} slotStart={slotStart} />
                            )}
                            {q.type === "choose_word" && (
                              <ChooseWordQuestion opts={opts} qId={q.id} answers={answers} setAnswers={setAnswers} slotStart={slotStart} />
                            )}
                            {q.type === "matching" && (
                              <MatchingQuestion opts={opts} qId={q.id} answers={answers} setAnswers={setAnswers} startNum={slotStart} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Subtle divider between parts */}
                    {tabIdx < allTabs.length - 1 && (
                      <div className="border-t border-dashed border-border/60 pt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="flex-shrink-0 border-t bg-card">

        {/* Part tabs — clicking scrolls to that section */}
        {allTabs.length > 1 && (
          <div className="flex border-b">
            {allTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => scrollToPartSection(idx)}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold tracking-wide transition-colors",
                  clampedPart === idx
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab.label}: {tabSlotRanges[idx]?.min ?? tab.from} to {tabSlotRanges[idx]?.max ?? tab.to} Questions
              </button>
            ))}
          </div>
        )}

        {/* Slot-aware question number grid */}
        <div className="flex items-center gap-1 px-4 py-2 flex-wrap">
          {sortedQs.flatMap((q) => {
            const si = slotMap.get(q.id)!;
            const tabForQ = allTabs.find((t) => {
              const qIdx = sortedQs.indexOf(q) + 1;
              return qIdx >= t.from && qIdx <= t.to;
            });
            const qTabIdx = allTabs.indexOf(tabForQ!);
            const isCurrentTab = qTabIdx === clampedPart;

            if (q.type === "matching") {
              const opts = q.options as MatchingOpts;
              const rows = (opts.leftItems ?? []).filter(Boolean).length;
              return Array.from({ length: rows }, (_, ri) => {
                const done = matchingRowAnswered(answers, q.id, ri);
                const slotNum = si.slotStart + ri + 1;
                return (
                  <button
                    key={`${q.id}-${ri}`}
                    onClick={() => scrollToQ(q.id)}
                    className={cn(
                      "w-7 h-7 text-xs rounded font-medium transition-all",
                      done
                        ? "bg-primary text-primary-foreground"
                        : isCurrentTab
                        ? "border border-primary text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {slotNum}
                  </button>
                );
              });
            }

            const done = answeredIds.has(q.id);
            return [(
              <button
                key={q.id}
                onClick={() => scrollToQ(q.id)}
                className={cn(
                  "w-7 h-7 text-xs rounded font-medium transition-all",
                  done
                    ? "bg-primary text-primary-foreground"
                    : isCurrentTab
                    ? "border border-primary text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {si.slotStart + 1}
              </button>
            )];
          })}
          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {answeredSlots}/{totalSlots} answered
          </span>
        </div>
      </footer>

      {/* ── REVIEW DIALOG ── */}
      <AlertDialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Question Review</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredSlots} of {totalSlots} questions answered. Unanswered questions are highlighted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-5 gap-2 py-2 max-h-64 overflow-y-auto">
            {sortedQs.flatMap((q) => {
              const si = slotMap.get(q.id)!;
              if (q.type === "matching") {
                const opts = q.options as MatchingOpts;
                const rows = (opts.leftItems ?? []).filter(Boolean).length;
                return Array.from({ length: rows }, (_, ri) => {
                  const done = matchingRowAnswered(answers, q.id, ri);
                  return (
                    <button
                      key={`${q.id}-${ri}`}
                      onClick={() => { setReviewOpen(false); setTimeout(() => scrollToQ(q.id), 150); }}
                      className={cn(
                        "h-9 flex items-center justify-center rounded text-sm font-semibold",
                        done
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border border-destructive/40 text-destructive"
                      )}
                    >
                      {si.slotStart + ri + 1}
                    </button>
                  );
                });
              }
              const done = answeredIds.has(q.id);
              return [(
                <button
                  key={q.id}
                  onClick={() => { setReviewOpen(false); setTimeout(() => scrollToQ(q.id), 150); }}
                  className={cn(
                    "h-9 flex items-center justify-center rounded text-sm font-semibold",
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border border-destructive/40 text-destructive"
                  )}
                >
                  {si.slotStart + 1}
                </button>
              )];
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setReviewOpen(false); setSubmitOpen(true); }}>
              Submit Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── SUBMIT DIALOG ── */}
      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredSlots} of {totalSlots} questions.{" "}
              {totalSlots - answeredSlots > 0 && (
                <span className="text-destructive font-medium">
                  {totalSlots - answeredSlots} question{totalSlots - answeredSlots !== 1 ? "s" : ""} are still unanswered.
                </span>
              )}{" "}
              Once submitted, you cannot make changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit Quiz</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
