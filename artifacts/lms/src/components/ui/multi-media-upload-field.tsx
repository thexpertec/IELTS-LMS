import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MediaUploadField } from "@/components/ui/media-upload-field";
import { MediaLibraryPicker } from "@/components/ui/media-library-picker";
import { Plus } from "lucide-react";

interface MultiMediaUploadFieldProps {
  type: "image" | "audio";
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
}

export function MultiMediaUploadField({ type, label, values, onChange }: MultiMediaUploadFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function updateAt(idx: number, url: string | null) {
    if (url === null) {
      onChange(values.filter((_, i) => i !== idx));
    } else {
      const next = [...values];
      next[idx] = url;
      onChange(next);
    }
  }

  function handlePickerSelect(path: string) {
    onChange([...values, path]);
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none">
        {label}
      </label>

      {values.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center">
          <p className="text-sm text-muted-foreground">No files added yet</p>
        </div>
      )}

      {values.map((url, idx) => (
        <MediaUploadField
          key={idx}
          type={type}
          value={url || null}
          onChange={(v) => updateAt(idx, v)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs w-full"
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="w-3.5 h-3.5" />
        Add {label}
      </Button>

      <MediaLibraryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        type={type}
        onSelect={handlePickerSelect}
      />
    </div>
  );
}
