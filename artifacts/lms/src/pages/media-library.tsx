import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Upload, Trash2, Copy, ImageIcon, Music, Video, File as FileIcon,
  Search, Check, Loader2, X,
} from "lucide-react";

type MediaType = "all" | "image" | "audio" | "video" | "document";

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

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function guessMediaType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

const TABS: { label: string; value: MediaType }[] = [
  { label: "All", value: "all" },
  { label: "Images", value: "image" },
  { label: "Audio", value: "audio" },
  { label: "Video", value: "video" },
  { label: "Documents", value: "document" },
];

function MediaCard({ file, onDelete }: { file: MediaFile; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const servingUrl = getServingUrl(file.objectPath);

  function copyUrl() {
    navigator.clipboard.writeText(file.objectPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="relative bg-muted/40 aspect-video flex items-center justify-center overflow-hidden">
        {file.mediaType === "image" ? (
          <img
            src={servingUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : file.mediaType === "audio" ? (
          <div className="flex flex-col items-center gap-2 p-4 w-full">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Music className="w-6 h-6 text-amber-600" />
            </div>
            <audio controls className="w-full h-8 mt-1" src={servingUrl} />
          </div>
        ) : file.mediaType === "video" ? (
          <div className="flex flex-col items-center gap-2 w-full h-full">
            <video className="w-full h-full object-cover" src={servingUrl} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" className="h-8 text-xs gap-1.5" onClick={copyUrl}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Path"}
          </Button>
          {!confirmDelete ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs gap-1.5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={onDelete}>
                Confirm
              </Button>
              <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => setConfirmDelete(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
            {file.mediaType}
          </Badge>
          {file.fileSize && (
            <span className="text-xs text-muted-foreground">{formatBytes(file.fileSize)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MediaLibrary() {
  const [activeTab, setActiveTab] = useState<MediaType>("all");
  const [search, setSearch] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<{ done: number; total: number; current: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const anyInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ["media", activeTab],
    queryFn: async () => {
      const params = activeTab !== "all" ? `?type=${activeTab}` : "";
      const res = await fetch(`/api/media${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load media");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast({ title: "File deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
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
        if (!saveRes.ok) {
          const err = await saveRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to save file record");
        }
        queryClient.invalidateQueries({ queryKey: ["media"] });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Failed to save file");
      }
    },
    onError: (err) => {
      setUploadError(err.message);
    },
  });

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadQueue({ done: i, total: files.length, current: file.name });
      await uploadFile(file);
    }

    setUploadQueue(null);
    queryClient.invalidateQueries({ queryKey: ["media"] });
    toast({
      title: files.length === 1
        ? "File uploaded successfully"
        : `${files.length} files uploaded successfully`,
    });
  }

  const filtered = files.filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.originalName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your images, audio, and video files.</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />
          <input ref={audioInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />
          <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />
          <input ref={anyInputRef} type="file" accept="*/*" multiple className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />
          <Button onClick={() => anyInputRef.current?.click()} disabled={isUploading || !!uploadQueue} className="gap-2">
            {uploadQueue ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading {uploadQueue.done + 1}/{uploadQueue.total}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Files
              </>
            )}
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          Upload failed: {uploadError}
        </div>
      )}

      {/* Upload progress bar */}
      {uploadQueue && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {uploadQueue.total > 1
                ? `Uploading ${uploadQueue.done + 1} of ${uploadQueue.total}: ${uploadQueue.current}`
                : `Uploading ${uploadQueue.current}…`}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick upload chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Quick upload:</span>
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={!!uploadQueue}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Image
        </button>
        <button
          onClick={() => audioInputRef.current?.click()}
          disabled={!!uploadQueue}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Music className="w-3.5 h-3.5 text-amber-600" /> Audio
        </button>
        <button
          onClick={() => videoInputRef.current?.click()}
          disabled={!!uploadQueue}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Video className="w-3.5 h-3.5 text-blue-600" /> Video
        </button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-1 border rounded-lg p-1 bg-muted/30">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} file{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border rounded-xl border-dashed bg-muted/20">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold">No files yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {search ? "No files match your search." : "Upload your first file to get started."}
          </p>
          {!search && (
            <Button onClick={() => anyInputRef.current?.click()} disabled={!!uploadQueue} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((file) => (
            <MediaCard
              key={file.id}
              file={file}
              onDelete={() => deleteMutation.mutate(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
