import { useState, useRef, type ReactNode } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronRight, Image, Volume2, FileText, Save, Check, Upload, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@workspace/object-storage-web";
import type { QuizPart } from "./parts-editor";

interface InlinePartSectionProps {
  groupKey: string;
  part: QuizPart;
  questionIds: number[];
  children: ReactNode;
  onPartChange: (updates: Partial<QuizPart>) => void;
  onPartBlur: () => void;
  onDeletePart: () => void;
  onAddQuestion?: () => void;
}

type MediaTab = "passage" | "image" | "audio" | null;

/** Migrate legacy single-url fields to arrays */
function getImageUrls(part: QuizPart): string[] {
  if (part.imageUrls && part.imageUrls.length > 0) return part.imageUrls;
  if (part.imageUrl) return [part.imageUrl];
  return [];
}
function getAudioUrls(part: QuizPart): string[] {
  if (part.audioUrls && part.audioUrls.length > 0) return part.audioUrls;
  if (part.audioUrl) return [part.audioUrl];
  return [];
}

// ── Per-item upload row ────────────────────────────────────────────────────
interface MediaItemRowProps {
  url: string;
  accept: string;
  placeholder: string;
  onUrlChange: (url: string) => void;
  onRemove: () => void;
}

function MediaItemRow({ url, accept, placeholder, onUrlChange, onRemove }: MediaItemRowProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUpload({
    onSuccess: (res) => {
      onUrlChange(`/api/storage/objects/${res.objectPath.replace(/^\/objects\//, "")}`);
    },
  });
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          className="text-sm flex-1"
          placeholder={placeholder}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
        />
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload.uploadFile(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 text-xs"
          disabled={upload.isUploading}
          onClick={() => fileRef.current?.click()}
        >
          {upload.isUploading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-3.5 h-3.5" /> Upload</>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-destructive px-2"
          onClick={onRemove}
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      {upload.error && (
        <p className="text-xs text-destructive">Upload failed: {upload.error.message}</p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function InlinePartSection({
  groupKey,
  part,
  questionIds,
  children,
  onPartChange,
  onPartBlur,
  onDeletePart,
  onAddQuestion,
}: InlinePartSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaTab>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { setNodeRef } = useDroppable({ id: groupKey });

  const imageUrls = getImageUrls(part);
  const audioUrls = getAudioUrls(part);

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

  // ── Image helpers ──
  function updateImage(idx: number, url: string) {
    const next = [...imageUrls];
    next[idx] = url;
    handleChange({ imageUrls: next, imageUrl: undefined });
  }
  function removeImage(idx: number) {
    const next = imageUrls.filter((_, i) => i !== idx);
    handleChange({ imageUrls: next, imageUrl: undefined });
  }
  function addImage() {
    handleChange({ imageUrls: [...imageUrls, ""], imageUrl: undefined });
  }

  // ── Audio helpers ──
  function updateAudio(idx: number, url: string) {
    const next = [...audioUrls];
    next[idx] = url;
    handleChange({ audioUrls: next, audioUrl: undefined });
  }
  function removeAudio(idx: number) {
    const next = audioUrls.filter((_, i) => i !== idx);
    handleChange({ audioUrls: next, audioUrl: undefined });
  }
  function addAudio() {
    handleChange({ audioUrls: [...audioUrls, ""], audioUrl: undefined });
  }

  // ── Instructions ──
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

  const hasMedia = part.passageText || imageUrls.length > 0 || audioUrls.length > 0;
  const instrCount = (part.instructions ?? []).length;

  const mediaTabs: { key: NonNullable<MediaTab>; label: string; icon: typeof FileText; count: number }[] = [
    { key: "passage", label: "Passage",              icon: FileText, count: part.passageText ? 1 : 0 },
    { key: "audio",   label: `Audio`,                icon: Volume2,  count: audioUrls.length           },
    { key: "image",   label: `Image`,                icon: Image,    count: imageUrls.length           },
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
          {onAddQuestion && (
            <button
              onClick={onAddQuestion}
              className="flex items-center gap-1 px-2 py-1 rounded text-white/80 hover:text-white hover:bg-white/20 transition-colors text-xs font-medium"
              title="Add new question to this section"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Question
            </button>
          )}
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
              {mediaTabs.map(({ key, label, icon: Icon, count }) => {
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
                    {count > 0 && !isActive && (
                      <span className={cn(
                        "ml-0.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none",
                        count > 0 ? "w-4 h-4 bg-green-500 text-white" : ""
                      )}>
                        {count}
                      </span>
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

          {/* Image content — multiple */}
          {activeMedia === "image" && (
            <div className="space-y-3">
              {imageUrls.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No images yet — click "Add Image" below.</p>
              )}
              {imageUrls.map((url, idx) => (
                <div key={idx} className="space-y-1.5">
                  <MediaItemRow
                    url={url}
                    accept="image/*"
                    placeholder="https://example.com/image.png or upload a file →"
                    onUrlChange={(v) => updateImage(idx, v)}
                    onRemove={() => removeImage(idx)}
                  />
                  {url && (
                    <img
                      src={url}
                      alt={`Part image ${idx + 1}`}
                      className="max-h-36 rounded border object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  {idx < imageUrls.length - 1 && <hr className="border-border/60" />}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={addImage}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Image
              </Button>
            </div>
          )}

          {/* Audio content — multiple */}
          {activeMedia === "audio" && (
            <div className="space-y-3">
              {audioUrls.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No audio files yet — click "Add Audio" below.</p>
              )}
              {audioUrls.map((url, idx) => (
                <div key={idx} className="space-y-1.5">
                  <MediaItemRow
                    url={url}
                    accept="audio/*"
                    placeholder="https://example.com/audio.mp3 or upload a file →"
                    onUrlChange={(v) => updateAudio(idx, v)}
                    onRemove={() => removeAudio(idx)}
                  />
                  {url && (
                    <audio controls className="w-full" key={url}>
                      <source src={url} />
                    </audio>
                  )}
                  {idx < audioUrls.length - 1 && <hr className="border-border/60" />}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={addAudio}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Audio
              </Button>
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
