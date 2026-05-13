import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon, Music, Video, Upload, X, CheckCircle2,
} from "lucide-react";
import { MediaLibraryPicker } from "@/components/ui/media-library-picker";

interface MediaUploadFieldProps {
  type: "image" | "audio" | "video";
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
}

const CONFIG = {
  image: {
    Icon: ImageIcon,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Image",
    description: "Pick from library or upload a new file",
  },
  audio: {
    Icon: Music,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    label: "Audio",
    description: "Pick from library or upload a new file",
  },
  video: {
    Icon: Video,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    label: "Video File",
    description: "Pick from library or upload a new file",
  },
};

function getServingUrl(path: string) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `/api/storage${path}`;
}

export function MediaUploadField({ type, value, onChange, label, className }: MediaUploadFieldProps) {
  const config = CONFIG[type];
  const { Icon } = config;
  const [pickerOpen, setPickerOpen] = useState(false);

  const servingUrl = value ? getServingUrl(value) : null;
  const hasValue = !!value;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-4 transition-colors",
          hasValue ? cn(config.bg, config.border) : "border-muted-foreground/25 hover:border-muted-foreground/40",
        )}
      >
        {/* Preview area */}
        {hasValue && servingUrl && (
          <div className="mb-3">
            {type === "image" && (
              <img
                src={servingUrl}
                alt="Uploaded image"
                className="max-h-48 w-full object-contain rounded-md bg-muted/30"
              />
            )}
            {type === "audio" && (
              <audio controls className="w-full h-10 rounded-md" src={servingUrl}>
                Your browser does not support the audio element.
              </audio>
            )}
            {type === "video" && (
              <video controls className="max-h-40 w-full rounded-md bg-black" src={servingUrl} />
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasValue && (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.bg)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No {config.label.toLowerCase()} selected</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{config.description}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={cn("flex items-center gap-2", hasValue ? "mt-2" : "mt-0 justify-center")}>
          <Button
            type="button"
            variant={hasValue ? "outline" : "secondary"}
            size="sm"
            className={cn("gap-1.5 text-xs", hasValue ? "h-7" : "h-8")}
            onClick={() => setPickerOpen(true)}
          >
            <Upload className="w-3.5 h-3.5" />
            {hasValue ? "Replace" : `Select ${config.label}`}
          </Button>
          {hasValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive gap-1"
              onClick={() => onChange(null)}
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </Button>
          )}
          {hasValue && (
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Uploaded
            </div>
          )}
        </div>
      </div>

      <MediaLibraryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        type={type}
        onSelect={(path) => onChange(path)}
      />
    </div>
  );
}
