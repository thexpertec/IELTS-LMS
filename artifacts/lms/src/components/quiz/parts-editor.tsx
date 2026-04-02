import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export interface QuizPart {
  name: string;
  from: number;
  to: number;
}

interface PartsEditorProps {
  value: QuizPart[];
  onChange: (parts: QuizPart[]) => void;
  totalQuestions?: number;
}

export function PartsEditor({ value, onChange, totalQuestions }: PartsEditorProps) {
  function addPart() {
    const nextNum = value.length + 1;
    const lastTo = value[value.length - 1]?.to ?? 0;
    onChange([
      ...value,
      { name: `Part ${nextNum}`, from: lastTo + 1, to: lastTo + 10 },
    ]);
  }

  function removePart(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function updatePart(i: number, field: keyof QuizPart, raw: string) {
    const updated = [...value];
    if (field === "name") {
      updated[i] = { ...updated[i], name: raw };
    } else {
      const num = parseInt(raw, 10);
      if (!isNaN(num)) updated[i] = { ...updated[i], [field]: num };
    }
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Question Parts{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (groups shown in the quiz footer)
          </span>
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addPart}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Part
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No parts defined — all questions will appear ungrouped.
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[1fr_5rem_5rem_2.5rem] gap-0 text-xs font-semibold text-muted-foreground bg-muted px-3 py-2">
            <span>Part Name</span>
            <span className="text-center">From Q#</span>
            <span className="text-center">To Q#</span>
            <span />
          </div>
          <div className="divide-y">
            {value.map((part, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_5rem_5rem_2.5rem] gap-0 items-center px-3 py-2"
              >
                <Input
                  className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 px-0"
                  value={part.name}
                  onChange={(e) => updatePart(i, "name", e.target.value)}
                  placeholder="Part name…"
                />
                <Input
                  type="number"
                  min={1}
                  max={totalQuestions ?? 999}
                  className="h-8 text-sm text-center border-0 shadow-none focus-visible:ring-0"
                  value={part.from}
                  onChange={(e) => updatePart(i, "from", e.target.value)}
                />
                <Input
                  type="number"
                  min={1}
                  max={totalQuestions ?? 999}
                  className="h-8 text-sm text-center border-0 shadow-none focus-visible:ring-0"
                  value={part.to}
                  onChange={(e) => updatePart(i, "to", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removePart(i)}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {value.length > 0 && totalQuestions !== undefined && (
        <p className="text-xs text-muted-foreground">
          Quiz has {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}.
          Uncovered questions will appear after the last defined part.
        </p>
      )}
    </div>
  );
}
