import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuizPart {
  name: string;
  from: number;
  to: number;
  instructions: string[];
  passageText?: string;
  imageUrls?: string[];
  audioUrls?: string[];
  /** @deprecated use imageUrls */
  imageUrl?: string;
  /** @deprecated use audioUrls */
  audioUrl?: string;
}

interface PartsEditorProps {
  value: QuizPart[];
  onChange: (parts: QuizPart[]) => void;
  totalQuestions?: number;
  hideAddButton?: boolean;
}

export function PartsEditor({ value, onChange, totalQuestions, hideAddButton }: PartsEditorProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  function toggleExpanded(i: number) {
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  function addPart() {
    const nextNum = value.length + 1;
    const lastTo = value[value.length - 1]?.to ?? 0;
    const newPart: QuizPart = {
      name: `Part ${nextNum}`,
      from: lastTo + 1,
      to: lastTo + 10,
      instructions: [],
    };
    onChange([...value, newPart]);
    // auto-expand new part
    setExpanded((prev) => ({ ...prev, [value.length]: true }));
  }

  function removePart(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
    setExpanded((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });
  }

  function updateField(i: number, field: "name" | "from" | "to", raw: string) {
    const updated = [...value];
    if (field === "name") {
      updated[i] = { ...updated[i], name: raw };
    } else {
      const num = parseInt(raw, 10);
      if (!isNaN(num)) updated[i] = { ...updated[i], [field]: num };
    }
    onChange(updated);
  }

  function addInstruction(i: number) {
    const updated = [...value];
    updated[i] = { ...updated[i], instructions: [...(updated[i].instructions ?? []), ""] };
    onChange(updated);
  }

  function updateInstruction(partIdx: number, bulletIdx: number, text: string) {
    const updated = [...value];
    const instr = [...(updated[partIdx].instructions ?? [])];
    instr[bulletIdx] = text;
    updated[partIdx] = { ...updated[partIdx], instructions: instr };
    onChange(updated);
  }

  function removeInstruction(partIdx: number, bulletIdx: number) {
    const updated = [...value];
    const instr = (updated[partIdx].instructions ?? []).filter((_, j) => j !== bulletIdx);
    updated[partIdx] = { ...updated[partIdx], instructions: instr };
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Question Parts{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (groups shown in the quiz footer, with instructions above each section)
          </span>
        </Label>
        {!hideAddButton && (
          <Button type="button" variant="outline" size="sm" onClick={addPart}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Question Type
          </Button>
        )}
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No parts defined — all questions will appear ungrouped.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((part, i) => {
            const isOpen = !!expanded[i];
            const instrCount = (part.instructions ?? []).length;
            return (
              <div key={i} className="rounded-lg border bg-card overflow-hidden">
                {/* ── Part header row ── */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />

                  <button
                    type="button"
                    onClick={() => toggleExpanded(i)}
                    className="flex items-center gap-1.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isOpen
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <Input
                    className="h-8 text-sm font-medium border-0 shadow-none focus-visible:ring-0 px-0 flex-1 min-w-0"
                    value={part.name}
                    onChange={(e) => updateField(i, "name", e.target.value)}
                    placeholder="Part name…"
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <span>Q</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalQuestions ?? 999}
                      className="h-7 w-14 text-xs text-center"
                      value={part.from}
                      onChange={(e) => updateField(i, "from", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>–</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalQuestions ?? 999}
                      className="h-7 w-14 text-xs text-center"
                      value={part.to}
                      onChange={(e) => updateField(i, "to", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {!isOpen && instrCount > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {instrCount} instruction{instrCount !== 1 ? "s" : ""}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removePart(i)}
                    className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ── Instructions panel (expanded) ── */}
                {isOpen && (
                  <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Instructions (bullet points shown to students)
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addInstruction(i)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add bullet
                      </Button>
                    </div>

                    {(part.instructions ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-1">
                        No instructions yet — click "Add bullet" to add a line.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {(part.instructions ?? []).map((instr, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm mt-0.5 shrink-0">•</span>
                            <Input
                              className="h-8 text-sm flex-1"
                              value={instr}
                              onChange={(e) => updateInstruction(i, j, e.target.value)}
                              placeholder="e.g. Match each statement with the correct scientist, A–D."
                            />
                            <button
                              type="button"
                              onClick={() => removeInstruction(i, j)}
                              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Preview */}
                    {(part.instructions ?? []).some(Boolean) && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1.5">Preview:</p>
                        <div className="bg-background rounded-md border px-4 py-3">
                          <p className="text-sm font-bold text-[#7F1D1D] mb-2">
                            {part.name}: Questions {part.from}–{part.to}
                          </p>
                          <ul className="space-y-1">
                            {(part.instructions ?? []).filter(Boolean).map((instr, j) => (
                              <li key={j} className="flex gap-2 text-sm">
                                <span className="text-foreground mt-0.5 shrink-0">•</span>
                                <span dangerouslySetInnerHTML={{ __html: instr.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {value.length > 0 && totalQuestions !== undefined && (
        <p className="text-xs text-muted-foreground">
          Quiz has {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}.
          Wrap text in **double asterisks** to make it <strong>bold</strong> in the preview.
        </p>
      )}
    </div>
  );
}
