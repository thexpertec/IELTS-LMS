import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type QuizPart } from "@/components/quiz/parts-editor";
import { InlinePartSection } from "@/components/quiz/inline-part-section";
import { useRoute, useLocation } from "wouter";
import {
  useGetQuiz,
  useUpdateQuiz,
  useAddQuizQuestion,
  useUpdateQuizQuestion,
  useDeleteQuizQuestion,
  getGetQuizQueryKey,
  useListCourses,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Plus, Trash2, Edit, ClipboardList, Timer, Eye, EyeOff, X, GripVertical, ExternalLink,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types for the eight question formats
// ─────────────────────────────────────────────
type QType = "fill_blank" | "fill_blank_dropdown" | "dropdown" | "choose_word" | "matching" | "matching_3col" | "short_answer" | "true_false_ng" | "multi_select";

interface FillBlankOpts          { sentence: string; blanks: string[] }
interface FillBlankDropdownOpts  { instruction: string; sentences: string[]; choices: string[]; correct: string[] }
interface DropdownOpts           { stem: string; choices: string[]; correct: string }
interface ChooseWordOpts         { instruction: string; wordLimit: number; passageText?: string; imageUrl?: string; correct: string }
interface MatchingOpts           { leftItems: string[]; rightItems: string[]; pairs: { left: number; right: number }[]; instruction?: string }
interface Matching3ColOpts       { columns: [string, string, string]; answerColIndex: 0 | 1 | 2; rows: Array<{ a: string; b: string; c: string }>; instruction?: string }
interface ShortAnswerOpts        { prompt: string; correct?: string; wordLimit?: number }
interface TrueFalseNgOpts        { statement: string; correct: "TRUE" | "FALSE" | "NOT GIVEN" | "" }
interface MultiSelectOpts        { instruction: string; options: string[]; maxSelect: number; correct: number[] }
type QOptions = FillBlankOpts | FillBlankDropdownOpts | DropdownOpts | ChooseWordOpts | MatchingOpts | Matching3ColOpts | ShortAnswerOpts | TrueFalseNgOpts | MultiSelectOpts;

const Q_TYPE_LABELS: Record<QType, string> = {
  fill_blank:          "Fill Blanks — Text Input",
  fill_blank_dropdown: "Fill Blanks — Dropdown",
  dropdown:            "Dropdown Options",
  choose_word:         "Choose One Word",
  matching:            "Column Matching",
  matching_3col:       "3-Column Matching",
  short_answer:        "Short Answer",
  true_false_ng:       "True / False / Not Given",
  multi_select:        "Multiple Selection",
};

const Q_TYPE_COLORS: Record<QType, string> = {
  fill_blank:          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  fill_blank_dropdown: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  dropdown:            "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  choose_word:         "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  matching:            "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  matching_3col:       "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  short_answer:        "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  true_false_ng:       "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  multi_select:        "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

// ─────────────────────────────────────────────
// Default empty option objects
// ─────────────────────────────────────────────
function defaultOptions(type: QType): QOptions {
  switch (type) {
    case "fill_blank":          return { sentence: "", blanks: [""] };
    case "fill_blank_dropdown": return { instruction: "", sentences: ["", ""], choices: ["A", "B", "C"], correct: ["", ""] };
    case "dropdown":            return { stem: "", choices: ["", "", ""], correct: "" };
    case "choose_word":         return { instruction: "Choose ONE WORD from the passage below.", wordLimit: 1, passageText: "", imageUrl: "", correct: "" };
    case "matching":            return { leftItems: ["", ""], rightItems: ["", ""], pairs: [], instruction: "" };
    case "matching_3col":       return { columns: ["Column A", "Column B", "Column C"], answerColIndex: 2, rows: [{ a: "", b: "", c: "" }, { a: "", b: "", c: "" }], instruction: "" };
    case "short_answer":        return { prompt: "", correct: "", wordLimit: undefined };
    case "true_false_ng":       return { statement: "", correct: "" };
    case "multi_select":        return { instruction: "", options: ["", "", "", ""], maxSelect: 2, correct: [] };
  }
}

// ─────────────────────────────────────────────
// Question-option editors
// ─────────────────────────────────────────────
function FillBlankEditor({ opts, onChange }: { opts: FillBlankOpts; onChange: (o: FillBlankOpts) => void }) {
  const updateBlank = (i: number, val: string) => {
    const blanks = [...opts.blanks];
    blanks[i] = val;
    onChange({ ...opts, blanks });
  };
  const addBlank = () => onChange({ ...opts, blanks: [...opts.blanks, ""] });
  const removeBlank = (i: number) => onChange({ ...opts, blanks: opts.blanks.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div>
        <Label>Sentence <span className="text-muted-foreground text-xs">(use ___ for each blank)</span></Label>
        <Textarea
          className="mt-1.5 min-h-[80px]"
          placeholder="The ___ is the capital of France. Paris is known for its ___ tower."
          value={opts.sentence}
          onChange={(e) => onChange({ ...opts, sentence: e.target.value })}
        />
      </div>
      <div>
        <Label>Correct Answers <span className="text-muted-foreground text-xs">(in order of blanks)</span></Label>
        <div className="space-y-2 mt-1.5">
          {opts.blanks.map((blank, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-6">#{i + 1}</span>
              <Input
                placeholder={`Answer for blank ${i + 1}`}
                value={blank}
                onChange={(e) => updateBlank(i, e.target.value)}
              />
              {opts.blanks.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeBlank(i)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addBlank} type="button">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Blank
          </Button>
        </div>
      </div>
    </div>
  );
}

function FillBlankDropdownEditor({ opts, onChange }: { opts: FillBlankDropdownOpts; onChange: (o: FillBlankDropdownOpts) => void }) {
  const setSentence = (i: number, val: string) => {
    const next = [...opts.sentences]; next[i] = val; onChange({ ...opts, sentences: next });
  };
  const setCorrect = (i: number, val: string) => {
    const next = [...opts.correct]; next[i] = val; onChange({ ...opts, correct: next });
  };
  const addSentence = () => onChange({ ...opts, sentences: [...opts.sentences, ""], correct: [...opts.correct, ""] });
  const removeSentence = (i: number) => onChange({
    ...opts,
    sentences: opts.sentences.filter((_, idx) => idx !== i),
    correct: opts.correct.filter((_, idx) => idx !== i),
  });
  const setChoice = (i: number, val: string) => {
    const next = [...opts.choices]; next[i] = val; onChange({ ...opts, choices: next });
  };
  const addChoice = () => onChange({ ...opts, choices: [...opts.choices, ""] });
  const removeChoice = (i: number) => onChange({ ...opts, choices: opts.choices.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-5">
      <div>
        <Label>Instruction Text <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea
          className="mt-1.5 min-h-[70px]"
          placeholder="e.g. Look at the following statements and match each with the correct person A–C."
          value={opts.instruction}
          onChange={(e) => onChange({ ...opts, instruction: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Shared Dropdown Choices</Label>
        <p className="text-xs text-muted-foreground">These options appear in every dropdown for this question.</p>
        <div className="space-y-1.5 mt-1">
          {opts.choices.map((choice, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                className="h-8 text-sm"
                placeholder={`Choice ${i + 1}`}
                value={choice}
                onChange={(e) => setChoice(i, e.target.value)}
              />
              {opts.choices.length > 2 && (
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeChoice(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={addChoice} className="h-7 text-xs gap-1 mt-1">
            <Plus className="h-3 w-3" /> Add Choice
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Sentences <span className="text-muted-foreground text-xs ml-1">(one per question slot)</span></Label>
          <Button type="button" size="sm" variant="outline" onClick={addSentence} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        <div className="space-y-3 mt-1">
          {opts.sentences.map((sent, i) => (
            <div key={i} className="border border-border rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <Input
                  className="flex-1 h-8 text-sm"
                  placeholder="Sentence text (dropdown appears at end)"
                  value={sent}
                  onChange={(e) => setSentence(i, e.target.value)}
                />
                {opts.sentences.length > 1 && (
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeSentence(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 pl-7">
                <Label className="text-xs shrink-0">Correct Answer</Label>
                <select
                  className="border border-border rounded px-2 py-1 text-sm bg-transparent focus:outline-none focus:border-primary"
                  value={opts.correct[i] ?? ""}
                  onChange={(e) => setCorrect(i, e.target.value)}
                >
                  <option value="">— select —</option>
                  {opts.choices.filter(Boolean).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DropdownEditor({ opts, onChange }: { opts: DropdownOpts; onChange: (o: DropdownOpts) => void }) {
  const updateChoice = (i: number, val: string) => {
    const choices = [...opts.choices];
    choices[i] = val;
    onChange({ ...opts, choices });
  };
  const addChoice = () => onChange({ ...opts, choices: [...opts.choices, ""] });
  const removeChoice = (i: number) => {
    const choices = opts.choices.filter((_, idx) => idx !== i);
    onChange({ ...opts, choices, correct: opts.correct === opts.choices[i] ? "" : opts.correct });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Question / Stem</Label>
        <Textarea
          className="mt-1.5 min-h-[60px]"
          placeholder="e.g. The author's attitude towards technology is ___"
          value={opts.stem}
          onChange={(e) => onChange({ ...opts, stem: e.target.value })}
        />
      </div>
      <div>
        <Label>Answer Choices</Label>
        <div className="space-y-2 mt-1.5">
          {opts.choices.map((choice, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-5">{String.fromCharCode(65 + i)}.</span>
              <Input
                placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                value={choice}
                onChange={(e) => updateChoice(i, e.target.value)}
              />
              {opts.choices.length > 2 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeChoice(i)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addChoice} type="button">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Choice
          </Button>
        </div>
      </div>
      <div>
        <Label>Correct Answer</Label>
        <Select value={opts.correct} onValueChange={(val) => onChange({ ...opts, correct: val })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select correct choice..." />
          </SelectTrigger>
          <SelectContent>
            {opts.choices.filter(Boolean).map((c, i) => (
              <SelectItem key={i} value={c}>{String.fromCharCode(65 + i)}. {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ChooseWordEditor({ opts, onChange }: { opts: ChooseWordOpts; onChange: (o: ChooseWordOpts) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Instruction</Label>
        <Input
          className="mt-1.5"
          value={opts.instruction}
          onChange={(e) => onChange({ ...opts, instruction: e.target.value })}
        />
      </div>
      <div>
        <Label>Word Limit</Label>
        <Input
          className="mt-1.5 w-32"
          type="number"
          min={1}
          max={5}
          value={opts.wordLimit}
          onChange={(e) => onChange({ ...opts, wordLimit: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label>Passage Text <span className="text-muted-foreground text-xs">(optional, students choose from here)</span></Label>
        <Textarea
          className="mt-1.5 min-h-[120px] text-sm"
          placeholder="Paste or type the reading passage here..."
          value={opts.passageText ?? ""}
          onChange={(e) => onChange({ ...opts, passageText: e.target.value })}
        />
      </div>
      <div>
        <Label>Image URL <span className="text-muted-foreground text-xs">(optional, if selecting from a picture)</span></Label>
        <Input
          className="mt-1.5"
          placeholder="https://example.com/image.jpg"
          value={opts.imageUrl ?? ""}
          onChange={(e) => onChange({ ...opts, imageUrl: e.target.value })}
        />
      </div>
      <div>
        <Label>Correct Answer</Label>
        <Input
          className="mt-1.5"
          placeholder="e.g. migration"
          value={opts.correct}
          onChange={(e) => onChange({ ...opts, correct: e.target.value })}
        />
      </div>
    </div>
  );
}

function MatchingEditor({ opts, onChange }: { opts: MatchingOpts; onChange: (o: MatchingOpts) => void }) {
  const updateLeft  = (i: number, val: string) => { const a = [...opts.leftItems]; a[i] = val; onChange({ ...opts, leftItems: a }); };
  const updateRight = (i: number, val: string) => { const a = [...opts.rightItems]; a[i] = val; onChange({ ...opts, rightItems: a }); };
  const addRow = () => onChange({ ...opts, leftItems: [...opts.leftItems, ""], rightItems: [...opts.rightItems, ""] });
  const removeRow = (i: number) => onChange({
    ...opts,
    leftItems: opts.leftItems.filter((_, idx) => idx !== i),
    rightItems: opts.rightItems.filter((_, idx) => idx !== i),
    pairs: opts.pairs.filter((p) => p.left !== i && p.right !== i),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add matching pairs. The right column will be scrambled for students.</p>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
          Instruction <span className="font-normal normal-case">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. Match each scientist with their contribution."
          value={opts.instruction ?? ""}
          onChange={(e) => onChange({ ...opts, instruction: e.target.value })}
          className="text-sm"
        />
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
          <span>Left Column</span>
          <span>Matching Right Column</span>
          <span className="w-8" />
        </div>
        {opts.leftItems.map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <Input
              placeholder={`Left item ${i + 1}`}
              value={opts.leftItems[i]}
              onChange={(e) => updateLeft(i, e.target.value)}
            />
            <Input
              placeholder={`Matches with...`}
              value={opts.rightItems[i]}
              onChange={(e) => updateRight(i, e.target.value)}
            />
            {opts.leftItems.length > 2 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRow(i)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addRow} type="button">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
        </Button>
      </div>
    </div>
  );
}

function Matching3ColEditor({ opts, onChange }: { opts: Matching3ColOpts; onChange: (o: Matching3ColOpts) => void }) {
  const colKeys: Array<"a" | "b" | "c"> = ["a", "b", "c"];

  const updateColumn = (i: number, val: string) => {
    const cols = [...opts.columns] as [string, string, string];
    cols[i] = val;
    onChange({ ...opts, columns: cols });
  };

  const updateRow = (rowIdx: number, key: "a" | "b" | "c", val: string) => {
    const rows = opts.rows.map((r, i) => i === rowIdx ? { ...r, [key]: val } : r);
    onChange({ ...opts, rows });
  };

  const addRow = () => onChange({ ...opts, rows: [...opts.rows, { a: "", b: "", c: "" }] });

  const removeRow = (i: number) => onChange({ ...opts, rows: opts.rows.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Three-column matching — students choose the answer for one column; the other two are shown as fixed text.
      </p>

      {/* Column headers */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Column Names</Label>
        <div className="grid grid-cols-3 gap-2">
          {opts.columns.map((col, i) => (
            <Input
              key={i}
              placeholder={`Column ${["A", "B", "C"][i]} name`}
              value={col}
              onChange={(e) => updateColumn(i, e.target.value)}
              className="text-sm"
            />
          ))}
        </div>
      </div>

      {/* Answer column selector */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Students Select From</Label>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange({ ...opts, answerColIndex: i as 0 | 1 | 2 })}
              className={cn(
                "flex-1 py-1.5 rounded border text-xs font-semibold transition-all",
                opts.answerColIndex === i
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white dark:bg-card text-muted-foreground border-border hover:border-amber-500 hover:text-amber-700"
              )}
            >
              {opts.columns[i] || `Column ${["A", "B", "C"][i]}`}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          The selected column will be scrambled and presented as a dropdown to students.
        </p>
      </div>

      {/* Instruction */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
          Instruction <span className="font-normal normal-case">(optional)</span>
        </Label>
        <Input
          placeholder="e.g. Match each item in Column A with the correct Category and Example."
          value={opts.instruction ?? ""}
          onChange={(e) => onChange({ ...opts, instruction: e.target.value })}
          className="text-sm"
        />
      </div>

      {/* Row editor */}
      <div className="space-y-2">
        <div className={`grid gap-2 text-xs font-medium text-muted-foreground px-1`} style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
          {opts.columns.map((col, i) => (
            <span key={i} className={cn(opts.answerColIndex === i && "text-amber-700 font-semibold")}>
              {col || `Column ${["A", "B", "C"][i]}`}
              {opts.answerColIndex === i && " ★"}
            </span>
          ))}
          <span className="w-8" />
        </div>
        {opts.rows.map((row, rowIdx) => (
          <div key={rowIdx} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
            {colKeys.map((key, colIdx) => (
              <Input
                key={key}
                placeholder={`${opts.columns[colIdx] || ["A", "B", "C"][colIdx]} ${rowIdx + 1}`}
                value={row[key]}
                onChange={(e) => updateRow(rowIdx, key, e.target.value)}
                className={cn("text-sm", opts.answerColIndex === colIdx && "border-amber-400 focus-visible:ring-amber-400/30")}
              />
            ))}
            {opts.rows.length > 2 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRow(rowIdx)} type="button">
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addRow} type="button">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
        </Button>
      </div>
    </div>
  );
}

function MultiSelectEditor({ opts, onChange }: { opts: MultiSelectOpts; onChange: (o: MultiSelectOpts) => void }) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const setOption = (i: number, val: string) => {
    const next = [...opts.options];
    next[i] = val;
    onChange({ ...opts, options: next });
  };
  const addOption = () => onChange({ ...opts, options: [...opts.options, ""] });
  const removeOption = (i: number) => {
    const next = opts.options.filter((_, idx) => idx !== i);
    const correct = opts.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c));
    onChange({ ...opts, options: next, correct });
  };
  const toggleCorrect = (i: number) => {
    const has = opts.correct.includes(i);
    const next = has ? opts.correct.filter((c) => c !== i) : [...opts.correct, i].sort((a, b) => a - b);
    onChange({ ...opts, correct: next });
  };
  return (
    <div className="space-y-4">
      <div>
        <Label>Instruction Text</Label>
        <Textarea
          className="mt-1.5 min-h-[80px]"
          placeholder={`e.g. Choose THREE letters A-${letters[opts.options.length - 1]}.\nNB Your answers may be given in any order.\nWhich THREE of the following statements are true?`}
          value={opts.instruction}
          onChange={(e) => onChange({ ...opts, instruction: e.target.value })}
        />
      </div>
      <div>
        <Label>Number of Selections Allowed</Label>
        <Input
          className="mt-1.5 w-28"
          type="number"
          min={1}
          max={opts.options.length}
          value={opts.maxSelect}
          onChange={(e) => onChange({ ...opts, maxSelect: Math.max(1, Number(e.target.value)) })}
        />
        <p className="text-xs text-muted-foreground mt-1">Students must pick exactly this many options.</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Options <span className="text-muted-foreground text-xs ml-1">(check the correct ones)</span></Label>
          <Button type="button" size="sm" variant="outline" onClick={addOption} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {opts.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0">
              {letters[i] ?? i + 1}
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 accent-primary"
              checked={opts.correct.includes(i)}
              onChange={() => toggleCorrect(i)}
            />
            <Input
              className="flex-1 h-8 text-sm"
              placeholder={`Option ${letters[i] ?? i + 1}`}
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
            />
            {opts.options.length > 2 && (
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeOption(i)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        {opts.correct.length > 0 && opts.correct.length !== opts.maxSelect && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠ {opts.correct.length} answer{opts.correct.length !== 1 ? "s" : ""} checked but max selection is {opts.maxSelect}. Consider aligning these.
          </p>
        )}
      </div>
    </div>
  );
}

function TrueFalseNgEditor({ opts, onChange }: { opts: TrueFalseNgOpts; onChange: (o: TrueFalseNgOpts) => void }) {
  const options = ["TRUE", "FALSE", "NOT GIVEN"] as const;
  return (
    <div className="space-y-4">
      <div>
        <Label>Statement</Label>
        <Textarea
          className="mt-1.5 min-h-[80px]"
          placeholder="e.g. Methods for predicting the Earth's population have recently changed."
          value={opts.statement}
          onChange={(e) => onChange({ ...opts, statement: e.target.value })}
        />
      </div>
      <div>
        <Label>Correct Answer</Label>
        <div className="flex gap-2 mt-1.5">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ ...opts, correct: opt })}
              className={`px-4 py-1.5 rounded border text-xs font-semibold tracking-wide transition-colors ${
                opts.correct === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShortAnswerEditor({ opts, onChange }: { opts: ShortAnswerOpts; onChange: (o: ShortAnswerOpts) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Question / Prompt</Label>
        <Textarea
          className="mt-1.5 min-h-[80px]"
          placeholder="e.g. What is the main argument presented in the passage?"
          value={opts.prompt}
          onChange={(e) => onChange({ ...opts, prompt: e.target.value })}
        />
      </div>
      <div>
        <Label>Word Limit <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          className="mt-1.5 w-32"
          type="number"
          min={1}
          placeholder="No limit"
          value={opts.wordLimit ?? ""}
          onChange={(e) => onChange({ ...opts, wordLimit: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>
      <div>
        <Label>Model Answer <span className="text-muted-foreground text-xs">(shown after submission for self-assessment)</span></Label>
        <Textarea
          className="mt-1.5 min-h-[60px]"
          placeholder="e.g. The author argues that technology improves human communication…"
          value={opts.correct ?? ""}
          onChange={(e) => onChange({ ...opts, correct: e.target.value })}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Question summary preview
// ─────────────────────────────────────────────
function QuestionSummary({ type, options }: { type: QType; options: QOptions }) {
  if (type === "fill_blank") {
    const o = options as FillBlankOpts;
    return <p className="text-xs text-muted-foreground truncate">{o.sentence || "—"}</p>;
  }
  if (type === "dropdown") {
    const o = options as DropdownOpts;
    return <p className="text-xs text-muted-foreground truncate">{o.stem || "—"} &bull; {o.choices.filter(Boolean).length} choices</p>;
  }
  if (type === "choose_word") {
    const o = options as ChooseWordOpts;
    return <p className="text-xs text-muted-foreground truncate">{o.instruction}</p>;
  }
  if (type === "matching") {
    const o = options as MatchingOpts;
    return <p className="text-xs text-muted-foreground">{o.leftItems.filter(Boolean).length} pairs</p>;
  }
  if (type === "matching_3col") {
    const o = options as Matching3ColOpts;
    const answerColName = o.columns[o.answerColIndex] || ["A", "B", "C"][o.answerColIndex];
    return <p className="text-xs text-muted-foreground">{o.rows.filter((r) => r.a || r.b || r.c).length} rows · answer: {answerColName}</p>;
  }
  if (type === "short_answer") {
    const o = options as ShortAnswerOpts;
    return <p className="text-xs text-muted-foreground truncate">{o.prompt || "—"}{o.wordLimit ? ` · up to ${o.wordLimit} word${o.wordLimit !== 1 ? "s" : ""}` : ""}</p>;
  }
  if (type === "true_false_ng") {
    const o = options as TrueFalseNgOpts;
    return <p className="text-xs text-muted-foreground truncate">{o.statement || "—"}{o.correct ? ` · ✓ ${o.correct}` : ""}</p>;
  }
  if (type === "fill_blank_dropdown") {
    const o = options as FillBlankDropdownOpts;
    return <p className="text-xs text-muted-foreground truncate">{o.sentences.filter(Boolean).length} sentences · choices: {o.choices.filter(Boolean).join(", ") || "—"}</p>;
  }
  if (type === "multi_select") {
    const o = options as MultiSelectOpts;
    const n = o.options.filter(Boolean).length;
    return <p className="text-xs text-muted-foreground truncate">Choose {o.maxSelect} of {n} · {o.instruction || "—"}</p>;
  }
  return null;
}

// ─────────────────────────────────────────────
// Droppable area for ungrouped questions
// ─────────────────────────────────────────────
function UngroupedDropArea({ groupKey, children }: { groupKey: string; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: groupKey });
  return <div ref={setNodeRef} className="space-y-3">{children}</div>;
}

// ─────────────────────────────────────────────
// Sortable question row
// ─────────────────────────────────────────────
type QuestionRow = { id: number; type: string; order: number; questionText: string; options: unknown };

function SortableQuestionCard({
  q, index, onEdit, onDelete,
}: {
  q: QuestionRow;
  index: number;
  onEdit: (q: QuestionRow) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-4 border rounded-lg bg-card hover:border-primary/40 transition-colors"
      data-testid={`card-question-${q.id}`}
    >
      <div className="flex items-center gap-2 mt-0.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-muted-foreground w-5 text-right">{index + 1}.</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Q_TYPE_COLORS[q.type as QType]}`}>
            {Q_TYPE_LABELS[q.type as QType]}
          </span>
        </div>
        {q.questionText && (
          <p className="text-sm font-medium mb-1 line-clamp-1">{q.questionText}</p>
        )}
        <QuestionSummary type={q.type as QType} options={q.options as QOptions} />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(q)}
          data-testid={`btn-edit-question-${q.id}`}
        >
          <Edit className="w-3.5 h-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              data-testid={`btn-delete-question-${q.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete question #{index + 1}? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(q.id)}
                data-testid={`btn-confirm-delete-${q.id}`}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function QuizDetail() {
  const [, params] = useRoute("/quizzes/:id");
  const quizId = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: courses } = useListCourses({});

  // ── Quiz settings edit state
  const [editSettings, setEditSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ title: "", description: "", courseId: "", timeLimitMinutes: "", isPublished: false });

  // ── Question dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{ id: number; order: number } | null>(null);
  const [qType, setQType] = useState<QType>("fill_blank");
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState<QOptions>(defaultOptions("fill_blank"));

  // ── Multi-container DnD state
  type InlineGroup = { key: string; part?: QuizPart; questionIds: number[] };
  const [groups, setGroups] = useState<InlineGroup[]>([{ key: "ungrouped", questionIds: [] }]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const isReordering = useRef(false);

  const { data: quiz, isLoading } = useGetQuiz(quizId);

  // Build a lookup map of all questions from server data
  const questionMap = useMemo(() => {
    const qs = ((quiz as { questions?: unknown[] })?.questions ?? []) as QuestionRow[];
    return new Map(qs.map((q) => [q.id, q]));
  }, [quiz]);

  // Sync groups from server (skip during drag)
  useEffect(() => {
    if (isReordering.current || !quiz) return;
    const qs = (((quiz as { questions?: unknown[] })?.questions ?? []) as QuestionRow[]).sort((a, b) => a.order - b.order);
    const parts = ((quiz as { parts?: QuizPart[] | null }).parts ?? []) as QuizPart[];

    if (parts.length === 0) {
      setGroups([{ key: "ungrouped", questionIds: qs.map((q) => q.id) }]);
      return;
    }

    const ungrouped: number[] = [];
    const partGroups: number[][] = parts.map(() => []);
    qs.forEach((q, i) => {
      const pos = i + 1;
      const pi = parts.findIndex((p) => pos >= p.from && pos <= p.to);
      if (pi >= 0) partGroups[pi].push(q.id);
      else ungrouped.push(q.id);
    });

    setGroups([
      { key: "ungrouped", questionIds: ungrouped },
      ...parts.map((p, i) => ({ key: `part-${i}`, part: p, questionIds: partGroups[i] })),
    ]);
  }, [quiz]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function findContainer(id: UniqueIdentifier): string | null {
    if (typeof id === "string" && groups.some((g) => g.key === id)) return id;
    const numId = Number(id);
    return groups.find((g) => g.questionIds.includes(numId))?.key ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const fromKey = findContainer(active.id);
    const toKey = findContainer(over.id) ?? (typeof over.id === "string" ? over.id : null);
    if (!fromKey || !toKey || fromKey === toKey) return;

    setGroups((prev) => {
      const fromGroup = prev.find((g) => g.key === fromKey)!;
      const toGroup = prev.find((g) => g.key === toKey)!;
      const activeIdx = fromGroup.questionIds.indexOf(Number(active.id));
      const overIdx = toGroup.questionIds.indexOf(Number(over.id));
      const newFrom = fromGroup.questionIds.filter((id) => id !== Number(active.id));
      const newTo = [...toGroup.questionIds];
      newTo.splice(overIdx >= 0 ? overIdx : newTo.length, 0, Number(active.id));
      return prev.map((g) => {
        if (g.key === fromKey) return { ...g, questionIds: newFrom };
        if (g.key === toKey) return { ...g, questionIds: newTo };
        return g;
      });
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const fromKey = findContainer(active.id);
    const toKey = findContainer(over.id) ?? (typeof over.id === "string" ? over.id : null);

    let finalGroups = groups;
    if (fromKey && toKey && fromKey === toKey && active.id !== over.id) {
      const group = groups.find((g) => g.key === fromKey)!;
      const oldIdx = group.questionIds.indexOf(Number(active.id));
      const newIdx = group.questionIds.indexOf(Number(over.id));
      if (oldIdx !== newIdx) {
        finalGroups = groups.map((g) =>
          g.key === fromKey ? { ...g, questionIds: arrayMove(g.questionIds, oldIdx, newIdx) } : g
        );
        setGroups(finalGroups);
      }
    }
    await saveOrderAndParts(finalGroups);
  }

  async function saveOrderAndParts(currentGroups: InlineGroup[]) {
    if (!quiz) return;
    isReordering.current = true;
    try {
      const flatIds = currentGroups.flatMap((g) => g.questionIds);
      if (flatIds.length > 0) {
        await fetch(`${import.meta.env.BASE_URL}api/quizzes/${quizId}/questions/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: flatIds }),
        });
      }
      let cursor = 0;
      const computedParts: QuizPart[] = [];
      for (const group of currentGroups) {
        const count = group.questionIds.length;
        if (group.part) {
          computedParts.push(count > 0
            ? { ...group.part, from: cursor + 1, to: cursor + count }
            : { ...group.part, from: 0, to: 0 }
          );
        }
        cursor += count;
      }
      await fetch(`${import.meta.env.BASE_URL}api/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description ?? "",
          passageText: (quiz as { passageText?: string }).passageText ?? undefined,
          courseId: quiz.courseId ?? undefined,
          timeLimitMinutes: quiz.timeLimitMinutes ?? undefined,
          isPublished: quiz.isPublished,
          parts: computedParts,
        }),
      });
    } finally {
      isReordering.current = false;
    }
    queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
  }

  function addInlinePart() {
    const partCount = groups.filter((g) => g.part).length;
    const newPart: QuizPart = { name: `Part ${partCount + 1}`, from: 0, to: 0, instructions: [] };
    const key = `part-${Date.now()}`;
    const newGroups = [...groups, { key, part: newPart, questionIds: [] }];
    setGroups(newGroups);
    saveOrderAndParts(newGroups);
  }

  function updateInlinePart(key: string, updates: Partial<QuizPart>) {
    setGroups((prev) =>
      prev.map((g) => (g.key === key && g.part ? { ...g, part: { ...g.part, ...updates } } : g))
    );
  }

  function saveInlinePart(key: string) {
    setGroups((prev) => {
      const current = prev.map((g) => (g.key === key && g.part ? { ...g, part: { ...g.part } } : g));
      saveOrderAndParts(current);
      return current;
    });
  }

  function deleteInlinePart(key: string) {
    setGroups((prev) => {
      const target = prev.find((g) => g.key === key);
      const orphaned = target?.questionIds ?? [];
      const next = prev
        .map((g) => (g.key === "ungrouped" ? { ...g, questionIds: [...g.questionIds, ...orphaned] } : g))
        .filter((g) => g.key !== key);
      saveOrderAndParts(next);
      return next;
    });
  }

  const updateQuiz = useUpdateQuiz({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
        toast({ title: "Quiz updated" });
        setEditSettings(false);
      },
      onError: () => toast({ title: "Failed to update quiz", variant: "destructive" }),
    },
  });

  const addQuestion = useAddQuizQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
        toast({ title: "Question added" });
        closeDialog();
      },
      onError: () => toast({ title: "Failed to add question", variant: "destructive" }),
    },
  });

  const updateQuestion = useUpdateQuizQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
        toast({ title: "Question updated" });
        closeDialog();
      },
      onError: () => toast({ title: "Failed to update question", variant: "destructive" }),
    },
  });

  const deleteQuestion = useDeleteQuizQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
        toast({ title: "Question deleted" });
      },
      onError: () => toast({ title: "Failed to delete question", variant: "destructive" }),
    },
  });

  function openAddDialog() {
    setEditingQuestion(null);
    setQType("fill_blank");
    setQText("");
    setQOptions(defaultOptions("fill_blank"));
    setDialogOpen(true);
  }

  function openEditDialog(q: { id: number; type: string; order: number; questionText: string; options: unknown }) {
    setEditingQuestion({ id: q.id, order: q.order });
    const t = q.type as QType;
    setQType(t);
    setQText(q.questionText);
    setQOptions((q.options as QOptions) ?? defaultOptions(t));
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingQuestion(null);
  }

  function handleTypeChange(t: QType) {
    setQType(t);
    setQOptions(defaultOptions(t));
  }

  function handleSaveQuestion() {
    if (editingQuestion) {
      updateQuestion.mutate({
        id: quizId,
        questionId: editingQuestion.id,
        data: { type: qType, questionText: qText, options: qOptions as Record<string, unknown> },
      });
    } else {
      addQuestion.mutate({
        id: quizId,
        data: {
          type: qType,
          questionText: qText,
          options: qOptions as Record<string, unknown>,
        },
      });
    }
  }

  function openSettingsEdit() {
    if (!quiz) return;
    setSettingsForm({
      title: quiz.title,
      description: quiz.description,
      courseId: quiz.courseId ? String(quiz.courseId) : "none",
      timeLimitMinutes: quiz.timeLimitMinutes ? String(quiz.timeLimitMinutes) : "",
      isPublished: quiz.isPublished,
    });
    setEditSettings(true);
  }

  function handleSaveSettings() {
    const currentParts = groups.filter((g) => g.part).map((g) => g.part!);
    updateQuiz.mutate({
      id: quizId,
      data: {
        title: settingsForm.title,
        description: settingsForm.description,
        parts: currentParts,
        courseId: settingsForm.courseId && settingsForm.courseId !== "none" ? Number(settingsForm.courseId) : undefined,
        timeLimitMinutes: settingsForm.timeLimitMinutes ? Number(settingsForm.timeLimitMinutes) : undefined,
        isPublished: settingsForm.isPublished,
      },
    });
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Quiz not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/quizzes")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes
        </Button>
      </div>
    );
  }


  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-3 text-muted-foreground"
          onClick={() => setLocation("/quizzes")}
          data-testid="btn-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quizzes
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                {quiz.isPublished ? <><Eye className="w-3 h-3 mr-1" />Published</> : <><EyeOff className="w-3 h-3 mr-1" />Draft</>}
              </Badge>
              <Badge variant="outline">
                <ClipboardList className="w-3 h-3 mr-1" />
                {groups.reduce((sum, g) => sum + g.questionIds.length, 0)} question{groups.reduce((sum, g) => sum + g.questionIds.length, 0) !== 1 ? "s" : ""}
              </Badge>
              {quiz.timeLimitMinutes && (
                <Badge variant="outline">
                  <Timer className="w-3 h-3 mr-1" />
                  {quiz.timeLimitMinutes} min
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
            {quiz.description && <p className="text-muted-foreground mt-1">{quiz.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => window.open(`${import.meta.env.BASE_URL}student/quizzes/${quizId}`, "_blank")}
              data-testid="btn-preview-quiz"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={openSettingsEdit} data-testid="btn-edit-settings">
              <Edit className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Questions</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={addInlinePart} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Part
            </Button>
            <Button onClick={openAddDialog} data-testid="btn-add-question">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>

        {groups.every((g) => g.questionIds.length === 0) && groups.length === 1 ? (
          <div className="text-center py-16 border rounded-lg bg-card/50 border-dashed">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold">No questions yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Click "Add Question" to build your quiz.</p>
            <Button onClick={openAddDialog} size="sm">Add First Question</Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-4" data-testid="list-questions">
              {(() => {
                // Compute global sequential numbering across all groups
                let globalIdx = 0;
                return groups.map((group) => {
                  const startIdx = globalIdx;
                  globalIdx += group.questionIds.length;

                  if (!group.part) {
                    // Ungrouped section — only show if there are ungrouped questions
                    if (group.questionIds.length === 0) return null;
                    return (
                      <div key="ungrouped" className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                          Ungrouped Questions
                        </p>
                        <UngroupedDropArea groupKey="ungrouped">
                          <SortableContext items={group.questionIds} strategy={verticalListSortingStrategy}>
                            {group.questionIds.map((id, qi) => {
                              const q = questionMap.get(id);
                              if (!q) return null;
                              return (
                                <SortableQuestionCard
                                  key={id}
                                  q={q}
                                  index={startIdx + qi}
                                  onEdit={openEditDialog}
                                  onDelete={(qid) => deleteQuestion.mutate({ id: quizId, questionId: qid })}
                                />
                              );
                            })}
                          </SortableContext>
                        </UngroupedDropArea>
                      </div>
                    );
                  }

                  return (
                    <InlinePartSection
                      key={group.key}
                      groupKey={group.key}
                      part={group.part}
                      questionIds={group.questionIds}
                      onPartChange={(updates) => updateInlinePart(group.key, updates)}
                      onPartBlur={() => saveInlinePart(group.key)}
                      onDeletePart={() => deleteInlinePart(group.key)}
                    >
                      {group.questionIds.map((id, qi) => {
                        const q = questionMap.get(id);
                        if (!q) return null;
                        return (
                          <SortableQuestionCard
                            key={id}
                            q={q}
                            index={startIdx + qi}
                            onEdit={openEditDialog}
                            onDelete={(qid) => deleteQuestion.mutate({ id: quizId, questionId: qid })}
                          />
                        );
                      })}
                    </InlinePartSection>
                  );
                });
              })()}
            </div>

            <DragOverlay>
              {activeId && questionMap.get(activeId) ? (
                <div className="opacity-80 shadow-2xl rounded-lg">
                  <SortableQuestionCard
                    q={questionMap.get(activeId)!}
                    index={groups.flatMap((g) => g.questionIds).indexOf(activeId)}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Quiz Settings Dialog ── */}
      <Dialog open={editSettings} onOpenChange={setEditSettings}>
        <DialogContent className="max-w-lg flex flex-col max-h-[85vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Quiz Settings</DialogTitle>
            <DialogDescription>Update the quiz title, description, and options.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1.5"
                value={settingsForm.title}
                onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1.5"
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Linked Course</Label>
                <Select
                  value={settingsForm.courseId || "none"}
                  onValueChange={(val) => setSettingsForm({ ...settingsForm, courseId: val })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="No course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No course</SelectItem>
                    {courses?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Time Limit (min)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  placeholder="No limit"
                  value={settingsForm.timeLimitMinutes}
                  onChange={(e) => setSettingsForm({ ...settingsForm, timeLimitMinutes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Published</Label>
                <p className="text-xs text-muted-foreground">Visible to students</p>
              </div>
              <Switch
                checked={settingsForm.isPublished}
                onCheckedChange={(v) => setSettingsForm({ ...settingsForm, isPublished: v })}
              />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setEditSettings(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={updateQuiz.isPending} data-testid="btn-save-settings">
              {updateQuiz.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Question Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription>
              Choose a question type and fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Question type selector */}
            <div>
              <Label>Question Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {(Object.keys(Q_TYPE_LABELS) as QType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`px-3 py-2.5 rounded-lg border text-left text-sm font-medium transition-colors ${
                      qType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`qtype-${t}`}
                  >
                    {Q_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <Separator />


            {/* Type-specific editor */}
            {qType === "fill_blank" && (
              <FillBlankEditor opts={qOptions as FillBlankOpts} onChange={(o) => setQOptions(o)} />
            )}
            {qType === "fill_blank_dropdown" && (
              <FillBlankDropdownEditor opts={qOptions as FillBlankDropdownOpts} onChange={(o) => setQOptions(o)} />
            )}
            {qType === "dropdown" && (
              <DropdownEditor opts={qOptions as DropdownOpts} onChange={(o) => setQOptions(o)} />
            )}
            {qType === "choose_word" && (
              <ChooseWordEditor opts={qOptions as ChooseWordOpts} onChange={(o) => setQOptions(o)} />
            )}
            {qType === "matching" && (
              <MatchingEditor opts={qOptions as MatchingOpts} onChange={(o) => setQOptions(o)} />
            )}
            {qType === "matching_3col" && (
              <Matching3ColEditor opts={qOptions as Matching3ColOpts} onChange={(o) => setQOptions(o)} />
            )}
            {qType === "short_answer" && (
              <ShortAnswerEditor opts={qOptions as ShortAnswerOpts} onChange={(o) => setQOptions(o)} />
            )}
            {qType === "true_false_ng" && (
              <TrueFalseNgEditor opts={qOptions as TrueFalseNgOpts} onChange={(o) => setQOptions(o)} />
            )}
            {qType === "multi_select" && (
              <MultiSelectEditor opts={qOptions as MultiSelectOpts} onChange={(o) => setQOptions(o)} />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={addQuestion.isPending || updateQuestion.isPending}
              data-testid="btn-save-question"
            >
              {addQuestion.isPending || updateQuestion.isPending ? "Saving..." : editingQuestion ? "Update Question" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
