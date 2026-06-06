import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useGetQuiz, useGetLesson } from "@workspace/api-client-react";
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

import {
  DndContext, useDraggable, useDroppable, type DragEndEvent,
} from "@dnd-kit/core";

function getServingUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `/api/storage${path}`;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type QType = "fill_blank" | "fill_blank_dropdown" | "dropdown" | "choose_word" | "matching" | "matching_3col" | "drag_match" | "short_answer" | "true_false_ng" | "multi_select" | "writing" | "table_fill_blank";
interface FillBlankOpts         { sentence: string; blanks: string[] }
interface FillBlankDropdownOpts { instruction: string; sentences: string[]; choices: string[]; correct: string[] }
interface DropdownOpts          { stem: string; choices: string[]; correct: string }
interface ChooseWordOpts        { instruction: string; wordLimit: number; passageText?: string; imageUrl?: string; correct: string }
interface MatchingOpts          { leftItems: string[]; rightItems: string[]; pairs: { left: number; right: number }[]; instruction?: string; leftColumnName?: string; rightColumnName?: string }
interface Matching3ColOpts      { columns: [string, string, string]; answerColIndex: 0 | 1 | 2; rows: Array<{ a: string; b: string; c: string }>; instruction?: string }
interface DragMatchOpts         { leftItems: string[]; rightItems: string[]; pairs: { left: number; right: number }[]; instruction?: string }
interface ShortAnswerOpts       { prompt: string; correct?: string; wordLimit?: number }
interface TrueFalseNgOpts       { statement: string; correct: "TRUE" | "FALSE" | "NOT GIVEN" | "" }
interface MultiSelectOpts       { instruction: string; options: string[]; maxSelect: number; correct: number[] }
interface WritingOpts           { taskTitle?: string; minWords?: number; modelAnswer?: string }
interface TableFillBlankOpts   { instruction?: string; headers: string[]; rows: string[][]; correct?: string[] }

type AnswerMap = Record<number, string | string[] | Record<number, string>>;

function isAnswered(qId: number, qType: QType, answers: AnswerMap): boolean {
  const ans = answers[qId];
  if (ans === undefined || ans === null) return false;
  if (qType === "fill_blank") return Array.isArray(ans) && (ans as string[]).some(Boolean);
  if (qType === "matching" || qType === "matching_3col" || qType === "drag_match") return Object.keys(ans as Record<number, string>).length > 0;
  if (qType === "fill_blank_dropdown") return Object.keys(ans as Record<number, string>).length > 0;
  if (qType === "multi_select") return Array.isArray(ans) && (ans as number[]).length > 0;
  if (qType === "table_fill_blank") return Array.isArray(ans) && (ans as string[]).some(Boolean);
  return typeof ans === "string" && ans.trim() !== "";
}

function shuffleStable<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function questionSlots(q: { type: string; options: unknown }): number {
  if (q.type === "matching" || q.type === "drag_match") {
    const opts = q.options as MatchingOpts;
    return Math.max(1, (opts.leftItems ?? []).filter(Boolean).length);
  }
  if (q.type === "matching_3col") {
    const opts = q.options as Matching3ColOpts;
    return Math.max(1, (opts.rows ?? []).filter((r) => r.a || r.b || r.c).length);
  }
  if (q.type === "multi_select") {
    const opts = q.options as MultiSelectOpts;
    return Math.max(1, opts.maxSelect ?? 1);
  }
  if (q.type === "fill_blank_dropdown") {
    const opts = q.options as FillBlankDropdownOpts;
    return Math.max(1, (opts.sentences ?? []).filter(Boolean).length);
  }
  if (q.type === "table_fill_blank") {
    const opts = q.options as TableFillBlankOpts;
    const blanks = (opts.rows ?? []).flat().reduce((acc, cell) => acc + (cell.match(/_{3,}/g) || []).length, 0);
    return Math.max(1, blanks);
  }
  return 1;
}

function matchingRowAnswered(answers: AnswerMap, qId: number, rowIdx: number): boolean {
  const current = (answers[qId] as Record<number, string> | undefined) ?? {};
  return !!current[rowIdx];
}

