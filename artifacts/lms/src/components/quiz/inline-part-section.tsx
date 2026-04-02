import { useState, type ReactNode } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronRight, Image, Volume2, FileText, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizPart } from "./parts-editor";

interface InlinePartSectionProps {
  groupKey: string;
  part: QuizPart;
  questionIds: number[];
  children: ReactNode;
  onPartChange: (updates: Partial<QuizPart>) => void;
  onPartBlur: () => void;
  onDeletePart: () => void;
}

type MediaTab = "passage" | "image" | "audio" | null;

export function InlinePartSection({
  groupKey,
  part,
  questionIds,
  children,
  onPartChange,
  onPartBlur,
  onDeletePart,
}: InlinePartSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaTab>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { setNodeRef } = useDroppable({ id: groupKey });

  function handleChange(updates: Partial<QuizPart>) {
    onPartChange(updates);
    setIsDirty(true);
    setJustSaved(false);
  }

  function handleSave() {
    onPartBlur();
    setIsDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  function toggleMedia(tab: NonNullable<MediaTab>) {
    setActiveMedia((prev) => (prev === tab ? null : tab));
  }

  function addInstruction() {
    onPartChange({ instructions: [...(part.instructions ?? []), ""] });
    onPartBlur();
  }
  function updateInstruction(idx: number, text: string) {
    const instr = [...(part.instructions ?? [])];
    instr[idx] = text;
    onPartChange({ instructions: instr });
  }
  function removeInstruction(idx: number) {
    onPartChange({ instructions: (part.instructions ?? []).filter((_, j) => j !== idx) });
    onPartBlur();
  }

  const hasMedia = part.passageText || part.imageUrl || part.audioUrl;
  const instrCount = (part.instructions ?? []).length;

  const mediaTabs: { key: NonNullable<MediaTab>; label: string; icon: typeof FileText; hasContent: boolean }[] = [
    { key: "passage", label: "Passage", icon: FileText, hasContent: !!part.passageText },
    { key: "audio",   label: "Audio",   icon: Volume2,  hasContent: !!part.audioUrl   },
    { key: "image",   label: "Image",   icon: Image,    hasContent: !!part.imageUrl   },
  ];

  return (
    <div className="rounded-xl border border-[#7F1D1D]/30 overflow-hidden shadow-sm">
      {/* ── Part header ── */}
      <div className="bg-[#7F1D1D] flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-white/80 hover:text-white transition-colors shrink-0"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <Input
          className="h-8 bg-transparent text-white font-semibold border-0 shadow-none focus-visible:ring-white/30 focus-visible:ring-1 px-1 flex-1 min-w-0 placeholder:text-white/50"
          value={part.name}
          onChange={(e) => handleChange({ name: e.target.value })}
          onBlur={() => { if (isDirty) handleSave(); }}
          placeholder="Part name…"
        />

        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="text-xs text-yellow-300 font-medium">Unsaved</span>
          )}
          {hasMedia && !isDirty && <FileText className="w-3.5 h-3.5 text-white/60" aria-label="Has passage/media" />}
          {instrCount > 0 && (
            <span className="text-xs text-white/70">{instrCount} instr.</span>
          )}
          <span className="text-xs text-white/60">{questionIds.length} Q</span>
          <button
            onClick={onDeletePart}
            className="flex items-center justify-center w-6 h-6 rounded text-white/60 hover:text-white hover:bg-white/20 transition-colors"
            title="Delete part (questions move to top)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Expandable panel ── */}
      {expanded && (
        <div className="border-b border-[#7F1D1D]/20 bg-red-50/60 dark:bg-red-950/10 px-4 py-4 space-y-4">

          {/* Media tab buttons */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Media for left panel
            </p>
            <div className="flex gap-2">
              {mediaTabs.map(({ key, label, icon: Icon, hasContent }) => {
                const isActive = activeMedia === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMedia(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all",
                      isActive
                        ? "bg-[#7F1D1D] text-white border-[#7F1D1D]"
                        : "bg-white dark:bg-card text-muted-foreground border-border hover:border-[#7F1D1D]/60 hover:text-[#7F1D1D]"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    {hasContent && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5" title="Has content" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passage content */}
          {activeMedia === "passage" && (
            <Textarea
              className="text-sm font-mono min-h-[100px] resize-y"
              placeholder="Paste reading passage here — shown to students on the left while answering…"
              value={part.passageText ?? ""}
              onChange={(e) => handleChange({ passageText: e.target.value })}
              autoFocus
            />
          )}

          {/* Image content */}
          {activeMedia === "image" && (
            <div className="space-y-2">
              <Input
                className="text-sm"
                placeholder="https://example.com/image.png"
                value={part.imageUrl ?? ""}
                onChange={(e) => handleChange({ imageUrl: e.target.value })}
                autoFocus
              />
              {part.imageUrl && (
                <img
                  src={part.imageUrl}
                  alt="Part image preview"
                  className="max-h-40 rounded border object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
          )}

          {/* Audio content */}
          {activeMedia === "audio" && (
            <div className="space-y-2">
              <Input
                className="text-sm"
                placeholder="https://example.com/audio.mp3"
                value={part.audioUrl ?? ""}
                onChange={(e) => handleChange({ audioUrl: e.target.value })}
                autoFocus
              />
              {part.audioUrl && (
                <audio controls className="w-full" key={part.audioUrl}>
                  <source src={part.audioUrl} />
                </audio>
              )}
            </div>
          )}

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Instructions (bullet points shown to students)
              </label>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addInstruction}>
                <Plus className="w-3 h-3 mr-1" />
                Add bullet
              </Button>
            </div>
            {instrCount === 0 ? (
              <p className="text-xs text-muted-foreground italic">No instructions yet.</p>
            ) : (
              <div className="space-y-1.5">
                {(part.instructions ?? []).map((instr, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm shrink-0">•</span>
                    <Input
                      className="h-8 text-sm flex-1"
                      value={instr}
                      onChange={(e) => updateInstruction(j, e.target.value)}
                      onBlur={onPartBlur}
                      placeholder="Instruction text… use **bold** for bold"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(j)}
                      className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty && !justSaved}
              className={cn(
                "h-8 text-xs gap-1.5 transition-all",
                justSaved && "bg-green-600 hover:bg-green-600 text-white",
                isDirty && "bg-[#7F1D1D] hover:bg-[#7F1D1D]/90 text-white"
              )}
            >
              {justSaved ? (
                <><Check className="w-3.5 h-3.5" /> Saved</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save Part</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Questions drop area ── */}
      <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[60px] px-4 py-3 space-y-3 bg-card",
            questionIds.length === 0 && "flex items-center justify-center text-xs text-muted-foreground italic border-dashed"
          )}
        >
          {questionIds.length === 0 ? "Drag questions here" : children}
        </div>
      </SortableContext>
    </div>
  );
}
