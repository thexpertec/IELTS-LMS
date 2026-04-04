import { useRef, useState } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon, Music, Video, Upload, X, CheckCircle2, Loader2,
} from "lucide-react";

interface MediaUploadFieldProps {
  type: "image" | "audio" | "video";
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
}

const CONFIG = {
  image: {
    accept: "image/*",
    Icon: ImageIcon,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Image",
    description: "PNG, JPG, GIF, WEBP",
  },
  audio: {
    accept: "audio/*",
    Icon: Music,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    label: "Audio",
    description: "MP3, WAV, OGG, M4A",
  },
  video: {
    accept: "video/*",
    Icon: Video,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    label: "Video File",
    description: "MP4, WEBM, MOV",
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (res) => {
      onChange(res.objectPath);
      setUploadError(null);
    },
    onError: (err) => {
      setUploadError(err.message);
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadError(null);
    await uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

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
              <div className="relative">
                <img
                  src={servingUrl}
                  alt="Lesson image"
                  className="max-h-48 w-full object-contain rounded-md bg-muted/30"
                />
              </div>
            )}
            {(type === "audio") && (
              <audio
                controls
                className="w-full h-10 rounded-md"
                src={servingUrl}
              >
                Your browser does not support the audio element.
              </audio>
            )}
            {type === "video" && (
              <video
                controls
                className="max-h-40 w-full rounded-md bg-black"
                src={servingUrl}
              />
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasValue && !isUploading && (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.bg)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Upload a {config.label.toLowerCase()} file
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{config.description}</p>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Uploading{fileName ? ` "${fileName}"` : ""}… {progress}%
            </p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {uploadError && (
          <p className="text-xs text-destructive mt-1">{uploadError}</p>
        )}

        {/* Actions */}
        <div className={cn("flex items-center gap-2", hasValue ? "mt-2" : "mt-0 justify-center")}>
          <input
            ref={inputRef}
            type="file"
            accept={config.accept}
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant={hasValue ? "outline" : "secondary"}
            size="sm"
            className={cn("gap-1.5 text-xs", hasValue ? "h-7" : "h-8")}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-3.5 h-3.5" />
            {hasValue ? "Replace" : `Upload ${config.label}`}
          </Button>
          {hasValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive gap-1"
              onClick={() => { onChange(null); setFileName(null); }}
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </Button>
          )}
          {hasValue && !isUploading && (
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
