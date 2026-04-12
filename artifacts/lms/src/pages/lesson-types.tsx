import { useState } from "react";
import {
  useListLessonTypes,
  useCreateLessonType,
  useUpdateLessonType,
  useDeleteLessonType,
  getListLessonTypesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookText, PenLine, Headphones, Mic, AlignLeft, BookMarked, Volume2,
  Languages, BookOpen, Brain, MessageSquare, Pencil, Globe, Star, Zap,
  Target, Music, FileText, Play, Layers, Plus, Trash2, Check, X, GripVertical,
  ChevronUp, ChevronDown, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Icon options ──────────────────────────────────────────────────────────────

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookText, PenLine, Headphones, Mic, AlignLeft, BookMarked, Volume2,
  Languages, BookOpen, Brain, MessageSquare, Pencil, Globe, Star, Zap,
  Target, Music, FileText, Play, Layers,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

// ── Color presets ─────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { label: "Blue",   color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/30" },
  { label: "Purple", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { label: "Green",  color: "text-green-600",  bg: "bg-green-50 dark:bg-green-950/30" },
  { label: "Orange", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  { label: "Rose",   color: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-950/30" },
  { label: "Amber",  color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30" },
  { label: "Sky",    color: "text-sky-600",    bg: "bg-sky-50 dark:bg-sky-950/30" },
  { label: "Teal",   color: "text-teal-600",   bg: "bg-teal-50 dark:bg-teal-950/30" },
  { label: "Indigo", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  { label: "Pink",   color: "text-pink-600",   bg: "bg-pink-50 dark:bg-pink-950/30" },
  { label: "Red",    color: "text-red-600",    bg: "bg-red-50 dark:bg-red-950/30" },
  { label: "Cyan",   color: "text-cyan-600",   bg: "bg-cyan-50 dark:bg-cyan-950/30" },
];

// ── Type ──────────────────────────────────────────────────────────────────────

type LessonTypeRow = {
  id: number; key: string; label: string; icon: string;
  color: string; bg: string; order: number; isActive: boolean;
};

type FormState = {
  key: string; label: string; icon: string; color: string; bg: string; isActive: boolean;
};

const EMPTY_FORM: FormState = {
  key: "", label: "", icon: "BookOpen", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", isActive: true,
};

// ── TypeForm ──────────────────────────────────────────────────────────────────

function TypeForm({
  value, onChange, onSave, onCancel, isEdit = false,
}: {
  value: FormState;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  const selectedPreset = COLOR_PRESETS.find((p) => p.color === value.color);
  const IconComponent = ICON_MAP[value.icon] ?? BookOpen;

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lt-key">Key <span className="text-muted-foreground text-xs">(slug, no spaces)</span></Label>
          <Input
            id="lt-key"
            value={value.key}
            onChange={(e) => onChange({ ...value, key: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
            placeholder="e.g. reading"
            disabled={isEdit}
            className={isEdit ? "opacity-60" : ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lt-label">Label</Label>
          <Input
            id="lt-label"
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            placeholder="e.g. Reading"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-1.5">
          {ICON_OPTIONS.map((name) => {
            const Icon = ICON_MAP[name]!;
            const isSelected = value.icon === name;
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => onChange({ ...value, icon: name })}
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center border transition-colors",
                  isSelected
                    ? "bg-primary/10 border-primary text-primary"
                    : "hover:bg-muted border-transparent text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = value.color === preset.color;
            return (
              <button
                key={preset.label}
                type="button"
                title={preset.label}
                onClick={() => onChange({ ...value, color: preset.color, bg: preset.bg })}
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected ? "border-foreground scale-110" : "border-transparent"
                )}
              >
                <div className={cn("w-5 h-5 rounded-full", preset.bg.split(" ")[0])}>
                  <div className={cn("w-full h-full rounded-full flex items-center justify-center", preset.color)}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {selectedPreset && (
          <p className="text-xs text-muted-foreground">{selectedPreset.label}</p>
        )}
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Preview:</span>
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border", value.bg, value.color)}>
          <IconComponent className="w-3 h-3" />
          {value.label || "Label"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="lt-active"
          checked={value.isActive}
          onCheckedChange={(v) => onChange({ ...value, isActive: v })}
        />
        <Label htmlFor="lt-active" className="cursor-pointer">Active</Label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} className="gap-1.5">
          <Check className="w-3.5 h-3.5" /> {isEdit ? "Save changes" : "Add lesson type"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1.5">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LessonTypesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: types = [], isLoading } = useListLessonTypes();
  const createMutation = useCreateLessonType();
  const updateMutation = useUpdateLessonType();
  const deleteMutation = useDeleteLessonType();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListLessonTypesQueryKey() });

  function handleAdd() {
    if (!addForm.key.trim() || !addForm.label.trim()) {
      toast({ title: "Key and label are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(
      { data: { key: addForm.key, label: addForm.label, icon: addForm.icon, color: addForm.color, bg: addForm.bg, isActive: addForm.isActive } },
      {
        onSuccess: () => {
          toast({ title: "Lesson type created" });
          setShowAdd(false);
          setAddForm(EMPTY_FORM);
          invalidate();
        },
        onError: (err) => {
          toast({ title: "Failed to create", description: (err as Error).message, variant: "destructive" });
        },
      }
    );
  }

  function startEdit(lt: LessonTypeRow) {
    setEditingId(lt.id);
    setEditForm({ key: lt.key, label: lt.label, icon: lt.icon, color: lt.color, bg: lt.bg, isActive: lt.isActive });
  }

  function handleSaveEdit() {
    if (!editingId) return;
    updateMutation.mutate(
      { id: editingId, data: { label: editForm.label, icon: editForm.icon, color: editForm.color, bg: editForm.bg, isActive: editForm.isActive } },
      {
        onSuccess: () => {
          toast({ title: "Lesson type updated" });
          setEditingId(null);
          invalidate();
        },
        onError: () => {
          toast({ title: "Failed to update", variant: "destructive" });
        },
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Lesson type deleted" });
          invalidate();
        },
        onError: () => {
          toast({ title: "Failed to delete", variant: "destructive" });
        },
      }
    );
  }

  function handleMove(lt: LessonTypeRow, direction: "up" | "down") {
    const sorted = [...types].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((t) => t.id === lt.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx]!;

    updateMutation.mutate({ id: lt.id, data: { order: other.order } });
    updateMutation.mutate(
      { id: other.id, data: { order: lt.order } },
      { onSuccess: () => invalidate() }
    );
  }

  const sorted = [...types].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Lesson Types</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage the lesson type tabs shown in course curriculum (Reading, Writing, Listening…)
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); setEditingId(null); }} disabled={showAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Type
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <TypeForm
          value={addForm}
          onChange={setAddForm}
          onSave={handleAdd}
          onCancel={() => { setShowAdd(false); setAddForm(EMPTY_FORM); }}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Layers className="w-8 h-8 mb-3 opacity-40" />
          <p className="font-medium">No lesson types yet</p>
          <p className="text-sm opacity-70">Click "Add Type" to create the first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((lt, idx) => {
            const IconComponent = ICON_MAP[lt.icon] ?? BookOpen;
            const isEditing = editingId === lt.id;

            if (isEditing) {
              return (
                <TypeForm
                  key={lt.id}
                  value={editForm}
                  onChange={setEditForm}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                  isEdit
                />
              );
            }

            return (
              <div
                key={lt.id}
                className={cn(
                  "flex items-center gap-3 p-3.5 border rounded-xl bg-card transition-colors",
                  !lt.isActive && "opacity-60"
                )}
              >
                {/* Order controls */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => handleMove(lt, "up")}
                    disabled={idx === 0}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(lt, "down")}
                    disabled={idx === sorted.length - 1}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Icon preview */}
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", lt.bg)}>
                  <IconComponent className={cn("w-4 h-4", lt.color)} />
                </div>

                {/* Label + key */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{lt.label}</span>
                    {!lt.isActive && <Badge variant="outline" className="text-[10px] px-1 py-0">Inactive</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{lt.key}</span>
                </div>

                {/* Color swatch */}
                <div className={cn("w-4 h-4 rounded-full shrink-0", lt.bg.split(" ")[0])}>
                  <div className={cn("w-full h-full rounded-full flex items-center justify-center", lt.color)}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => startEdit(lt)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{lt.label}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the lesson type. Existing lessons with this type will still show in the curriculum but won't match any tab.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(lt.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
