import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUpload } from "@workspace/object-storage-web";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Search, Upload, Check, Loader2, ImageIcon, Music, File as FileIcon,
} from "lucide-react";

interface MediaFile {
  id: number;
  name: string;
  originalName: string;
  mimeType: string;
  fileSize: number | null;
  objectPath: string;
  mediaType: string;
  tenantId: number | null;
  createdAt: string;
}

function getServingUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `/api/storage${path}`;
}

function guessMediaType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

const ACCEPT: Record<string, string> = {
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
};

interface MediaLibraryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "image" | "audio" | "video";
  onSelect: (objectPath: string) => void;
}

export function MediaLibraryPicker({ open, onOpenChange, type, onSelect }: MediaLibraryPickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ["media-picker", type],
    queryFn: async () => {
      const res = await fetch(`/api/media?type=${type}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load media");
      return res.json();
    },
    enabled: open,
  });

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: async (res) => {
      const contentType = res.metadata?.contentType ?? "application/octet-stream";
      const fileSize = res.metadata?.size ?? null;
      const fileName = res.metadata?.name ?? "Untitled";
      const mediaType = guessMediaType(contentType);
      try {
        const saveRes = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: fileName,
            originalName: fileName,
            mimeType: contentType,
            fileSize,
            objectPath: res.objectPath,
            mediaType,
          }),
        });
        if (saveRes.ok) {
          queryClient.invalidateQueries({ queryKey: ["media-picker", type] });
          queryClient.invalidateQueries({ queryKey: ["media"] });
          setSelected(res.objectPath);
          setUploadError(null);
        }
      } catch {
        setUploadError("Failed to save file record");
      }
    },
    onError: (err) => setUploadError(err.message),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    await uploadFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleConfirm() {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelected(null);
    }
  }

  function handleClose() {
    onOpenChange(false);
    setSelected(null);
  }

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.originalName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl flex flex-col max-h-[80vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Media Library — Select {type === "image" ? "Image" : type === "audio" ? "Audio" : "Video"}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT[type]}
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading {progress}%
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Upload New
              </>
            )}
          </Button>
        </div>

        {uploadError && (
          <p className="text-xs text-destructive flex-shrink-0">{uploadError}</p>
        )}

        <div className="overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              {type === "image" ? (
                <ImageIcon className="w-10 h-10 opacity-30" />
              ) : type === "audio" ? (
                <Music className="w-10 h-10 opacity-30" />
              ) : (
                <FileIcon className="w-10 h-10 opacity-30" />
              )}
              <p className="text-sm">
                {search ? "No files match your search." : `No ${type} files in the library yet.`}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5 mt-1"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload a file
              </Button>
            </div>
          ) : (
            <div className={cn(
              "grid gap-3 p-1",
              type === "image" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"
            )}>
              {filtered.map((file) => {
                const servingUrl = getServingUrl(file.objectPath);
                const isSelected = selected === file.objectPath;
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : file.objectPath)}
                    className={cn(
                      "relative rounded-lg border-2 overflow-hidden text-left transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-muted hover:border-muted-foreground/40"
                    )}
                  >
                    {type === "image" ? (
                      <div className="aspect-square bg-muted/40">
                        <img
                          src={servingUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 mt-0.5">{file.mediaType}</Badge>
                        </div>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 flex-shrink-0 pt-2 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selected}
          >
            Use Selected
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
