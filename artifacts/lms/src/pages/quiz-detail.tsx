import { useState } from "react";
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
  ArrowLeft, Plus, Trash2, Edit, ClipboardList, Timer, Eye, EyeOff, X, GripVertical,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types for the four question formats
// ─────────────────────────────────────────────
type QType = "fill_blank" | "dropdown" | "choose_word" | "matching";

interface FillBlankOpts { sentence: string; blanks: string[] }
interface DropdownOpts  { stem: string; choices: string[]; correct: string }
interface ChooseWordOpts { instruction: string; wordLimit: number; passageText?: string; imageUrl?: string; correct: string }
interface MatchingOpts  { leftItems: string[]; rightItems: string[]; pairs: { left: number; right: number }[] }
type QOptions = FillBlankOpts | DropdownOpts | ChooseWordOpts | MatchingOpts;

const Q_TYPE_LABELS: Record<QType, string> = {
  fill_blank:   "Fill in the Blanks",
  dropdown:     "Dropdown Options",
  choose_word:  "Choose One Word",
  matching:     "Column Matching",
};

const Q_TYPE_COLORS: Record<QType, string> = {
  fill_blank:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  dropdown:    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  choose_word: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  matching:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

// ─────────────────────────────────────────────
// Default empty option objects
// ─────────────────────────────────────────────
function defaultOptions(type: QType): QOptions {
  switch (type) {
    case "fill_blank":   return { sentence: "", blanks: [""] };
    case "dropdown":     return { stem: "", choices: ["", "", ""], correct: "" };
    case "choose_word":  return { instruction: "Choose ONE WORD from the passage below.", wordLimit: 1, passageText: "", imageUrl: "", correct: "" };
    case "matching":     return { leftItems: ["", ""], rightItems: ["", ""], pairs: [] };
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
  return null;
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

  const { data: quiz, isLoading } = useGetQuiz(quizId);

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
    updateQuiz.mutate({
      id: quizId,
      data: {
        title: settingsForm.title,
        description: settingsForm.description,
        courseId: settingsForm.courseId && settingsForm.courseId !== "none" ? Number(settingsForm.courseId) : undefined,
        timeLimitMinutes: settingsForm.timeLimitMinutes ? Number(settingsForm.timeLimitMinutes) : undefined,
        isPublished: settingsForm.isPublished,
      },
    });
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Quiz not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/quizzes")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes
        </Button>
      </div>
    );
  }

  const questions = (quiz as { questions?: unknown[] }).questions ?? [];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
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
                {questions.length} question{questions.length !== 1 ? "s" : ""}
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
          <Button variant="outline" onClick={openSettingsEdit} data-testid="btn-edit-settings">
            <Edit className="w-4 h-4 mr-2" />
            Edit Settings
          </Button>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Questions</h2>
          <Button onClick={openAddDialog} data-testid="btn-add-question">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-card/50 border-dashed">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold">No questions yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Click "Add Question" to build your quiz.</p>
            <Button onClick={openAddDialog} size="sm">Add First Question</Button>
          </div>
        ) : (
          <div className="space-y-3" data-testid="list-questions">
            {(questions as Array<{ id: number; type: string; order: number; questionText: string; options: unknown }>)
              .sort((a, b) => a.order - b.order)
              .map((q, i) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 p-4 border rounded-lg bg-card hover:border-primary/40 transition-colors"
                  data-testid={`card-question-${q.id}`}
                >
                  <div className="flex items-center gap-2 mt-0.5">
                    <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                    <span className="text-sm font-bold text-muted-foreground w-5 text-right">{i + 1}.</span>
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
                      onClick={() => openEditDialog(q)}
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
                            Are you sure you want to delete question #{i + 1}? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteQuestion.mutate({ id: quizId, questionId: q.id })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── Quiz Settings Dialog ── */}
      <Dialog open={editSettings} onOpenChange={setEditSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Quiz Settings</DialogTitle>
            <DialogDescription>Update the quiz title, description, and options.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
          <DialogFooter>
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

            {/* Question text */}
            <div>
              <Label>Question Label / Context <span className="text-muted-foreground text-xs">(optional heading shown above the question)</span></Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. Question 5 — Read the passage and answer..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                data-testid="input-question-text"
              />
            </div>

            <Separator />

            {/* Type-specific editor */}
            {qType === "fill_blank" && (
              <FillBlankEditor opts={qOptions as FillBlankOpts} onChange={(o) => setQOptions(o)} />
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