// ─────────────────────────────────────────────
// Answer correctness checker
// ─────────────────────────────────────────────
function computeCorrectness(
  q: { id: number; type: string; options: unknown },
  answers: AnswerMap,
): { allCorrect: boolean; label: string } {
  const opts = q.options as Record<string, unknown>;
  const ans = answers[q.id];
  const str = (v: unknown) => String(v ?? "").trim().toLowerCase();

  switch (q.type) {
    case "fill_blank": {
      const blanks = (opts.blanks as string[]) ?? [];
      const student = (ans as string[]) ?? [];
      const allCorrect = blanks.every((b, i) => str(student[i]) === str(b));
      return { allCorrect, label: allCorrect ? "" : `Correct: ${blanks.join(" / ")}` };
    }
    case "fill_blank_dropdown": {
      const sentences = ((opts.sentences as string[]) ?? []).filter(Boolean);
      const correct = (opts.correct as string[]) ?? [];
      const student = (ans as Record<number, string>) ?? {};
      const allCorrect = sentences.every((_, i) => student[i] === correct[i]);
      return { allCorrect, label: allCorrect ? "" : `Correct: ${correct.join(" / ")}` };
    }
    case "dropdown": {
      const allCorrect = (ans as string) === opts.correct;
      return { allCorrect, label: allCorrect ? "" : `Correct: ${opts.correct}` };
    }
    case "choose_word": {
      const allCorrect = str(ans) === str(opts.correct);
      return { allCorrect, label: allCorrect ? "" : `Correct: ${opts.correct}` };
    }
    case "short_answer": {
      if (!opts.correct) return { allCorrect: true, label: "" };
      const allCorrect = str(ans) === str(opts.correct);
      return { allCorrect, label: allCorrect ? "" : `Correct: ${opts.correct}` };
    }
    case "true_false_ng": {
      const allCorrect = (ans as string) === opts.correct;
      return { allCorrect, label: allCorrect ? "" : `Correct: ${opts.correct}` };
    }
    case "multi_select": {
      const correct = [...(opts.correct as number[])].sort((a, b) => a - b);
      const student = [...((ans as number[]) ?? [])].sort((a, b) => a - b);
      const allCorrect = JSON.stringify(correct) === JSON.stringify(student);
      const correctLabels = correct.map((i) => (opts.options as string[])[i]).join(", ");
      return { allCorrect, label: allCorrect ? "" : `Correct: ${correctLabels}` };
    }
    case "matching":
    case "drag_match": {
      const leftItems = ((opts.leftItems as string[]) ?? []).filter(Boolean);
      const rightItems = (opts.rightItems as string[]) ?? [];
      const pairs = (opts.pairs as { left: number; right: number }[]) ?? [];
      const student = (ans as Record<number, string>) ?? {};
      const allCorrect = leftItems.every((_, i) => {
        const pair = pairs.find((p) => p.left === i);
        const correctRight = pair !== undefined ? rightItems[pair.right] : "";
        return student[i] === correctRight;
      });
      return { allCorrect, label: allCorrect ? "" : "Some matches are incorrect" };
    }
    case "table_fill_blank": {
      const correct = (opts.correct as string[]) ?? [];
      const student = (ans as string[]) ?? [];
      if (!correct.length) return { allCorrect: true, label: "" };
      const allCorrect = correct.every((c, i) => str(student[i]) === str(c));
      return { allCorrect, label: allCorrect ? "" : `Correct: ${correct.join(" / ")}` };
    }
    default:
      return { allCorrect: true, label: "" };
  }
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
  const parts = opts.sentence.replace(/_{3,}/g, "___").split("___");
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

function FillBlankDropdownQuestion({
  opts, qId, answers, setAnswers, slotStart,
}: { opts: FillBlankDropdownOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; slotStart: number }) {
  const current = (answers[qId] as Record<number, string> | undefined) ?? {};
  const sentences = opts.sentences.filter(Boolean);
  const slotEnd = slotStart + sentences.length - 1;
  const rangeLabel = sentences.length > 1 ? `Questions ${slotStart}–${slotEnd}` : `Question ${slotStart}`;
  const setVal = (i: number, val: string) => setAnswers({ ...answers, [qId]: { ...current, [i]: val } });
  return (
    <div id={`q-${qId}`} className="space-y-3">
      <p className="text-[15px] font-bold text-[#2d6a2d] dark:text-green-400">{rangeLabel}</p>
      {opts.instruction && (
        <div className="text-sm leading-relaxed space-y-0.5">
          {opts.instruction.split("\n").map((line, li) => (
            <p key={li}>{line}</p>
          ))}
        </div>
      )}
      <div className="space-y-3 mt-1">
        {sentences.map((sentence, i) => {
          const slotNum = slotStart + i;
          const val = current[i] ?? "";
          return (
            <div key={i} className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm leading-relaxed">
              <span className="font-medium text-muted-foreground w-6 shrink-0">{slotNum}</span>
              <span className="flex-1 min-w-0">{sentence}</span>
              <span className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 select-none",
                val ? "bg-[#2563EB] text-white" : "bg-[#2563EB]/20 text-[#2563EB] dark:text-blue-300"
              )}>
                {slotNum}
              </span>
              <select
                className={cn(
                  "border-2 rounded-full px-3 py-0.5 text-sm bg-white dark:bg-transparent focus:outline-none transition-colors",
                  val
                    ? "border-[#2563EB] text-[#2563EB] dark:border-blue-400 dark:text-blue-300"
                    : "border-[#c7cfe0] text-muted-foreground dark:border-border"
                )}
                value={val}
                onChange={(e) => setVal(i, e.target.value)}
              >
                <option value=""> </option>
                {opts.choices.filter(Boolean).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
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
      {opts.instruction && (
        <p className="text-sm text-muted-foreground italic mb-2">{opts.instruction}</p>
      )}
      <div className="grid grid-cols-[24px_1fr_1fr] gap-2 text-xs font-semibold text-muted-foreground px-1 mb-1">
        <span />
        <span>{opts.leftColumnName || "Column A"}</span>
        <span>{opts.rightColumnName || "Column B"}</span>
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
// Drag & Drop Matching helper components
// ─────────────────────────────────────────────

function DraggableChip({ value, isPlaced }: { value: string; isPlaced?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `chip:${value}` });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-semibold cursor-grab active:cursor-grabbing select-none touch-none transition-all",
        isDragging && "opacity-50 scale-105 shadow-xl z-50",
        isPlaced
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-background border border-border shadow-sm hover:border-primary hover:shadow-md"
      )}
    >
      {value}
    </div>
  );
}

function PoolDropZone({ poolChips }: { poolChips: string[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-wrap gap-2 p-3 rounded-xl border-2 border-dashed min-h-[54px] transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/20"
      )}
    >
      {poolChips.length === 0 && (
        <span className="text-xs text-muted-foreground/50 select-none self-center">
          All answers placed — drag back to unplace
        </span>
      )}
      {poolChips.map((chip) => (
        <DraggableChip key={chip} value={chip} />
      ))}
    </div>
  );
}

function RowDropZone({ rowIdx, placedValue }: { rowIdx: number; placedValue?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `row:${rowIdx}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[36px] rounded-lg border-2 border-dashed flex items-center px-2.5 py-1 transition-colors",
        isOver
          ? "border-primary bg-primary/8 scale-[1.01]"
          : placedValue
          ? "border-primary/40 bg-primary/5"
          : "border-muted-foreground/25 bg-muted/10"
      )}
    >
      {placedValue ? (
        <DraggableChip value={placedValue} isPlaced />
      ) : (
        <span className="text-xs text-muted-foreground/40 select-none">Drop answer here…</span>
      )}
    </div>
  );
}

function DragMatchQuestion({
  opts, qId, answers, setAnswers, startNum,
}: { opts: DragMatchOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; startNum: number }) {
  const current = (answers[qId] as Record<number, string>) ?? {};

  const allChips = useMemo(
    () => shuffleStable(opts.rightItems.filter(Boolean), qId),
    [opts.rightItems, qId]
  );
  const usedValues = new Set(Object.values(current));
  const poolChips = allChips.filter((v) => !usedValues.has(v));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const chipValue = String(active.id).replace(/^chip:/, "");
    const targetId = String(over.id);
    const newCurrent = { ...current };

    Object.keys(newCurrent).forEach((key) => {
      if (newCurrent[Number(key)] === chipValue) delete newCurrent[Number(key)];
    });

    if (targetId.startsWith("row:")) {
      const rowIdx = Number(targetId.replace("row:", ""));
      newCurrent[rowIdx] = chipValue;
    }

    setAnswers({ ...answers, [qId]: newCurrent });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div id={`q-${qId}`} className="space-y-3">
        {opts.instruction && (
          <p className="text-sm text-muted-foreground italic mb-1">{opts.instruction}</p>
        )}

        <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1">
          Answer pool — drag to place
        </div>
        <PoolDropZone poolChips={poolChips} />

        <div className="space-y-1.5 mt-3">
          <div className="grid grid-cols-[24px_1fr_1fr] gap-2 text-xs font-semibold text-muted-foreground px-1 mb-1">
            <span />
            <span>Prompt</span>
            <span>Your Answer</span>
          </div>
          {opts.leftItems.filter(Boolean).map((item, i) => {
            const placed = current[i];
            return (
              <div key={i} className="grid grid-cols-[24px_1fr_1fr] gap-3 items-center">
                <span className={cn(
                  "text-xs font-bold shrink-0",
                  placed ? "text-primary" : "text-primary/50"
                )}>
                  {startNum + i}
                </span>
                <p className="text-sm px-3 py-2 bg-muted/60 rounded">{item}</p>
                <RowDropZone rowIdx={i} placedValue={placed} />
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}

function Matching3ColQuestion({
  opts, qId, answers, setAnswers, startNum,
}: { opts: Matching3ColOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; startNum: number }) {
  const colKeys: Array<"a" | "b" | "c"> = ["a", "b", "c"];
  const current = (answers[qId] as Record<number, string>) ?? {};
  const rows = (opts.rows ?? []).filter((r) => r.a || r.b || r.c);

  const update = (rowIdx: number, val: string) => {
    setAnswers({ ...answers, [qId]: { ...current, [rowIdx]: val } });
  };

  const answerIdx = opts.answerColIndex ?? 2;
  const answerKey = colKeys[answerIdx];
  const allChoices = Array.from(new Set(rows.map((r) => r[answerKey]).filter(Boolean)));

  return (
    <div id={`q-${qId}`} className="space-y-2">
      {opts.instruction && (
        <p className="text-sm text-muted-foreground italic mb-2">{opts.instruction}</p>
      )}
      <div className="grid gap-2 text-xs font-semibold text-muted-foreground px-1 mb-1" style={{ gridTemplateColumns: "20px 1fr 1fr 1fr" }}>
        <span />
        {opts.columns.map((col, i) => (
          <span key={i} className={cn(i === answerIdx && "text-primary")}>{col}</span>
        ))}
      </div>
      {rows.map((row, rowIdx) => {
        const rowAnswered = !!current[rowIdx];
        return (
          <div key={rowIdx} className="grid gap-2 items-center" style={{ gridTemplateColumns: "20px 1fr 1fr 1fr" }}>
            <span className={cn("text-xs font-bold shrink-0", rowAnswered ? "text-primary" : "text-primary/60")}>
              {startNum + rowIdx}
            </span>
            {colKeys.map((key, colIdx) =>
              colIdx === answerIdx ? (
                <Select key={key} value={current[rowIdx] ?? ""} onValueChange={(val) => update(rowIdx, val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {allChoices.map((choice, ci) => (
                      <SelectItem key={ci} value={choice} className="text-sm">{choice}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p key={key} className="text-sm px-3 py-2 bg-muted/60 rounded">{row[key]}</p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

function MultiSelectQuestion({
  opts, qId, answers, setAnswers, slotStart,
}: { opts: MultiSelectOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; slotStart: number }) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const selected: number[] = (answers[qId] as number[] | undefined) ?? [];
  const maxSelect = opts.maxSelect ?? 1;
  const slotEnd = slotStart + maxSelect - 1;
  const toggle = (i: number) => {
    if (selected.includes(i)) {
      setAnswers({ ...answers, [qId]: selected.filter((s) => s !== i) });
    } else if (selected.length < maxSelect) {
      setAnswers({ ...answers, [qId]: [...selected, i].sort((a, b) => a - b) });
    }
  };
  const rangeLabel = maxSelect > 1 ? `Questions ${slotStart}–${slotEnd}` : `Question ${slotStart}`;
  return (
    <div id={`q-${qId}`} className="space-y-3">
      <p className="text-[15px] font-bold text-[#2d6a2d] dark:text-green-400">{rangeLabel}</p>
      {opts.instruction && (
        <div className="text-sm leading-relaxed space-y-0.5">
          {opts.instruction.split("\n").map((line, li) => (
            <p key={li}>{line}</p>
          ))}
        </div>
      )}
      <div className="space-y-2 mt-2">
        {opts.options.filter(Boolean).map((option, i) => {
          const isSelected = selected.includes(i);
          const isDisabled = !isSelected && selected.length >= maxSelect;
          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled}
              onClick={() => toggle(i)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded text-left transition-colors",
                isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/60",
              )}
            >
              <span className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 mt-0.5",
                isSelected ? "bg-[#2d6a2d] text-white dark:bg-green-700" : "bg-muted text-muted-foreground"
              )}>
                {letters[i] ?? i + 1}
              </span>
              <span className={cn(
                "w-5 h-5 flex items-center justify-center border-2 rounded-sm shrink-0 mt-0.5 transition-colors",
                isSelected ? "border-[#2d6a2d] bg-[#2d6a2d] dark:border-green-600 dark:bg-green-600" : "border-[#b0b8c9] bg-white dark:bg-transparent dark:border-border"
              )}>
                {isSelected && (
                  <svg viewBox="0 0 12 10" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="1,5 4,9 11,1" />
                  </svg>
                )}
              </span>
              <span className="text-sm leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground pl-1">
        {selected.length}/{maxSelect} selected
        {selected.length === maxSelect && <span className="text-green-600 dark:text-green-400 ml-1">✓ Complete</span>}
      </p>
    </div>
  );
}

function TrueFalseNgQuestion({
  opts, qId, answers, setAnswers, slotStart,
}: { opts: TrueFalseNgOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; slotStart: number }) {
  const choices = ["TRUE", "FALSE", "NOT GIVEN"] as const;
  const selected = (answers[qId] as string) ?? "";
  return (
    <div id={`q-${qId}`} className="flex items-start gap-2">
      <QNum num={slotStart} answered={!!selected} />
      <div className="flex-1 space-y-2.5">
        <p className="text-sm leading-relaxed">{opts.statement}</p>
        <div className="flex flex-wrap gap-2">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setAnswers({ ...answers, [qId]: selected === choice ? "" : choice })}
              className={`px-4 py-1.5 rounded border text-xs font-bold tracking-wider transition-colors ${
                selected === choice
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "border-[#c7cfe0] text-[#3b5285] hover:border-[#2563EB] hover:text-[#2563EB] bg-white dark:bg-transparent dark:border-border dark:text-muted-foreground dark:hover:border-primary dark:hover:text-primary"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShortAnswerQuestion({
  opts, qId, answers, setAnswers, slotStart,
}: { opts: ShortAnswerOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; slotStart: number }) {
  const answered = !!(answers[qId] as string)?.trim();
  const wordLimit = opts.wordLimit;
  return (
    <div id={`q-${qId}`} className="flex items-start gap-2">
      <QNum num={slotStart} answered={answered} />
      <div className="flex-1 space-y-2">
        <p className="text-sm leading-relaxed">{opts.prompt}</p>
        <textarea
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-primary resize-none min-h-[80px]"
          placeholder={wordLimit ? `Write your answer (up to ${wordLimit} word${wordLimit !== 1 ? "s" : ""})…` : "Write your answer…"}
          value={(answers[qId] as string) ?? ""}
          onChange={(e) => setAnswers({ ...answers, [qId]: e.target.value })}
          rows={3}
        />
        {wordLimit && (
          <p className="text-xs text-muted-foreground">
            Word limit: {wordLimit} word{wordLimit !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function WritingQuestion({
  opts, qId, answers, setAnswers,
}: { opts: WritingOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void }) {
  const text = (answers[qId] as string) ?? "";
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const minWords = opts.minWords;
  const belowMin = minWords !== undefined && wordCount < minWords;

  return (
    <div id={`q-${qId}`} className="flex flex-col gap-3">
      {opts.taskTitle && (
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{opts.taskTitle}</p>
      )}
      <textarea
        className={cn(
          "w-full border rounded-lg px-4 py-3 text-sm bg-background focus:outline-none resize-none",
          belowMin
            ? "border-amber-400 focus:border-amber-500"
            : "border-border focus:border-primary"
        )}
        placeholder="Type here…"
        rows={18}
        value={text}
        onChange={(e) => setAnswers({ ...answers, [qId]: e.target.value })}
        style={{ minHeight: "320px" }}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Words Count:{" "}
          <span className={cn("font-semibold", belowMin ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
            {wordCount}
          </span>
          {minWords && (
            <span className="ml-1.5 text-muted-foreground">/ min {minWords}</span>
          )}
        </span>
        {belowMin && (
          <span className="text-amber-600 dark:text-amber-400">
            {minWords! - wordCount} more word{minWords! - wordCount !== 1 ? "s" : ""} needed
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Table Fill-in-the-Blank question
// ─────────────────────────────────────────────
function TableFillBlankQuestion({
  opts, qId, answers, setAnswers, slotStart,
}: { opts: TableFillBlankOpts; qId: number; answers: AnswerMap; setAnswers: (a: AnswerMap) => void; slotStart: number }) {
  // Pre-compute a flat map: for each [r][c] cell, which blank indices it owns
  const cellBlankMap: number[][][] = [];
  let globalIdx = 0;
  for (const row of opts.rows) {
    const rowMap: number[][] = [];
    for (const cell of row) {
      const count = (cell.match(/_{3,}/g) || []).length;
      rowMap.push(Array.from({ length: count }, (_, i) => globalIdx + i));
      globalIdx += count;
    }
    cellBlankMap.push(rowMap);
  }
  const totalBlanks = globalIdx;
  const current = (answers[qId] as string[] | undefined) ?? Array(Math.max(1, totalBlanks)).fill("");

  function update(i: number, val: string) {
    const next = [...current];
    while (next.length <= i) next.push("");
    next[i] = val;
    setAnswers({ ...answers, [qId]: next });
  }

  function renderCell(cell: string, r: number, c: number) {
    const blankIndices = cellBlankMap[r]?.[c] ?? [];
    const parts = cell.split(/_{3,}/);
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && blankIndices[i] !== undefined && (
              <span className="inline-flex items-baseline gap-0.5 mx-0.5">
                <span className="text-[9px] font-bold text-primary/50 leading-none">{slotStart + blankIndices[i]}</span>
                <input
                  type="text"
                  className="inline-block border-0 border-b-2 border-primary/40 px-1 text-sm w-28 bg-transparent focus:outline-none focus:border-primary"
                  placeholder="answer"
                  value={current[blankIndices[i]] ?? ""}
                  onChange={(e) => update(blankIndices[i], e.target.value)}
                />
              </span>
            )}
          </span>
        ))}
      </>
    );
  }

  const answered = current.some(Boolean);

  return (
    <div id={`q-${qId}`} className="space-y-3">
      {opts.instruction && (
        <p className="text-xs text-muted-foreground italic border-l-4 border-primary pl-3">{opts.instruction}</p>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          {opts.headers.some(Boolean) && (
            <thead>
              <tr className="bg-muted/60">
                {opts.headers.map((h, ci) => (
                  <th key={ci} className="border-b border-border px-4 py-2 text-xs font-semibold text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {opts.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-border/30 px-4 py-2 align-middle leading-7">
                    {renderCell(cell, ri, ci)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
type QuizPartFull = {
  name: string; from: number; to: number;
  instructions?: string[];
  passageText?: string;
  imageUrls?: string[]; audioUrls?: string[];
  /** @deprecated */ imageUrl?: string;
  /** @deprecated */ audioUrl?: string;
};

export default function StudentQuizTake() {
  const [, params] = useRoute("/student/quizzes/:id");
  const quizId = Number(params?.id);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const urlParams = new URLSearchParams(search);

  const { data: quiz, isLoading } = useGetQuiz(quizId);

  // Fetch the linked lesson so its content can serve as the reading passage fallback
  const quizLessonId = (quiz as { lessonId?: number | null } | undefined)?.lessonId ?? null;
  const quizCourseId = quiz?.courseId ?? null;
  const { data: linkedLesson } = useGetLesson(
    quizCourseId ?? 0,
    quizLessonId ?? 0,
    { query: { enabled: !!(quizCourseId && quizLessonId) } },
  );

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [validated, setValidated] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [score, setScore] = useState<{ answered: number; total: number } | null>(null);
  const [activePart, setActivePart] = useState(0);

  // Student identity — from URL params (when navigating from course view) or entered manually
  const [studentName, setStudentName] = useState(urlParams.get("studentName") ?? "");
  const [studentEmail, setStudentEmail] = useState(urlParams.get("studentEmail") ?? "");
  const [enrollmentId] = useState(urlParams.get("enrollmentId") ?? "");
  const [identityOpen, setIdentityOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    passageText?: string;
    imageUrls: string[];
    audioUrls: string[];
  };

  function resolveImageUrls(p: QuizPartFull): string[] {
    if (p.imageUrls && p.imageUrls.length > 0) return p.imageUrls.filter(Boolean);
    if (p.imageUrl) return [p.imageUrl];
    return [];
  }
  function resolveAudioUrls(p: QuizPartFull): string[] {
    if (p.audioUrls && p.audioUrls.length > 0) return p.audioUrls.filter(Boolean);
    if (p.audioUrl) return [p.audioUrl];
    return [];
  }

  const tabs: Tab[] = [
    ...activeParts.map((p) => ({
      label: p.name.toUpperCase(),
      from: p.from, to: p.to,
      instructions: p.instructions,
      passageText: p.passageText,
      imageUrls: resolveImageUrls(p),
      audioUrls: resolveAudioUrls(p),
    })),
    ...(ungroupedQs.length > 0 ? [{
      label: "QUESTIONS",
      from: maxTo + 1, to: sortedQs.length,
      instructions: undefined, passageText: undefined, imageUrls: [] as string[], audioUrls: [] as string[],
    }] : []),
  ];

  const allTabs: Tab[] = tabs.length > 0 ? tabs : [{
    label: "QUESTIONS",
    from: 1, to: sortedQs.length,
    imageUrls: [],
    audioUrls: [],
  }];

  const clampedPart = Math.min(activePart, allTabs.length - 1);
  const currentTab = allTabs[clampedPart] ?? allTabs[0];

  // Left panel: current tab media OR quiz-level media/passageText OR linked lesson content
  const quizPassage = (quiz as { passageText?: string })?.passageText;
  const quizImageUrls = ((quiz as { imageUrls?: string[] })?.imageUrls ?? []).filter(Boolean);
  const quizAudioUrls = ((quiz as { audioUrls?: string[] })?.audioUrls ?? []).filter(Boolean);
  const tabPassage = currentTab.passageText;
  const tabImages = currentTab.imageUrls?.length ? currentTab.imageUrls : quizImageUrls;
  const tabAudios = currentTab.audioUrls?.length ? currentTab.audioUrls : quizAudioUrls;
  // Fallback: use the linked lesson's content as the reading passage when no quiz/part passage is set
  const lessonPassage = (!tabPassage && !quizPassage && linkedLesson?.content) ? linkedLesson.content : null;
  const hasLeftPanel = !!(tabPassage || tabImages.length > 0 || tabAudios.length > 0 || quizPassage || lessonPassage);
  const leftPassage = tabPassage || quizPassage || lessonPassage;

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
    if (q.type === "matching_3col") {
      const opts = q.options as Matching3ColOpts;
      const rows = (opts.rows ?? []).filter((r) => r.a || r.b || r.c).length;
      for (let i = 0; i < rows; i++) if (matchingRowAnswered(answers, q.id, i)) sum++;
      return sum;
    }
    if (q.type === "multi_select") {
      const opts = q.options as MultiSelectOpts;
      const selected: number[] = (answers[q.id] as number[] | undefined) ?? [];
      const slots = Math.max(1, opts.maxSelect ?? 1);
      for (let i = 0; i < slots; i++) if (i < selected.length) sum++;
      return sum;
    }
    if (q.type === "fill_blank_dropdown") {
      const opts = q.options as FillBlankDropdownOpts;
      const current = (answers[q.id] as Record<number, string> | undefined) ?? {};
      const rows = (opts.sentences ?? []).filter(Boolean).length;
      for (let i = 0; i < rows; i++) if (current[i]) sum++;
      return sum;
    }
    if (q.type === "table_fill_blank") {
      const opts = q.options as TableFillBlankOpts;
      const totalBlanks = (opts.rows ?? []).flat().reduce((acc, cell) => acc + (cell.match(/_{3,}/g) || []).length, 0);
      const current = (answers[q.id] as string[] | undefined) ?? [];
      for (let i = 0; i < totalBlanks; i++) if (current[i]) sum++;
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

  function openSubmitFlow() {
    if (!studentEmail.trim()) {
      setSubmitOpen(false);
      setIdentityOpen(true);
    } else {
      doSubmit();
    }
  }

  async function doSubmit() {
    setIsSubmitting(true);
    try {
      await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim() || null,
          studentEmail: studentEmail.trim(),
          enrollmentId: enrollmentId || null,
          answers,
          totalSlots,
          answeredSlots,
        }),
      });
    } catch {
      // Submission stored client-side regardless
    } finally {
      setIsSubmitting(false);
    }
    setScore({ answered: answeredSlots, total: totalSlots });
    setSubmitted(true);
    setSubmitOpen(false);
    setIdentityOpen(false);
    setReviewOpen(false);
  }

  function handleSubmit() {
    openSubmitFlow();
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
  if (submitted && score && !validated) {
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
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => { setValidated(true); setActivePart(0); }}
          >
            Validate Answers
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setAnswers({});
              setScore(null);
              setSubmitted(false);
              setValidated(false);
              setActivePart(0);
            }}
          >
            Retake Quiz
          </Button>
          <Button onClick={() => setLocation("/student/quizzes")}>
            Return to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">

      {/* ── HEADER ── */}
      {validated ? (
        <header className="flex-shrink-0 h-12 bg-amber-600 text-white flex items-center px-4 gap-3 z-10">
          <span className="font-semibold text-sm tracking-wide truncate flex-1">📋 Review: {quiz.title}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white shrink-0"
            onClick={() => { setValidated(false); }}
          >
            ← Back to Results
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-white text-amber-700 hover:bg-white/90 font-semibold shrink-0"
            onClick={() => { setAnswers({}); setScore(null); setSubmitted(false); setValidated(false); setActivePart(0); }}
          >
            Reattempt
          </Button>
        </header>
      ) : (
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
      )}

      {/* ── MAIN PANELS ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Passage / Media — always visible; falls back to quiz info when no content */}
        <div className="w-1/2 overflow-y-auto border-r bg-card">
          {/* Single-image-only: fill the panel with minimal padding */}
          {hasLeftPanel && tabImages.length === 1 && !leftPassage && tabAudios.length === 0 ? (
            <div className="flex items-start justify-center w-full h-full p-1">
              <img
                src={getServingUrl(tabImages[0])}
                alt="Reading image"
                className="rounded-lg border w-full object-contain"
                style={{ maxHeight: "calc(100vh - 3.5rem)", minHeight: "min(600px, calc(100vh - 3.5rem))" }}
              />
            </div>
          ) : (
          <div className="p-6 max-w-2xl mx-auto">
            {hasLeftPanel ? (
              <>
                {tabImages.map((src, i) => (
                  <img key={i} src={getServingUrl(src)} alt={`Reading image ${i + 1}`} className="rounded-lg border mb-4 w-full object-contain max-h-72" />
                ))}
                {tabAudios.map((src, i) => (
                  <audio key={i} controls src={getServingUrl(src)} className="w-full mb-4" />
                ))}
                {leftPassage && (
                  <>
                    {currentTab.label !== "QUESTIONS" && currentTab.label && (
                      <h2 className="text-base font-bold mb-4 text-foreground">{quiz.title}</h2>
                    )}
                    <div
                      className="text-sm leading-7 text-foreground prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: leftPassage }}
                    />
                  </>
                )}
              </>
            ) : (
              /* No passage/media for this section — show quiz info */
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">{quiz.title}</h2>
                  {(quiz as { description?: string }).description && (
                    <div
                      className="text-sm text-muted-foreground mt-1 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: (quiz as { description?: string }).description! }}
                    />
                  )}
                </div>
                {currentTab.instructions?.some(Boolean) && (
                  <div className="text-sm text-foreground whitespace-pre-line leading-relaxed border-l-4 border-primary pl-3">
                    {currentTab.instructions.filter(Boolean).join("\n")}
                  </div>
                )}
                <div className="rounded-lg bg-muted/60 p-4 text-xs text-muted-foreground leading-relaxed space-y-1">
                  <p className="font-semibold text-foreground text-sm mb-2">Section: {currentTab.label}</p>
                  {allTabs.map((t, i) => {
                    const sr = tabSlotRanges[i];
                    return (
                      <p key={i} className={cn("flex items-center gap-2", i === clampedPart && "text-primary font-medium")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", i === clampedPart ? "bg-primary" : "bg-muted-foreground/40")} />
                        {t.label !== "QUESTIONS" ? t.label : "Questions"}: {sr.min}–{sr.max}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* RIGHT: All questions, all parts, continuous scroll */}
        <div
          className="w-1/2 overflow-y-auto bg-muted/10"
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
                    {/* Part section separator + header */}
                    {tabIdx > 0 && (
                      <div className="pt-4 pb-1 space-y-0.5">
                        <div className="h-[4px] rounded-full bg-red-500" />
                        <div className="h-[2px] rounded-full bg-red-300/50" />
                      </div>
                    )}
                    <div className="space-y-3">
                      <h3 className="text-base font-extrabold tracking-wide text-foreground uppercase">
                        {tab.label !== "QUESTIONS"
                          ? `${tab.label}: Questions ${slotRange?.min ?? tab.from}–${slotRange?.max ?? tab.to}`
                          : `Questions ${slotRange?.min ?? tab.from}–${slotRange?.max ?? tab.to}`}
                      </h3>
                      {tab.instructions?.some(Boolean) && (
                        <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed border-l-4 border-primary pl-3">
                          {tab.instructions.filter(Boolean).join("\n")}
                        </div>
                      )}
                    </div>

                    {/* Questions */}
                    <div className={cn("space-y-5", validated && "pointer-events-none select-none")}>
                      {tabQs.map((q) => {
                        const si = slotMap.get(q.id)!;
                        const slotStart = si.slotStart + 1;
                        const opts = q.options as FillBlankOpts & DropdownOpts & ChooseWordOpts & MatchingOpts;
                        const vResult = validated ? computeCorrectness(q, answers) : null;

                        return (
                          <div
                            key={q.id}
                            className={cn(
                              "rounded-lg p-2 -mx-2 transition-colors",
                              vResult?.allCorrect === true && "bg-green-50 dark:bg-green-950/20 border border-green-300",
                              vResult?.allCorrect === false && "bg-red-50 dark:bg-red-950/20 border border-red-300",
                            )}
                          >
                            {q.questionText && (
                              <p className="text-xs text-muted-foreground mb-1 italic">{q.questionText}</p>
                            )}
                            {q.type === "fill_blank_dropdown" && (
                              <FillBlankDropdownQuestion opts={opts as FillBlankDropdownOpts} qId={q.id} answers={answers} setAnswers={setAnswers} slotStart={slotStart} />
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
                            {q.type === "drag_match" && (
                              <DragMatchQuestion opts={opts as DragMatchOpts} qId={q.id} answers={answers} setAnswers={setAnswers} startNum={slotStart} />
                            )}
                            {q.type === "matching_3col" && (
                              <Matching3ColQuestion opts={opts as Matching3ColOpts} qId={q.id} answers={answers} setAnswers={setAnswers} startNum={slotStart} />
                            )}
                            {q.type === "short_answer" && (
                              <ShortAnswerQuestion opts={opts as ShortAnswerOpts} qId={q.id} answers={answers} setAnswers={setAnswers} slotStart={slotStart} />
                            )}
                            {q.type === "true_false_ng" && (
                              <TrueFalseNgQuestion opts={opts as TrueFalseNgOpts} qId={q.id} answers={answers} setAnswers={setAnswers} slotStart={slotStart} />
                            )}
                            {q.type === "multi_select" && (
                              <MultiSelectQuestion opts={opts as MultiSelectOpts} qId={q.id} answers={answers} setAnswers={setAnswers} slotStart={slotStart} />
                            )}
                            {q.type === "writing" && (
                              <WritingQuestion opts={opts as WritingOpts} qId={q.id} answers={answers} setAnswers={setAnswers} />
                            )}
                            {q.type === "table_fill_blank" && (
                              <TableFillBlankQuestion opts={opts as TableFillBlankOpts} qId={q.id} answers={answers} setAnswers={setAnswers} slotStart={slotStart} />
                            )}
                            {/* Validation result badge */}
                            {vResult && (
                              <p className={cn(
                                "mt-2 text-xs font-semibold",
                                vResult.allCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {vResult.allCorrect ? "✓ Correct" : `✗ Incorrect${vResult.label ? ` — ${vResult.label}` : ""}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Section break between parts */}
                    {tabIdx < allTabs.length - 1 && (
                      <div className="my-6">
                        <div className="h-px bg-border" />
                        <div className="h-px bg-border/40 mt-0.5" />
                      </div>
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
          <div className="flex border-b items-stretch">
            <button
              onClick={() => {
                const prev = clampedPart - 1;
                if (prev >= 0) { setActivePart(prev); scrollToPartSection(prev); }
              }}
              disabled={clampedPart === 0}
              className="px-3 text-xs font-bold border-r disabled:opacity-30 hover:bg-muted transition-colors shrink-0"
            >
              ← Prev
            </button>
            {allTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => { setActivePart(idx); scrollToPartSection(idx); }}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold tracking-wide transition-colors",
                  clampedPart === idx
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab.label}: {tabSlotRanges[idx]?.min ?? tab.from}–{tabSlotRanges[idx]?.max ?? tab.to}
              </button>
            ))}
            <button
              onClick={() => {
                const next = clampedPart + 1;
                if (next < allTabs.length) { setActivePart(next); scrollToPartSection(next); }
              }}
              disabled={clampedPart >= allTabs.length - 1}
              className="px-3 text-xs font-bold border-l disabled:opacity-30 hover:bg-muted transition-colors shrink-0"
            >
              Next →
            </button>
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
            if (q.type === "matching_3col") {
              const opts = q.options as Matching3ColOpts;
              const rows = (opts.rows ?? []).filter((r) => r.a || r.b || r.c).length;
              return Array.from({ length: rows }, (_, ri) => {
                const done = matchingRowAnswered(answers, q.id, ri);
                const slotNum = si.slotStart + ri + 1;
                return (
                  <button
                    key={`${q.id}-m3-${ri}`}
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
            if (q.type === "multi_select") {
              const opts = q.options as MultiSelectOpts;
              const slots = Math.max(1, opts.maxSelect ?? 1);
              const selected: number[] = (answers[q.id] as number[] | undefined) ?? [];
              return Array.from({ length: slots }, (_, ri) => {
                const done = ri < selected.length;
                const slotNum = si.slotStart + ri + 1;
                return (
                  <button
                    key={`${q.id}-ms-${ri}`}
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
            if (q.type === "fill_blank_dropdown") {
              const opts = q.options as FillBlankDropdownOpts;
              const current = (answers[q.id] as Record<number, string> | undefined) ?? {};
              const rows = (opts.sentences ?? []).filter(Boolean).length;
              return Array.from({ length: rows }, (_, ri) => {
                const done = !!current[ri];
                const slotNum = si.slotStart + ri + 1;
                return (
                  <button
                    key={`${q.id}-fbd-${ri}`}
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
              if (q.type === "matching_3col") {
                const opts = q.options as Matching3ColOpts;
                const rows = (opts.rows ?? []).filter((r) => r.a || r.b || r.c).length;
                return Array.from({ length: rows }, (_, ri) => {
                  const done = matchingRowAnswered(answers, q.id, ri);
                  return (
                    <button
                      key={`${q.id}-m3r-${ri}`}
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
              if (q.type === "multi_select") {
                const opts = q.options as MultiSelectOpts;
                const slots = Math.max(1, opts.maxSelect ?? 1);
                const selected: number[] = (answers[q.id] as number[] | undefined) ?? [];
                return Array.from({ length: slots }, (_, ri) => {
                  const done = ri < selected.length;
                  return (
                    <button
                      key={`${q.id}-ms-${ri}`}
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
              if (q.type === "fill_blank_dropdown") {
                const opts = q.options as FillBlankDropdownOpts;
                const current = (answers[q.id] as Record<number, string> | undefined) ?? {};
                const rows = (opts.sentences ?? []).filter(Boolean).length;
                return Array.from({ length: rows }, (_, ri) => {
                  const done = !!current[ri];
                  return (
                    <button
                      key={`${q.id}-fbd-${ri}`}
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
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── IDENTITY DIALOG (when no email provided via URL) ── */}
      <Dialog open={identityOpen} onOpenChange={setIdentityOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Identify Yourself</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Enter your name and email so your instructor can review your submission.</p>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="id-name">Full Name</Label>
              <Input
                id="id-name"
                placeholder="e.g. Jane Smith"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="id-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="id-email"
                type="email"
                placeholder="e.g. jane@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIdentityOpen(false)}>Cancel</Button>
            <Button
              onClick={doSubmit}
              disabled={!studentEmail.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
